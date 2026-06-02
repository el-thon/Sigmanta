"use client";

import { useEffect } from "react";
import { FeatureGroup, MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-draw";
import * as turf from "@turf/turf";
import { Circle, Hexagon, MapPin, Route, X } from "lucide-react";

export type MapWorkspaceProps = {
  center?: [number, number];
  zoom?: number;
};

function DrawControls() {
  const map = useMap();

  useEffect(() => {
    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      position: "topright",
      draw: {
        polygon: {},
        rectangle: {},
        circle: {},
        marker: {},
        polyline: {},
        circlemarker: false,
      },
      edit: {
        featureGroup: drawnItems,
      },
    });

    map.addControl(drawControl);

    const handleCreated: L.LeafletEventHandlerFn = (event) => {
      const createdEvent = event as L.DrawEvents.Created;
      const layer = createdEvent.layer;
      drawnItems.addLayer(layer);
      const geojson = layer.toGeoJSON();
      let area = 0;
      let length = 0;

      if (geojson.geometry.type === "Polygon") area = turf.area(geojson);
      if (geojson.geometry.type === "LineString") length = turf.length(geojson, { units: "kilometers" });

      console.log("SIGMITA_DRAW_CREATED", { type: createdEvent.layerType, geojson, area, length });
    };

    map.on(L.Draw.Event.CREATED, handleCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleCreated);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map]);

  return null;
}

export function MapWorkspace({ center = [-5.3971, 105.2668], zoom = 13 }: MapWorkspaceProps) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  return (
    <div className="grid h-[calc(100vh-66px)] overflow-hidden border-t-2 border-earth-dark bg-earth-light md:grid-cols-[280px_1fr_320px]">
      <aside className="topographic-paper hidden border-r-2 border-earth-dark p-5 md:flex md:flex-col">
        <div>
          <h2 className="font-display text-3xl font-black">Project Alpha</h2>
          <p className="label-mono mt-2 text-earth-dark/65">Disaster Mitigation Unit</p>
        </div>
        <nav className="mt-8 space-y-3">
          {["Dashboard", "Map Workspace", "Land Records", "Risk Reports"].map((item) => (
            <button
              key={item}
              className={`flex w-full items-center gap-3 border-2 px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.06em] ${
                item === "Map Workspace" ? "border-earth-dark bg-moss-light shadow-[3px_3px_0_#1c1a14]" : "border-transparent text-earth-dark/75"
              }`}
            >
              <Hexagon size={17} /> {item}
            </button>
          ))}
        </nav>
        <div className="mt-auto space-y-5 border-t-2 border-earth-dark pt-5">
          <div className="brutal-card bg-earth-light p-4">
            <p className="label-mono mb-3">Layer Control</p>
            {["Base Map", "Lahan Polygons", "Evacuation Routes"].map((layer, index) => (
              <label key={layer} className="mt-2 flex items-center gap-2 text-sm">
                <input type="checkbox" defaultChecked={index < 2} className="h-4 w-4 accent-earth-dark" /> {layer}
              </label>
            ))}
          </div>
          <div className="brutal-card bg-earth-light p-4">
            <p className="label-mono mb-3">Drawing Tools</p>
            <div className="grid grid-cols-3 gap-2">
              <button className="brutal-button bg-earth-light p-3" title="Route"><Route size={17} /></button>
              <button className="brutal-button bg-earth-light p-3" title="Area"><Hexagon size={17} /></button>
              <button className="brutal-button bg-earth-light p-3" title="Marker"><MapPin size={17} /></button>
            </div>
          </div>
        </div>
      </aside>

      <section className="relative min-h-[520px] bg-[#dfddd5]">
        <div className="absolute left-4 top-4 z-[500] flex gap-3">
          <label className="glass-accent flex w-72 max-w-[calc(100vw-2rem)] items-center gap-2 border-2 border-earth-dark bg-earth-light/80 px-3 py-2 shadow-[3px_3px_0_#1c1a14]">
            <MapPin size={18} />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Search coordinates..." />
          </label>
        </div>
        <div className="absolute bottom-4 left-4 z-[500] border border-earth-dark/20 bg-earth-light px-3 py-2 text-xs shadow-sm">
          {center[0].toFixed(4)}° N, {center[1].toFixed(4)}° E | 500m
        </div>
        <MapContainer center={center} zoom={zoom} className="h-full w-full">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <FeatureGroup />
          <DrawControls />
        </MapContainer>
      </section>

      <aside className="topographic-paper hidden border-l-2 border-earth-dark md:block">
        <div className="flex items-center justify-between border-b-2 border-earth-dark px-5 py-4">
          <h2 className="font-display text-2xl font-black">Object Details</h2>
          <button aria-label="Tutup panel"><X /></button>
        </div>
        <div className="space-y-6 p-5">
          <div className="brutal-card bg-earth-light p-4">
            <div className="flex justify-between gap-3">
              <span className="bg-hazard-light px-2 py-1 text-xs font-bold uppercase text-hazard">High Risk</span>
              <Circle className="text-hazard" />
            </div>
            <h3 className="mt-3 text-lg font-bold">Sector 7G</h3>
            <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="label-mono text-earth-dark/60">Type</p>
                <p className="font-bold">Polygon (Lahan)</p>
              </div>
              <div>
                <p className="label-mono text-earth-dark/60">Area</p>
                <p className="font-bold">4.2 Hectares</p>
              </div>
            </div>
            <p className="label-mono mt-5 text-earth-dark/60">Coordinates</p>
            <p className="mt-2 text-sm text-earth-dark/70">[[14.6, 120.9], [14.7, 121.0]...]</p>
          </div>
          <div>
            <p className="label-mono mb-3">Survey Notes</p>
            <div className="brutal-card bg-earth-light p-4 text-sm leading-6">
              Soil instability detected near northern ridge. Requires immediate shoring.
            </div>
          </div>
          <div>
            <p className="label-mono mb-3">Raw GeoJSON</p>
            <pre className="overflow-auto bg-earth-dark p-4 text-xs leading-6 text-earth-light">
{`{
  "type": "Feature",
  "properties": {
    "risk": "High",
    "area_ha": 4.2
  },
  "geometry": { ... }
}`}
            </pre>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="brutal-button border-hazard bg-earth-light px-4 py-3 text-hazard">Delete</button>
            <button className="brutal-button bg-earth-dark px-4 py-3 text-earth-light">Save Edits</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
