"use client";

import { useEffect } from "react";
import { FeatureGroup, MapContainer, TileLayer } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import * as turf from "@turf/turf";

export type MapWorkspaceProps = {
  center?: [number, number];
  zoom?: number;
};

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
    <div className="h-[calc(100vh-96px)] overflow-hidden rounded-2xl border border-white/10">
      <MapContainer center={center} zoom={zoom} className="h-full w-full">
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FeatureGroup>
          <EditControl
            position="topright"
            draw={{
              polygon: true,
              rectangle: true,
              circle: true,
              marker: true,
              polyline: true,
              circlemarker: false,
            }}
            onCreated={(event) => {
              const layer = event.layer;
              const geojson = layer.toGeoJSON();
              let area = 0;
              let length = 0;

              if (geojson.geometry.type === "Polygon") area = turf.area(geojson);
              if (geojson.geometry.type === "LineString") length = turf.length(geojson, { units: "kilometers" });

              console.log("SIGMITA_DRAW_CREATED", { type: event.layerType, geojson, area, length });
            }}
          />
        </FeatureGroup>
      </MapContainer>
    </div>
  );
}
