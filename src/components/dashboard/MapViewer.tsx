import { useEffect, useRef, useState } from "react";
import { Layers, Satellite, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader } from "@googlemaps/js-api-loader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ExportActions from "@/components/actions/ExportActions";

/**
 * Robust MapViewer:
 * - Attempts loader.load() with timeout
 * - If loader fails, attempts script injection with callback (detects adblock)
 * - If both fail (or offline), uses OSM iframe fallback
 * - Provides visible error banner with debug reason
 */

const MapViewer = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapRef = useRef<any>(null);
  const overlaysRef = useRef<{ [k: string]: any }>({});
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapErrorReason, setMapErrorReason] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
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
    { id: "rgb", name: "RGB Imagery", color: "#3b82f6" },
    { id: "ndvi", name: "NDVI", color: "#22c55e" },
    { id: "stress", name: "Stress", color: "#ef4444" },
    { id: "confidence", name: "Confidence", color: "#8b5cf6" },
    { id: "alerts", name: "Alerts", color: "#f59e0b" },
  ];

  // Track online/offline
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  // Helper: try to load Google Maps via Loader with timeout
  const tryLoaderWithTimeout = async (apiKey: string, timeoutMs = 8000) => {
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["geometry", "places", "visualization"],
    });

    return Promise.race([
      loader.load().then((google) => ({ ok: true, google })),
      new Promise<{ ok: false; reason: string }>((resolve) => {
        setTimeout(() => resolve({ ok: false, reason: "loader-timeout" }), timeoutMs);
      }),
    ]);
  };

  // Helper: inject script with a callback to detect adblock/script blocking
  const tryScriptInjection = (apiKey: string, timeoutMs = 8000) =>
    new Promise<{ ok: boolean; reason?: string; google?: any }>((resolve) => {
      const cbName = "__agrisense_gmaps_cb_" + Date.now();
      // @ts-ignore
      (window as any)[cbName] = function () {
        // loaded
        // @ts-ignore
        const g = (window as any).google;
        resolve({ ok: true, google: g });
        // cleanup
        try {
          // @ts-ignore
          delete (window as any)[cbName];
        } catch {}
      };

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
        apiKey
      )}&libraries=geometry,places,visualization&callback=${cbName}`;
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        resolve({ ok: false, reason: "script-error" }); // likely blocked by extension
        try {
          script.remove();
          // @ts-ignore
          delete (window as any)[cbName];
        } catch {}
      };
      document.head.appendChild(script);

      // fallback timeout
      setTimeout(() => {
        resolve({ ok: false, reason: "script-timeout" });
        try {
          script.remove();
          // @ts-ignore
          delete (window as any)[cbName];
        } catch {}
      }, timeoutMs);
    });

  // Create demo overlays (rectangles/circles/marker) on the map
  const createOverlaysForMap = (google: any, map: any) => {
    // demo bounds centered roughly over Bangalore; replace with your field coords
    const bounds = {
      north: 12.976,
      south: 12.968,
      east: 77.600,
      west: 77.590,
    };

    overlaysRef.current = {}; // reset

    // rgb = field boundary polygon
    overlaysRef.current["rgb"] = new google.maps.Polygon({
      paths: [
        { lat: 12.9695, lng: 77.591 },
        { lat: 12.975, lng: 77.591 },
        { lat: 12.975, lng: 77.596 },
        { lat: 12.9695, lng: 77.596 },
      ],
      strokeColor: "#22c55e",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#22c55e",
      fillOpacity: 0.08,
      map,
    });

    // Do not attach ndvi/stress/confidence/alerts until toggled by user
  };

  // Add/remove overlays based on activeLayers
  const updateOverlays = () => {
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
          title: "Alert: Irrigation needed",
        });
      } else overlaysRef.current["alerts"].setMap(googleMapRef.current);
    } else if (overlaysRef.current["alerts"]) {
      overlaysRef.current["alerts"].setMap(null);
    }
  };

  // Toggle layer from UI
  const toggleLayer = (id: string) => {
    setActiveLayers((prev) => {
      const next = { ...prev, [id]: !prev[id as keyof typeof prev] };
      // small toast
      toast({
        title: `${id.toUpperCase()} ${next[id as keyof typeof next] ? "enabled" : "disabled"}`,
      });
      return next;
    });
  };

  // Location button
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (googleMapRef.current && (window as any).google) {
          googleMapRef.current.setCenter(location);
          googleMapRef.current.setZoom(16);
          new (window as any).google.maps.Marker({ position: location, map: googleMapRef.current, title: "You are here" });
        } else {
          // for OSM fallback, open in new tab
          window.open(`https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lng}#map=16/${location.lat}/${location.lng}`, "_blank");
        }
      },
      (err) => {
        toast({ title: "Location error", description: err?.message || "Failed to get location", variant: "destructive" });
      }
    );
  };

  // Cycle map type
  const changeMapType = () => {
    const order: ("satellite" | "hybrid" | "terrain")[] = ["satellite", "hybrid", "terrain"];
    const next = order[(order.indexOf(mapType) + 1) % order.length];
    setMapType(next);
    if (googleMapRef.current && (window as any).google) {
      googleMapRef.current.setMapTypeId(next);
      toast({ title: `Map type: ${next}` });
    } else {
      toast({ title: `Map type set to ${next} (applies when Google Maps loads)` });
    }
  };

  // Main init effect — tries loader -> script injection -> fallback
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setMapError(false);
      setMapErrorReason(null);
      setMapLoaded(false);

      if (!isOnline) {
        setMapError(true);
        setMapErrorReason("offline");
        console.warn("[MapViewer] offline: using fallback (OSM iframe)");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("get-maps-key");
        if (error) throw error;
        const apiKey = data?.apiKey;
        if (!apiKey) throw new Error("No API key from Supabase (get-maps-key)");

        // 1) try loader with timeout
        console.log("[MapViewer] trying Loader.load() with timeout...");
        const res = await tryLoaderWithTimeout(apiKey, 8000);
        if (res && (res as any).ok && (res as any).google) {
          if (cancelled) return;
          console.log("[MapViewer] Loader.load() succeeded.");
          // create map
          const google = (res as any).google;
          if (mapRef.current) {
            googleMapRef.current = new google.maps.Map(mapRef.current, {
              center: { lat: 12.9716, lng: 77.5946 },
              zoom: 14,
              mapTypeId: mapType,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: false,
            });
            createOverlaysForMap(google, googleMapRef.current);
            setMapLoaded(true);
            setMapError(false);
            setMapErrorReason(null);
            return;
          }
        }

        console.warn("[MapViewer] Loader.load() failed or timed out. Trying script injection detection...");
        // 2) try script injection (detect adblock)
        const scr = await tryScriptInjection(apiKey, 6000);
        if (scr.ok && scr.google) {
          if (cancelled) return;
          console.log("[MapViewer] script injection succeeded.");
          // create map now
          const google = (window as any).google;
          if (mapRef.current) {
            googleMapRef.current = new google.maps.Map(mapRef.current, {
              center: { lat: 12.9716, lng: 77.5946 },
              zoom: 14,
              mapTypeId: mapType,
            });
            createOverlaysForMap(google, googleMapRef.current);
            setMapLoaded(true);
            setMapError(false);
            setMapErrorReason(null);
            return;
          }
        }

        // failed both approaches
        console.error("[MapViewer] Google Maps appears blocked or failed to load.");
        setMapError(true);
        setMapErrorReason((scr && (scr as any).reason) || "loader-failed");
      } catch (err: any) {
        console.error("[MapViewer] init error:", err);
        setMapError(true);
        setMapErrorReason(err?.message || "init-error");
      }
    };

    init();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]); // re-run when online changes

  // keep overlays in sync with state
  useEffect(() => {
    updateOverlays();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLayers]);

  // For debugging: visible banner text to copy/paste to me
  const debugText = `online=${isOnline} mapLoaded=${mapLoaded} mapError=${mapError} mapErrorReason=${mapErrorReason}`;

  return (
    <div className="h-full space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Interactive Field Map</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Real-time crop monitoring</p>
      </div>

      {/* Visible error / status */}
      {mapError && (
        <div className="p-2 rounded-md bg-red-50 text-red-700 text-sm">
          <strong>Map load failed:</strong>{" "}
          {mapErrorReason ? mapErrorReason : "unknown reason"} — showing fallback map.
          <div className="mt-1 text-xs text-gray-600">Debug: <code>{debugText}</code></div>
          <div className="mt-1 text-xs">
            <span>Tip: disable adblock/shields or whitelist this site, ensure your Google Maps API key allows this domain, and billing is enabled.</span>
          </div>
        </div>
      )}

      {/* Layout */}
      <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-200px)]">
        {/* Map area */}
        <div className="flex-1 relative bg-muted rounded-lg overflow-hidden min-h-[300px] lg:min-h-full">
          {!mapError ? (
            <div ref={mapRef} className="absolute inset-0 w-full h-full" />
          ) : (
            <iframe
              title="OpenStreetMap fallback"
              src="https://www.openstreetmap.org/export/embed.html?bbox=77.58,12.96,77.62,13.00&layer=mapnik"
              className="absolute inset-0 w-full h-full border-0 rounded"
              loading="lazy"
            />
          )}

          {!mapLoaded && !mapError && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">Loading field map...</p>
            </div>
          )}
        </div>

        {/* Panel */}
        <div className="w-full lg:w-80 space-y-4">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <ExportActions dataType="map" />
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                toast({ title: "Generate report clicked" });
              }}>Generate Field Report</Button>
              <Button variant="outline" size="sm" className="w-full">Schedule Visit</Button>
            </CardContent>
          </Card>

          <Card id="layers-panel" className="shadow-card">
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" /> Data Layers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {layers.map((l) => (
                <div key={l.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className="text-xs sm:text-sm">{l.name}</span>
                  </div>
                  <Switch checked={activeLayers[l.id as keyof typeof activeLayers]} onCheckedChange={() => toggleLayer(l.id)} />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed bottom-2 left-2 right-2 z-50 flex justify-around gap-2 bg-background/95 backdrop-blur p-2 rounded-xl shadow-lg border lg:hidden pb-[env(safe-area-inset-bottom)]">
        <Button size="sm" onClick={getCurrentLocation} className="flex-1"><Crosshair className="h-4 w-4 mr-1" />Location</Button>
        <Button size="sm" onClick={changeMapType} className="flex-1"><Satellite className="h-4 w-4 mr-1" />Type</Button>
        <Button size="sm" className="flex-1" onClick={() => document.getElementById("layers-panel")?.scrollIntoView({ behavior: "smooth" })}><Layers className="h-4 w-4 mr-1" />Layers</Button>
      </div>
    </div>
  );
};

export default MapViewer;
