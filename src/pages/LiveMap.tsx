import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Bus, MapPin, Clock, Users, Signal, X, Wifi, WifiOff } from "lucide-react";

interface BusMarker {
  id: string;
  route: string;
  lat: number;
  lng: number;
  status: "on-time" | "minor-delay" | "critical-delay";
  delay: number;
  occupancy: number;
  nextStop: string;
  driver: string;
}

const initialBuses: BusMarker[] = [
  { id: "AP09Z4521", route: "47C", lat: 55, lng: 40, status: "critical-delay", delay: 22, occupancy: 95, nextStop: "Kurnool Bus Stand", driver: "R. Venkatesh" },
  { id: "AP07Y3312", route: "12A", lat: 35, lng: 60, status: "minor-delay", delay: 8, occupancy: 82, nextStop: "Vijayawada JN", driver: "S. Prasad" },
  { id: "AP05X1198", route: "5D", lat: 70, lng: 25, status: "on-time", delay: 0, occupancy: 45, nextStop: "Guntur Depot", driver: "M. Lakshmi" },
  { id: "AP11W8834", route: "88B", lat: 25, lng: 75, status: "minor-delay", delay: 12, occupancy: 68, nextStop: "Tirupati Central", driver: "K. Ramesh" },
  { id: "AP03V5567", route: "23F", lat: 60, lng: 55, status: "on-time", delay: 1, occupancy: 52, nextStop: "Anantapur Depot", driver: "P. Suresh" },
  { id: "AP06U2290", route: "9E", lat: 45, lng: 35, status: "on-time", delay: 0, occupancy: 38, nextStop: "Nellore Station", driver: "B. Rajesh" },
  { id: "AP08T9943", route: "31G", lat: 40, lng: 80, status: "critical-delay", delay: 35, occupancy: 90, nextStop: "Kadapa Town", driver: "G. Rao" },
  { id: "AP12S6671", route: "66A", lat: 80, lng: 50, status: "on-time", delay: 2, occupancy: 55, nextStop: "Ongole Bus Stand", driver: "D. Naidu" },
  { id: "AP04R3344", route: "15B", lat: 15, lng: 45, status: "minor-delay", delay: 6, occupancy: 71, nextStop: "Rajahmundry", driver: "T. Kumar" },
  { id: "AP10Q0017", route: "42D", lat: 50, lng: 65, status: "on-time", delay: 0, occupancy: 42, nextStop: "Visakhapatnam", driver: "A. Reddy" },
];

const statusColor = {
  "on-time": "bg-status-ok",
  "minor-delay": "bg-status-warn",
  "critical-delay": "bg-status-critical",
};

