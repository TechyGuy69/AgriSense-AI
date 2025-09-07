import { useState, useEffect, useRef } from "react";
import {
  Layers,
  Satellite,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ExportActions from "@/components/actions/ExportActions";

const MapViewer = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "hybrid" | "terrain">("satellite");
  const { toast } = useToast();

  const [activeLayers, setActiveLayers] = useState({
    rgb: true,
    ndvi: false,
    stress: true,
    confidence: false,
    alerts: true,
  });

  const layers = [
    { id: "rgb", name: "RGB Imagery", description: "True color imagery", color: "#3b82f6" },
    { id: "ndvi", name: "NDVI", description: "Vegetation index", color: "#22c55e" },
    { id: "stress", name: "Stress Heatmap", description: "Crop stress zones", color: "#ef4444" },
    { id: "confidence", name: "Confidence", description: "AI prediction confidence", color: "#8b5cf6" },
    { id: "alerts", name: "Alerts", description: "Field warnings", color: "#f59e0b" },
  ];

  // 🔹 Map initialization
  useEffect(() => {
    const initializeMap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-key");
        if (error) throw error;

        const apiKey = data?.apiKey;
        if (!apiKey) throw new Error("No API key found");

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["geometry", "places"],
        });

        const google = await loader.load();
        if (mapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 40.7841, lng: -73.9697 },
            zoom: 16,
            mapTypeId: mapType,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          setMapLoaded(true);
        }
      } catch (err) {
        console.error(err);
        toast({
          title: "Map error",
          description: "Could not load Google Maps",
          variant: "destructive",
        });
      }
    };
    initializeMap();
  }, [mapType, toast]);

  // 🔹 Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (googleMapRef.current) {
        googleMapRef.current.setCenter(location);
        googleMapRef.current.setZoom(15);
        new google.maps.Marker({
          position: location,
          map: googleMapRef.current,
          title: "You are here",
        });
      }
    });
  };

  // 🔹 Change map type
  const changeMapType = (type: "satellite" | "hybrid" | "terrain") => {
    setMapType(type);
    if (googleMapRef.current) {
      googleMapRef.current.setMapTypeId(type);
    }
  };

  // 🔹 Toggle layers
  const toggleLayer = (id: string) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Interactive Field Map</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Real-time crop monitoring and risk detection
        </p>
      </div>

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-200px)]">
        {/* Map Section */}
        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden min-h-[300px] lg:min-h-full">
          {/* ✅ Force map div to always fill parent */}
          <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          {!mapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">Loading field map...</p>
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="w-full lg:w-80 space-y-4">
          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ExportActions dataType="map" />
              <Button variant="outline" size="sm" className="w-full">
                Generate Field Report
              </Button>
              <Button variant="outline" size="sm" className="w-full">
                Schedule Visit
              </Button>
            </CardContent>
          </Card>

          {/* Layers */}
          <Card id="layers-panel" className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" /> Data Layers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {layers.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="text-xs sm:text-sm">{l.name}</span>
                  </div>
                  <Switch
                    checked={activeLayers[l.id as keyof typeof activeLayers]}
                    onCheckedChange={() => toggleLayer(l.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Field Stats */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Live Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Field Area</span>
                <span className="font-medium">45.2 ha</span>
              </div>
              <div className="flex justify-between">
                <span>Avg NDVI</span>
                <span className="font-medium text-green-600">0.72</span>
              </div>
              <div className="flex justify-between">
                <span>Risk Zones</span>
                <span className="font-medium text-orange-600">2</span>
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-sm">Active Alerts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="p-2 rounded bg-orange-50 dark:bg-orange-900/20">
                🚨 Irrigation needed — Sector A
              </div>
              <div className="p-2 rounded bg-yellow-50 dark:bg-yellow-900/20">
                ⚠️ Nutrient deficiency — East Field
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ Mobile Sticky Control Bar */}
      <div className="fixed bottom-2 left-2 right-2 z-50 flex justify-around gap-2 bg-background/95 backdrop-blur p-2 rounded-xl shadow-lg border lg:hidden pb-[env(safe-area-inset-bottom)]">
        <Button size="sm" onClick={getCurrentLocation} className="flex-1">
          <Crosshair className="h-4 w-4 mr-1" /> Location
        </Button>
        <Button size="sm" onClick={() => changeMapType("satellite")} className="flex-1">
          <Satellite className="h-4 w-4 mr-1" /> Type
        </Button>
        <Button size="sm" className="flex-1" onClick={() => {
          document.getElementById("layers-panel")?.scrollIntoView({ behavior: "smooth" });
        }}>
          <Layers className="h-4 w-4 mr-1" /> Layers
        </Button>
      </div>
    </div>
  );
};

export default MapViewer;
