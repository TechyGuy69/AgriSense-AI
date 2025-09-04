import { useState, useEffect, useRef } from 'react';
import { Map, Layers, Eye, EyeOff, Download, Satellite, MapPin, Search, Navigation, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MapViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const googleMapRef = useRef<any>(null);
  const autocomplete = useRef<any>(null);
  const userLocationMarker = useRef<any>(null);
  const watchId = useRef<number | null>(null);
  const overlaysRef = useRef<any>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'hybrid' | 'terrain'>('satellite');
  const { toast } = useToast();

  const [activeLayers, setActiveLayers] = useState({
    rgb: true,
    ndvi: false,
    stress: true,
    confidence: false,
    alerts: true,
  });

  const layers = [
    { id: 'rgb', name: 'RGB Imagery', description: 'True color satellite imagery', color: '#3b82f6' },
    { id: 'ndvi', name: 'NDVI', description: 'Normalized Difference Vegetation Index', color: '#22c55e' },
    { id: 'stress', name: 'Stress Heatmap', description: 'Crop stress risk analysis', color: '#ef4444' },
    { id: 'confidence', name: 'Confidence Layer', description: 'Model prediction confidence', color: '#8b5cf6' },
    { id: 'alerts', name: 'Alert Polygons', description: 'High-risk area boundaries', color: '#f59e0b' },
  ];

  // Sample field coordinates (can be made dynamic)
  const fieldPolygon = [
    { lat: 40.7831, lng: -73.9712 },
    { lat: 40.7851, lng: -73.9712 },
    { lat: 40.7851, lng: -73.9682 },
    { lat: 40.7831, lng: -73.9682 },
  ];

  const createMapOverlays = (google: any, map: any) => {
    // Field boundary polygon (always visible for RGB)
    const fieldArea = new google.maps.Polygon({
      paths: fieldPolygon,
      strokeColor: '#22c55e',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#22c55e',
      fillOpacity: 0.15,
    });
    
    // NDVI overlay (green gradient)
    const ndviArea = new google.maps.Polygon({
      paths: fieldPolygon,
      strokeColor: '#16a34a',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: '#22c55e',
      fillOpacity: 0.4,
    });

    // Stress heatmap rectangles
    const stressZones = [
      new google.maps.Rectangle({
        bounds: { north: 40.7840, south: 40.7835, east: -73.9700, west: -73.9710 },
        fillColor: '#ef4444',
        fillOpacity: 0.6,
        strokeWeight: 0,
      }),
      new google.maps.Rectangle({
        bounds: { north: 40.7848, south: 40.7843, east: -73.9692, west: -73.9702 },
        fillColor: '#f59e0b',
        fillOpacity: 0.5,
        strokeWeight: 0,
      }),
    ];

    // Confidence overlay (purple tint)
    const confidenceArea = new google.maps.Polygon({
      paths: fieldPolygon,
      strokeColor: '#8b5cf6',
      strokeOpacity: 0.7,
      strokeWeight: 2,
      fillColor: '#8b5cf6',
      fillOpacity: 0.2,
    });

    // Alert markers
    const alertMarkers = [
      new google.maps.Marker({
        position: { lat: 40.7837, lng: -73.9705 },
        map: null,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#f59e0b',
          fillOpacity: 0.9,
          scale: 6,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Alert: Irrigation needed',
      }),
      new google.maps.Marker({
        position: { lat: 40.7845, lng: -73.9688 },
        map: null,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#f59e0b',
          fillOpacity: 0.9,
          scale: 6,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: 'Alert: Nutrient deficiency detected',
      }),
    ];

    // Store overlays for layer control
    overlaysRef.current = {
      rgb: fieldArea,
      ndvi: ndviArea,
      stress: stressZones,
      confidence: confidenceArea,
      alerts: alertMarkers,
    };

    // Set initial visibility based on active layers
    updateLayerVisibility();
  };

  const updateLayerVisibility = () => {
    if (!googleMapRef.current || !overlaysRef.current) return;

    Object.keys(overlaysRef.current).forEach(layerId => {
      const isActive = activeLayers[layerId as keyof typeof activeLayers];
      const overlay = overlaysRef.current[layerId];

      if (Array.isArray(overlay)) {
        // Handle arrays (like stress zones or alert markers)
        overlay.forEach((item: any) => {
          item.setMap(isActive ? googleMapRef.current : null);
        });
      } else {
        // Handle single overlays
        overlay.setMap(isActive ? googleMapRef.current : null);
      }
    });
  };

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        setUserLocation(location);
        
        if (googleMapRef.current) {
          googleMapRef.current.setCenter(location);
          googleMapRef.current.setZoom(15);
          
          // Remove existing user location marker
          if (userLocationMarker.current) {
            userLocationMarker.current.setMap(null);
          }
          
          // Add new user location marker
          userLocationMarker.current = new (window as any).google.maps.Marker({
            position: location,
            map: googleMapRef.current,
            title: 'Your Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="blue" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                </svg>
              `),
              scaledSize: new (window as any).google.maps.Size(24, 24),
            },
          });
        }
        
        toast({
          title: 'Location found',
          description: 'Centered map on your current location.',
        });
      },
      (error) => {
        let message = 'Could not get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        
        toast({
          title: 'Location error',
          description: message,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Start watching user's location
  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocation not supported',
        description: 'Your browser does not support location services.',
        variant: 'destructive',
      });
      return;
    }

    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        
        setUserLocation(location);
        
        if (userLocationMarker.current) {
          userLocationMarker.current.setPosition(location);
        } else if (googleMapRef.current) {
          userLocationMarker.current = new (window as any).google.maps.Marker({
            position: location,
            map: googleMapRef.current,
            title: 'Your Location (Live)',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="blue" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <circle cx="12" cy="12" r="3" fill="white"/>
                  <circle cx="12" cy="12" r="6" fill="none" stroke="blue" stroke-width="1" opacity="0.3"/>
                </svg>
              `),
              scaledSize: new (window as any).google.maps.Size(24, 24),
            },
          });
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );

    toast({
      title: 'Location tracking started',
      description: 'Your location will be updated in real-time.',
    });
  };

  // Stop watching user's location
  const stopLocationTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
      
      toast({
        title: 'Location tracking stopped',
        description: 'Real-time location updates disabled.',
      });
    }
  };

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Get API key from Supabase secrets
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (error) throw error;
        
        const apiKey = data?.apiKey;
        if (!apiKey) throw new Error('No API key found');

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['geometry', 'drawing', 'places']
        });

        const google = await loader.load();
        
        if (mapRef.current) {
          const map = new google.maps.Map(mapRef.current, {
            center: { lat: 40.7841, lng: -73.9697 },
            zoom: 16,
            mapTypeId: mapType,
            tilt: 0,
            heading: 0,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });

          // Initialize Places Autocomplete
          if (searchInputRef.current) {
            autocomplete.current = new (window as any).google.maps.places.Autocomplete(searchInputRef.current, {
              types: ['geocode'],
              fields: ['place_id', 'geometry', 'name', 'formatted_address'],
            });

            autocomplete.current.addListener('place_changed', () => {
              const place = autocomplete.current?.getPlace();
              if (place?.geometry?.location) {
                map.setCenter(place.geometry.location);
                map.setZoom(15);
                
                new (window as any).google.maps.Marker({
                  position: place.geometry.location,
                  map: map,
                  title: place.name || place.formatted_address,
                  icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    `),
                    scaledSize: new (window as any).google.maps.Size(32, 32),
                  },
                });

                toast({
                  title: 'Location found',
                  description: place.formatted_address || place.name || 'Location added to map',
                });
              }
            });
          }

          // Create overlays
          createMapOverlays(google, map);
          
          googleMapRef.current = map;
          setMapLoaded(true);
        }
      } catch (error: any) {
        console.error('Map initialization error:', error);
        toast({
          title: 'Map loading failed',
          description: 'Unable to load Google Maps. Please check API key.',
          variant: 'destructive',
        });
      }
    };

    initializeMap();
  }, [mapType, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  // Update layer visibility when activeLayers changes
  useEffect(() => {
    updateLayerVisibility();
  }, [activeLayers]);

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => {
      const newState = {
        ...prev,
        [layerId]: !prev[layerId as keyof typeof prev],
      };
      
      toast({
        title: `Layer ${newState[layerId as keyof typeof newState] ? 'enabled' : 'disabled'}`,
        description: `${layers.find(l => l.id === layerId)?.name} layer toggled`,
      });
      
      return newState;
    });
  };

  const changeMapType = (type: 'satellite' | 'hybrid' | 'terrain') => {
    setMapType(type);
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(type);
    }
  };

  return (
    <div className="h-full space-y-4">
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder="Search for places, fields, or coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Location Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            className="flex items-center gap-2"
          >
            <Crosshair className="h-4 w-4" />
            My Location
          </Button>
          
          <Button
            variant={watchId.current ? "destructive" : "outline"}
            size="sm"
            onClick={watchId.current ? stopLocationTracking : startLocationTracking}
            className="flex items-center gap-2"
          >
            <Navigation className="h-4 w-4" />
            {watchId.current ? 'Stop Tracking' : 'Track Live'}
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Interactive Field Map
          </h1>
          <p className="text-muted-foreground">
            Real-time visualization of crop health and risk assessment
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Map
          </Button>
        </div>
      </div>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Map Area */}
        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
          {/* Google Maps Container */}
          <div ref={mapRef} className="w-full h-full" />
          
          {/* Loading overlay */}
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="h-8 w-8 animate-pulse mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Loading field map...</p>
              </div>
            </div>
          )}

          {/* Map Type Controls */}
          <div className="absolute top-4 left-4 space-y-2">
            <div className="flex flex-col space-y-1">
              <Button
                variant={mapType === 'satellite' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => changeMapType('satellite')}
              >
                <Satellite className="h-4 w-4 mr-1" />
                Satellite
              </Button>
              <Button
                variant={mapType === 'hybrid' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => changeMapType('hybrid')}
              >
                <Map className="h-4 w-4 mr-1" />
                Hybrid
              </Button>
              <Button
                variant={mapType === 'terrain' ? 'default' : 'secondary'}
                size="sm"
                onClick={() => changeMapType('terrain')}
              >
                Terrain
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4">
            <Card className="w-48 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Field Legend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Field Boundary</span>
                    <div className="w-4 h-3 border-2 border-green-500 bg-green-500/20 rounded"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>High Stress</span>
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium Stress</span>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overlay Info */}
          <div className="absolute top-4 right-4">
            <Card className="shadow-card">
              <CardContent className="p-3">
                <div className="text-sm space-y-1">
                  <div className="font-semibold text-foreground">Field Analysis</div>
                  <div className="text-muted-foreground">Area: 45.2 hectares</div>
                  <div className="text-muted-foreground">Coordinates: 40.784°N, 73.970°W</div>
                  <div className="text-muted-foreground">Avg NDVI: 0.72</div>
                  <div className="text-muted-foreground">Risk Level: Low</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Layer Panel */}
        <Card className="w-80 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Layers className="h-5 w-5" />
              <span>Map Layers</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {layers.map((layer) => (
              <div key={layer.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: layer.color }}
                    />
                    {activeLayers[layer.id as keyof typeof activeLayers] ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">{layer.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {layer.description}
                  </p>
                </div>
                <Switch
                  checked={activeLayers[layer.id as keyof typeof activeLayers]}
                  onCheckedChange={() => toggleLayer(layer.id)}
                />
              </div>
            ))}

            <div className="pt-4 border-t border-border">
              <Button variant="hero" className="w-full">
                Export Map Data
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h4 className="font-semibold text-foreground">Quick Stats</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Healthy Area</span>
                  <span className="text-primary font-medium">38.1 ha (84%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stressed Area</span>
                  <span className="text-orange-500 font-medium">5.2 ha (12%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Critical Area</span>
                  <span className="text-destructive font-medium">1.9 ha (4%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MapViewer;