const statusGlow = {
  "on-time": "glow-status-ok",
  "minor-delay": "glow-status-warn",
  "critical-delay": "glow-status-critical",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function simulateTick(buses: BusMarker[]): BusMarker[] {
  return buses.map((bus) => {
    const dLat = (Math.random() - 0.5) * 1.6;
    const dLng = (Math.random() - 0.5) * 1.6;
    const newLat = clamp(bus.lat + dLat, 8, 92);
    const newLng = clamp(bus.lng + dLng, 8, 92);

    // Occasionally shift delay/occupancy
    let newDelay = bus.delay + Math.round((Math.random() - 0.45) * 3);
    newDelay = clamp(newDelay, 0, 60);
    let newOcc = bus.occupancy + Math.round((Math.random() - 0.5) * 4);
    newOcc = clamp(newOcc, 10, 100);

    const newStatus: BusMarker["status"] =
      newDelay === 0 ? "on-time" : newDelay < 15 ? "minor-delay" : "critical-delay";

    return { ...bus, lat: newLat, lng: newLng, delay: newDelay, occupancy: newOcc, status: newStatus };
  });
}

export default function LiveMap() {
  const [buses, setBuses] = useState<BusMarker[]>(initialBuses);
  const [selected, setSelected] = useState<BusMarker | null>(null);
  const [connected, setConnected] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setBuses((prev) => simulateTick(prev));
    }, 2000);
    setConnected(true);
  }, []);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    startSimulation();
    return () => stopSimulation();
  }, [startSimulation, stopSimulation]);

  // Keep selected panel in sync with moving bus
  useEffect(() => {
    if (selected) {
      const updated = buses.find((b) => b.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [buses]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Live Bus Tracking</h1>
          <p className="text-xs text-muted-foreground">Real-time fleet positions — Andhra Pradesh region</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={connected ? stopSimulation : startSimulation}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono transition-colors",
              connected
                ? "border-status-ok/30 text-status-ok hover:bg-status-ok/10"
                : "border-status-critical/30 text-status-critical hover:bg-status-critical/10"
            )}
          >
            {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {connected ? "LIVE" : "PAUSED"}
          </button>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-status-ok" /> On-Time</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-status-warn" /> Minor Delay</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-status-critical" /> Critical</span>
        </div>
      </div>

      <div className="relative rounded-lg border border-kpi-border bg-kpi overflow-hidden" style={{ height: "calc(100vh - 180px)" }}>
        {/* Map Grid Background */}
        <div className="absolute inset-0 ops-grid opacity-60" />

        {/* Decorative routes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M10,50 Q30,20 55,40 T90,30" fill="none" stroke="hsl(210, 100%, 56%)" strokeWidth="0.15" strokeDasharray="1,1" opacity="0.4" />
          <path d="M5,80 Q25,60 50,65 T95,45" fill="none" stroke="hsl(192, 90%, 50%)" strokeWidth="0.15" strokeDasharray="1,1" opacity="0.3" />
          <path d="M15,20 Q40,40 60,30 T85,70" fill="none" stroke="hsl(142, 76%, 40%)" strokeWidth="0.15" strokeDasharray="1,1" opacity="0.3" />
        </svg>

        {/* City labels */}
        {[
          { name: "Vijayawada", x: 35, y: 58 },
          { name: "Visakhapatnam", x: 50, y: 63 },
          { name: "Guntur", x: 70, y: 23 },
          { name: "Tirupati", x: 25, y: 73 },
          { name: "Kurnool", x: 55, y: 38 },
          { name: "Nellore", x: 45, y: 33 },
        ].map((city) => (
          <div
            key={city.name}
            className="absolute text-[9px] text-muted-foreground/60 font-mono"
            style={{ left: `${city.x}%`, top: `${city.y}%` }}
          >
            <MapPin className="inline h-2.5 w-2.5 mr-0.5" />
            {city.name}
          </div>
        ))}

        {/* Bus Markers */}
        {buses.map((bus) => (
          <button
            key={bus.id}
            onClick={() => setSelected(bus)}
            className={cn(
              "absolute z-10 flex h-5 w-5 items-center justify-center rounded-full transition-transform hover:scale-150",
              statusColor[bus.status],
              statusGlow[bus.status],
              selected?.id === bus.id && "scale-150 ring-2 ring-foreground"
            )}
            style={{ left: `${bus.lng}%`, top: `${bus.lat}%`, transform: "translate(-50%, -50%)" }}
            title={`${bus.route} — ${bus.id}`}
          >
            <Bus className="h-2.5 w-2.5 text-foreground" />
          </button>
        ))}

        {/* Side Panel */}
        {selected && (
          <div className="absolute right-0 top-0 h-full w-72 border-l border-border bg-card/95 backdrop-blur-sm p-4 space-y-4 overflow-y-auto z-20">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Bus Details</h3>
              <button onClick={() => setSelected(null)} className="rounded p-1 hover:bg-secondary"><X className="h-3.5 w-3.5" /></button>
            </div>

            <div className="space-y-3">
              <div className="rounded-md bg-secondary p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Vehicle ID</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{selected.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Route</span>
                  <span className="font-mono text-xs font-semibold text-primary">{selected.route}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">Driver</span>
                  <span className="text-xs text-foreground">{selected.driver}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-md bg-secondary p-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Delay</p>
                    <p className={cn(
                      "font-mono text-sm font-semibold",
                      selected.delay === 0 ? "text-status-ok" : selected.delay < 15 ? "text-status-warn" : "text-status-critical"
                    )}>
                      {selected.delay === 0 ? "On schedule" : `+${selected.delay} min`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-md bg-secondary p-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Occupancy</p>
                    <p className={cn(
                      "font-mono text-sm font-semibold",
                      selected.occupancy < 60 ? "text-status-ok" : selected.occupancy < 85 ? "text-status-warn" : "text-status-critical"
                    )}>
                      {selected.occupancy}%
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-md bg-secondary p-3">
                  <Signal className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Status</p>
                    <div className="flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full", statusColor[selected.status])} />
                      <p className="text-xs font-medium text-foreground capitalize">{selected.status.replace("-", " ")}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-md bg-secondary p-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] text-muted-foreground">Next Stop</p>
                    <p className="text-xs font-medium text-foreground">{selected.nextStop}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
