import { useState } from 'react';
import { Map, Layers, Eye, EyeOff, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import ndviDemo from '@/assets/ndvi-demo.jpg';

const MapViewer = () => {
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

  const toggleLayer = (layerId: string) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
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
        <div className="flex-1 relative bg-muted rounded-lg">
        {/* Map Placeholder */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <img 
            src={ndviDemo} 
            alt="NDVI Analysis Demo" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 left-4 space-y-2">
          <Button variant="secondary" size="icon" title="Map Settings">
            <Map className="h-4 w-4" />
          </Button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4">
          <Card className="w-48 shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">NDVI Scale</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>High Vigor</span>
                  <div className="w-4 h-3 bg-green-500 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Moderate</span>
                  <div className="w-4 h-3 bg-yellow-500 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Low/Stress</span>
                  <div className="w-4 h-3 bg-red-500 rounded"></div>
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