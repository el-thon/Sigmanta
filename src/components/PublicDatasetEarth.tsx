"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Filter, Globe2, Layers3, Search } from "lucide-react";
import type { PublicDatasetFeature, PublicDatasetLayer } from "@/lib/publicDatasetCatalog";

type PublicDatasetResponse = {
  importedAt: string;
  layers: PublicDatasetLayer[];
  features: PublicDatasetFeature[];
  errors: string[];
  env: {
    nasaFirmsConfigured: boolean;
    openAqConfigured: boolean;
  };
};

declare global {
  interface Window {
    Cesium?: any;
  }
}

const CESIUM_VERSION = "1.127";
const CESIUM_SCRIPT = `https://cdn.jsdelivr.net/npm/cesium@${CESIUM_VERSION}/Build/Cesium/Cesium.js`;
const CESIUM_CSS = `https://cdn.jsdelivr.net/npm/cesium@${CESIUM_VERSION}/Build/Cesium/Widgets/widgets.css`;
const DEFAULT_ACTIVE_CATEGORIES = [
  "earthquakes",
  "natural_events",
  "wildfires",
  "air_quality",
];

function loadCesium() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser belum tersedia."));
  if (window.Cesium) return Promise.resolve(window.Cesium);

  return new Promise<any>((resolve, reject) => {
    const existingLink = document.querySelector(`link[href="${CESIUM_CSS}"]`);
    if (!existingLink) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CESIUM_CSS;
      document.head.appendChild(link);
    }

    const existingScript = document.querySelector(`script[src="${CESIUM_SCRIPT}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Cesium));
      existingScript.addEventListener("error", () => reject(new Error("Peta 3D gagal dimuat.")));
      return;
    }

    const script = document.createElement("script");
    script.src = CESIUM_SCRIPT;
    script.async = true;
    script.onload = () => resolve(window.Cesium);
    script.onerror = () => reject(new Error("Peta 3D gagal dimuat."));
    document.body.appendChild(script);
  });
}

function layerStatusLabel(status: PublicDatasetLayer["status"]) {
  if (status === "near_real_time") return "Near real-time";
  if (status === "api_key_required") return "Butuh API key";
  return status;
}

function featureMatches(feature: PublicDatasetFeature, searchTerm: string) {
  if (!searchTerm) return true;
  const haystack = `${feature.label} ${feature.summary} ${feature.category} ${feature.source}`.toLowerCase();
  return haystack.includes(searchTerm.toLowerCase());
}

export function PublicDatasetEarth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const entitiesRef = useRef<any[]>([]);
  const [data, setData] = useState<PublicDatasetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set(DEFAULT_ACTIVE_CATEGORIES));
  const [hovered, setHovered] = useState<PublicDatasetFeature | null>(null);

  const visibleFeatures = useMemo(() => {
    return (data?.features ?? []).filter((feature) => activeCategories.has(feature.category) && featureMatches(feature, searchTerm));
  }, [activeCategories, data?.features, searchTerm]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch("/api/public-datasets", { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message ?? "Dataset publik gagal dimuat.");
        if (!cancelled) setData(payload);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Dataset publik gagal dimuat.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let destroyed = false;

    async function setupViewer() {
      const Cesium = await loadCesium();
      if (destroyed || !containerRef.current || viewerRef.current) return;

      Cesium.Ion.defaultAccessToken = "";
      const viewer = new Cesium.Viewer(containerRef.current, {
        animation: false,
        baseLayer: Cesium.ImageryLayer.fromProviderAsync(
          Cesium.TileMapServiceImageryProvider.fromUrl(
            Cesium.buildModuleUrl("Assets/Textures/NaturalEarthII")
          )
        ),
        baseLayerPicker: false,
        fullscreenButton: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        sceneModePicker: false,
        selectionIndicator: false,
        timeline: false,
      });

      viewer.scene.backgroundColor = Cesium.Color.BLACK;
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.show = true;
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-30, 18, 14500000),
      });

      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction((movement: { endPosition: unknown }) => {
        const picked = viewer.scene.pick(movement.endPosition);
        const feature = picked?.id?.properties?.sigmantaFeature?.getValue?.();
        setHovered(feature ?? null);
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

      viewerRef.current = viewer;
    }

    setupViewer().catch((setupError) => setError(setupError instanceof Error ? setupError.message : "Peta 3D gagal disiapkan."));
    return () => {
      destroyed = true;
      const viewer = viewerRef.current;
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    const Cesium = window.Cesium;
    if (!viewer || !Cesium || !data) return;

    for (const entity of entitiesRef.current) viewer.entities.remove(entity);
    entitiesRef.current = [];

    for (const feature of visibleFeatures) {
      const layer = data.layers.find((item) => item.id === feature.category);
      const color = Cesium.Color.fromCssColorString(layer?.color ?? "#df5732");
      const entity = viewer.entities.add({
        name: feature.label,
        position: Cesium.Cartesian3.fromDegrees(feature.longitude, feature.latitude),
        point: {
          pixelSize: feature.category === "earthquakes" ? 9 : 11,
          color,
          outlineColor: Cesium.Color.WHITE.withAlpha(0.82),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
        label: {
          text: feature.value ?? "",
          font: "11px DM Mono, monospace",
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          showBackground: false,
          scale: 0.9,
        },
        properties: {
          sigmantaFeature: feature,
        },
      });
      entitiesRef.current.push(entity);
    }
  }, [data, visibleFeatures]);

  function toggleCategory(id: string) {
    setActiveCategories((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section id="public-earth" className="border-t-2 border-earth-dark bg-earth-light px-5 py-16 md:py-20">
      <div className="mx-auto max-w-[1216px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="label-mono inline-flex items-center gap-2 text-moss"><Globe2 size={15} /> Peta Global</p>
            <h2 className="font-display mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">
              Peta persebaran data lingkungan dan risiko di dunia.
            </h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-earth-dark/65">
              Titik gempa, kejadian alam aktif, hotspot kebakaran, dan kategori lingkungan lain ditarik dari sumber data publik dengan metadata sumber yang transparan.
            </p>
          </div>
          <div className="brutal-card bg-earth-paper px-4 py-3 text-xs">
            <span className="label-mono block text-earth-dark/55">Fitur tampil</span>
            <span className="font-display text-3xl font-black">{visibleFeatures.length}</span>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-[330px_1fr] lg:items-start">
          <aside className="brutal-card bg-earth-light p-4">
            <label className="flex items-center gap-3 border-2 border-earth-dark bg-earth-paper px-3 py-2">
              <Search size={17} />
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Cari kategori, lokasi, sumber..."
                value={searchTerm}
              />
            </label>

            <div className="mt-5 flex items-center gap-2">
              <Filter size={16} />
              <p className="label-mono">Layer Filter</p>
            </div>
            <div className="mt-3 space-y-2">
              {(data?.layers ?? []).map((layer) => (
                <label key={layer.id} className="flex cursor-pointer items-start gap-3 border-2 border-earth-dark/15 bg-earth-paper p-3 text-xs">
                  <input
                    checked={activeCategories.has(layer.id)}
                    className="mt-1 h-4 w-4 accent-earth-dark"
                    onChange={() => toggleCategory(layer.id)}
                    type="checkbox"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 font-bold">
                      <span className="h-3 w-3 shrink-0 border border-earth-dark" style={{ backgroundColor: layer.color }} />
                      {layer.label}
                    </span>
                    <span className="mt-1 block leading-5 text-earth-dark/60">{layerStatusLabel(layer.status)}</span>
                  </span>
                </label>
              ))}
            </div>
          </aside>

          <div className="brutal-card overflow-hidden bg-earth-dark">
            <div className="flex flex-col justify-between gap-3 border-b-2 border-earth-dark bg-earth-paper px-4 py-3 md:flex-row md:items-center">
              <p className="label-mono flex items-center gap-2"><Layers3 size={15} /> Peta Persebaran Data Publik</p>
              <p className="text-xs text-earth-dark/60">
                {loading ? "Memuat data publik..." : error ? error : `Imported ${data?.importedAt ? new Date(data.importedAt).toLocaleString("id-ID") : "-"}`}
              </p>
            </div>

            <div className="relative h-[460px] md:h-[540px]">
              <div ref={containerRef} className="absolute inset-0" />
              {hovered ? (
                <div className="absolute bottom-4 left-4 z-10 max-w-md border-2 border-earth-dark bg-earth-light p-4 text-xs shadow-[4px_4px_0_#1c1a14]">
                  <p className="label-mono text-moss">{hovered.category}</p>
                  <h3 className="mt-2 text-base font-bold">{hovered.label}</h3>
                  <p className="mt-2 leading-5 text-earth-dark/70">{hovered.summary}</p>
                  <div className="mt-3 grid gap-2 text-earth-dark/62">
                    <span>Source: {hovered.source}</span>
                    <span>License: {hovered.source_license}</span>
                    <span>Confidence: {hovered.confidence}</span>
                    <span>Imported: {new Date(hovered.imported_at).toLocaleString("id-ID")}</span>
                  </div>
                  <a className="mt-3 inline-flex items-center gap-2 font-bold text-moss" href={hovered.source_url} rel="noreferrer" target="_blank">
                    Buka sumber <ExternalLink size={13} />
                  </a>
                </div>
              ) : null}

              {data?.env.nasaFirmsConfigured === false || data?.env.openAqConfigured === false ? (
                <div className="absolute right-4 top-4 z-10 max-w-xs border-2 border-earth-dark bg-earth-light/92 p-3 text-[11px] leading-5 shadow-[3px_3px_0_#1c1a14]">
                  FIRMS/OpenAQ siap dikonfigurasi lewat env key. Tanpa key, viewer tetap menampilkan USGS dan NASA EONET live.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
