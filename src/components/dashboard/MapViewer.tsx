import { useState, useEffect, useRef } from 'react';
import { Map, Layers, Eye, Download, Satellite, MapPin, Navigation, Crosshair, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ExportActions from '@/components/actions/ExportActions';

const MapViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const userLocationMarker = useRef<any>(null);
  const watchId = useRef<number | null>(null);
  const overlaysRef = useRef<any>({});
  const [mapLoaded, setMapLoaded] = useState(false);
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
    const fieldArea = new google.maps.Polygon({
      paths: fieldPolygon,
      strokeColor: '#22c55e',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#22c55e',
      fillOpacity: 0.15,
    });
    
    const ndviArea = new google.maps.Polygon({
      paths: fieldPolygon,
      strokeColor: '#16a34a',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      fillColor: '#22c55e',
      fillOpacity: 0.4,
    });

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

    const confidenceArea = new google.maps.Polygon({
      paths: fieldPolygon,
      strokeColor: '#8b5cf6',
      strokeOpacity: 0.7,
      strokeWeight: 2,
      fillColor: '#8b5cf6',
      fillOpacity: 0.2,
    });

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

    overlaysRef.current = {
      rgb: fieldArea,
      ndvi: ndviArea,
      stress: stressZones,
      confidence: confidenceArea,
      alerts: alertMarkers,
    };

    updateLayerVisibility();
  };

  const updateLayerVisibility = () => {
    if (!googleMapRef.current || !overlaysRef.current) return;

    Object.keys(overlaysRef.current).forEach(layerId => {
      const isActive = activeLayers[layerId as keyof typeof activeLayers];
      const overlay = overlaysRef.current[layerId];

      if (Array.isArray(overlay)) {
        overlay.forEach((item: any) => {
          item.setMap(isActive ? googleMapRef.current : null);
        });
      } else {
        overlay.setMap(isActive ? googleMapRef.current : null);
      }
    });
  };

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
          
          if (userLocationMarker.current) {
            userLocationMarker.current.setMap(null);
          }
          
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
        const { data, error } = await supabase.functions.invoke('get-maps-key');
        if (error) throw error;
        
        const apiKey = data?.apiKey;
        if (!apiKey) throw new Error('No API key found');

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['geometry', 'drawing', 'places', 'marker']
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

  useEffect(() => {
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

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
      {/* Location Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Interactive Field Map
          </h1>
          <p className="text-muted-foreground">
            Real-time visualization of crop health and risk assessment
          </p>
        </div>
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

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Map Area */}
        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden">
          <div ref={mapRef} className="w-full h-full" />
          
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
                <Mountain className="h-4 w-4 mr-1" />
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
          <div className="absolute bottom-4 right-4">
            <Card className="w-64 shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Map Actions</span>
                  <Eye className="h-4 w-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-1">
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="h-3 w-3 mr-1" />
                    Export
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    Save View
                  </Button>
                </div>
                {userLocation && (
                  <div className="text-xs text-muted-foreground">
                    Location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Layer Control Panel */}
        <div className="w-80 space-y-4">
          {/* Export and Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Map Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ExportActions dataType="map" />
              <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                  Generate Field Report
                </Button>
                <Button variant="outline" size="sm" className="flex items-center gap-1 text-xs">
                  Schedule Field Visit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Layer Controls */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Data Layers</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {layers.map((layer) => (
                  <div key={layer.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: layer.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{layer.name}</p>
                        <p className="text-xs text-muted-foreground">{layer.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={activeLayers[layer.id as keyof typeof activeLayers]}
                      onCheckedChange={() => toggleLayer(layer.id)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Field Stats */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Live Field Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Field Area</span>
                  <span className="text-sm font-medium">45.2 ha</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg NDVI</span>
                  <span className="text-sm font-medium text-green-600">0.72</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Risk Areas</span>
                  <span className="text-sm font-medium text-orange-600">2 zones</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm font-medium">2 min ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Field Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium">Irrigation needed</p>
                    <p className="text-xs text-muted-foreground">Sector A moisture low</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-xs font-medium">Nutrient deficiency</p>
                    <p className="text-xs text-muted-foreground">Eastern boundary</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MapViewer;
