import { useState, useEffect, useRef } from 'react';
import { Map, Layers, Eye, EyeOff, Download, Satellite, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const MapViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<'satellite' | 'hybrid' | 'terrain'>('satellite');
  const { toast } = useToast();

  const [activeLayers, setActiveLayers] = useState({
    rgb: true,
    ndvi: true,
    stress: false,
    confidence: false,
    alerts: true,
  });

  const layers = [
    { id: 'rgb', name: 'RGB Imagery', description: 'True color satellite imagery' },
    { id: 'ndvi', name: 'NDVI', description: 'Normalized Difference Vegetation Index' },
    { id: 'stress', name: 'Stress Heatmap', description: 'Crop stress risk analysis' },
    { id: 'confidence', name: 'Confidence Layer', description: 'Model prediction confidence' },
    { id: 'alerts', name: 'Alert Polygons', description: 'High-risk area boundaries' },
  ];

  // Sample field coordinates (can be made dynamic)
  const fieldPolygon = [
    { lat: 40.7831, lng: -73.9712 },
    { lat: 40.7851, lng: -73.9712 },
    { lat: 40.7851, lng: -73.9682 },
    { lat: 40.7831, lng: -73.9682 },
  ];

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
          libraries: ['geometry', 'drawing']
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

          // Add field polygon overlay
          const fieldArea = new google.maps.Polygon({
            paths: fieldPolygon,
            strokeColor: '#22c55e',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#22c55e',
            fillOpacity: 0.15,
          });
          fieldArea.setMap(map);

          // Add sample stress markers
          const stressMarkers = [
            { lat: 40.7835, lng: -73.9705, severity: 'high' },
            { lat: 40.7845, lng: -73.9690, severity: 'medium' },
          ];

          stressMarkers.forEach(point => {
            const marker = new google.maps.Marker({
              position: point,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: point.severity === 'high' ? '#ef4444' : '#f59e0b',
                fillOpacity: 0.8,
                scale: 8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
              title: `${point.severity.toUpperCase()} stress area`,
            });
          });

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

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const changeMapType = (type: 'satellite' | 'hybrid' | 'terrain') => {
    setMapType(type);
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(type);
    }
  };

  return (
    <div className="h-full space-y-4">
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