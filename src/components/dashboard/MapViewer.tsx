import { useEffect, useRef, useState } from "react";
import { Layers, Satellite, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ExportActions from "@/components/actions/ExportActions";

const MapViewer = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const overlaysRef = useRef<{ [k: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapType, setMapType] = useState<"satellite" | "hybrid" | "terrain">("satellite");
  const { toast } = useToast();

  const [activeLayers, setActiveLayers] = useState({
    rgb: true,
    ndvi: false,
    stress: false,
    confidence: false,
    alerts: false,
  });

  const layers = [
    {
      id: "rgb",
      name: "RGB Imagery",
      color: "#3b82f6",
      description: "Standard true-color field imagery",
    },
    {
      id: "ndvi",
      name: "NDVI",
      color: "#22c55e",
      description: "Vegetation health index (0–1 scale)",
    },
    {
      id: "stress",
      name: "Stress Heatmap",
      color: "#ef4444",
      description: "Areas with possible crop stress",
    },
    {
      id: "confidence",
      name: "Confidence",
      color: "#8b5cf6",
      description: "AI prediction reliability",
    },
    {
      id: "alerts",
      name: "Alerts",
      color: "#f59e0b",
      description: "Active warnings in the field",
    },
  ];

  // 🔹 Initialize Map
  useEffect(() => {
    const initMap = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-maps-key");
        if (error) throw error;

        const apiKey = data?.apiKey;
        if (!apiKey) throw new Error("No API key found");

        const loader = new Loader({
          apiKey,
          version: "weekly",
          libraries: ["geometry", "places", "visualization"],
        });

        const google = await loader.load();

        if (mapRef.current) {
          googleMapRef.current = new google.maps.Map(mapRef.current, {
            center: { lat: 12.9716, lng: 77.5946 },
            zoom: 14,
            mapTypeId: mapType,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          setMapLoaded(true);
        }
      } catch (err) {
        console.error("Google Maps failed:", err);
        setMapError(true);
        toast({
          title: "Map Fallback",
          description: "Google Maps blocked. Showing OpenStreetMap instead.",
        });
      }
    };

    initMap();
  }, [mapType, toast]);

  // 🔹 Update overlays when toggled
  useEffect(() => {
    if (!googleMapRef.current || !(window as any).google) return;
    const google = (window as any).google;

    // NDVI - rectangle
    if (activeLayers.ndvi) {
      if (!overlaysRef.current["ndvi"]) {
        overlaysRef.current["ndvi"] = new google.maps.Rectangle({
          bounds: { north: 12.975, south: 12.971, east: 77.598, west: 77.593 },
          fillColor: "#22c55e",
          fillOpacity: 0.35,
          strokeWeight: 0,
          map: googleMapRef.current,
        });
      } else overlaysRef.current["ndvi"].setMap(googleMapRef.current);
    } else if (overlaysRef.current["ndvi"]) {
      overlaysRef.current["ndvi"].setMap(null);
    }

    // Stress - circle
    if (activeLayers.stress) {
      if (!overlaysRef.current["stress"]) {
        overlaysRef.current["stress"] = new google.maps.Circle({
          center: { lat: 12.9726, lng: 77.5946 },
          radius: 200,
          fillColor: "#ef4444",
          fillOpacity: 0.35,
          strokeWeight: 0,
          map: googleMapRef.current,
        });
      } else overlaysRef.current["stress"].setMap(googleMapRef.current);
    } else if (overlaysRef.current["stress"]) {
      overlaysRef.current["stress"].setMap(null);
    }

    // Confidence - rectangle
    if (activeLayers.confidence) {
      if (!overlaysRef.current["confidence"]) {
        overlaysRef.current["confidence"] = new google.maps.Rectangle({
          bounds: { north: 12.9732, south: 12.9702, east: 77.599, west: 77.592 },
          fillColor: "#8b5cf6",
          fillOpacity: 0.22,
          strokeWeight: 1,
          strokeColor: "#8b5cf6",
          map: googleMapRef.current,
        });
      } else overlaysRef.current["confidence"].setMap(googleMapRef.current);
    } else if (overlaysRef.current["confidence"]) {
      overlaysRef.current["confidence"].setMap(null);
    }

    // Alerts - marker
    if (activeLayers.alerts) {
      if (!overlaysRef.current["alerts"]) {
        overlaysRef.current["alerts"] = new google.maps.Marker({
          position: { lat: 12.9735, lng: 77.5955 },
          map: googleMapRef.current,
          title: "🚨 Irrigation needed",
        });
      } else overlaysRef.current["alerts"].setMap(googleMapRef.current);
    } else if (overlaysRef.current["alerts"]) {
      overlaysRef.current["alerts"].setMap(null);
    }
  }, [activeLayers]);

  // 🔹 Toggle a layer
  const toggleLayer = (id: string) => {
    setActiveLayers((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  // 🔹 Location button
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition((pos) => {
      const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (googleMapRef.current && (window as any).google) {
        googleMapRef.current.setCenter(location);
        googleMapRef.current.setZoom(16);
        new (window as any).google.maps.Marker({
          position: location,
          map: googleMapRef.current,
          title: "You are here",
        });
      }
    });
  };

  // 🔹 Cycle map type
  const changeMapType = () => {
    const order: ("satellite" | "hybrid" | "terrain")[] = ["satellite", "hybrid", "terrain"];
    const next = order[(order.indexOf(mapType) + 1) % order.length];
    setMapType(next);
    if (googleMapRef.current && (window as any).google) {
      googleMapRef.current.setMapTypeId(next);
      toast({ title: `Map type: ${next}` });
    }
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
          {!mapError ? (
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          ) : (
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.58,12.96,77.62,13.00&layer=mapnik"
              className="absolute inset-0 w-full h-full rounded-lg border-0"
              loading="lazy"
            />
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
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: l.color }}
                      />
                      <span className="text-xs sm:text-sm font-medium">{l.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{l.description}</p>
                  </div>
                  <Switch
                    checked={activeLayers[l.id as keyof typeof activeLayers]}
                    onCheckedChange={() => toggleLayer(l.id)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ✅ Mobile Sticky Control Bar */}
      <div className="fixed bottom-2 left-2 right-2 z-50 flex justify-around gap-2 bg-background/95 backdrop-blur p-2 rounded-xl shadow-lg border lg:hidden pb-[env(safe-area-inset-bottom)]">
        <Button size="sm" onClick={getCurrentLocation} className="flex-1">
          <Crosshair className="h-4 w-4 mr-1" /> Location
        </Button>
        <Button size="sm" onClick={changeMapType} className="flex-1">
          <Satellite className="h-4 w-4 mr-1" /> Type
        </Button>
        <Button
          size="sm"
          className="flex-1"
          onClick={() =>
            document
              .getElementById("layers-panel")
              ?.scrollIntoView({ behavior: "smooth" })
          }
        >
          <Layers className="h-4 w-4 mr-1" /> Layers
        </Button>
      </div>
    </div>
  );
};

export default MapViewer;
