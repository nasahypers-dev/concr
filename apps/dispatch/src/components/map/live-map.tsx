'use client';

import type { GeoPoint } from '@concr/shared';
import { cn } from 'cn';
import type { Feature, Polygon } from 'geojson';
import maplibregl, { type GeoJSONSource, type Map as MapLibreMap, Marker } from 'maplibre-gl';
import { useEffect, useRef } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

/** OpenFreeMap: OpenStreetMap vector tiles, no key, no account (ADR 0008). */
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

export type MapMarkerKind = 'plant' | 'site' | 'truck';

export interface MapMarker {
  id: string;
  kind: MapMarkerKind;
  position: GeoPoint;
  /** Short text inside the marker (plate number, site initial). */
  label: string;
  /** Hover text. */
  title?: string;
  color: string;
  /** Degrees clockwise from north; rotates a truck marker's arrow. */
  heading?: number | null;
  /** Pulsing ring for trucks without a GPS signal. */
  alert?: boolean;
  onClick?: () => void;
}

export interface LiveMapProps {
  center: GeoPoint;
  zoom?: number;
  markers: MapMarker[];
  /** Closed ring (first point not repeated); drawn as a translucent area. */
  polygon?: GeoPoint[] | null;
  className?: string;
}

const AREA_SOURCE = 'service-area';

/**
 * Thin React wrapper over MapLibre GL: the map is created once, markers are reconciled by id on
 * every render, the polygon is a GeoJSON layer. Nothing else in the panel knows which map renders
 * (ADR 0008: Google Maps can replace it behind this component).
 */
export function LiveMap({ center, zoom = 10, markers, polygon, className }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef(new Map<string, Marker>());
  const initialView = useRef({ center, zoom });

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    const { center: c, zoom: z } = initialView.current;
    const map = new maplibregl.Map({
      container,
      style: MAP_STYLE_URL,
      center: [c.lng, c.lat],
      zoom: z,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;
    const markerStore = markerRefs.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markerStore.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const item of markers) {
      seen.add(item.id);
      let marker = markerRefs.current.get(item.id);
      if (!marker) {
        marker = new Marker({ element: document.createElement('div'), anchor: 'center' })
          .setLngLat([item.position.lng, item.position.lat])
          .addTo(map);
        markerRefs.current.set(item.id, marker);
      }
      paintMarker(marker.getElement(), item);
      marker.setLngLat([item.position.lng, item.position.lat]);
    }
    for (const [id, marker] of markerRefs.current) {
      if (!seen.has(id)) {
        marker.remove();
        markerRefs.current.delete(id);
      }
    }
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    const first = polygon?.[0];
    if (!map || !polygon || !first) return;
    const ring = [...polygon.map((p) => [p.lng, p.lat]), [first.lng, first.lat]];
    const data: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [ring] },
    };
    const apply = () => {
      const source = map.getSource<GeoJSONSource>(AREA_SOURCE);
      if (source) {
        source.setData(data);
        return;
      }
      map.addSource(AREA_SOURCE, { type: 'geojson', data });
      map.addLayer({
        id: `${AREA_SOURCE}-fill`,
        type: 'fill',
        source: AREA_SOURCE,
        paint: { 'fill-color': '#F5A623', 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: `${AREA_SOURCE}-line`,
        type: 'line',
        source: AREA_SOURCE,
        paint: { 'line-color': '#F5A623', 'line-width': 2 },
      });
    };
    if (map.isStyleLoaded()) apply();
    else void map.once('load', apply);
  }, [polygon]);

  return <div ref={containerRef} className={cn('h-full w-full', className)} />;
}

/** Marker DOM: a coloured disc with a label; trucks get a heading arrow, alerts a pulsing ring. */
function paintMarker(element: HTMLElement, item: MapMarker): void {
  const size = item.kind === 'truck' ? 34 : item.kind === 'plant' ? 30 : 26;
  element.className = 'concr-marker';
  element.title = item.title ?? item.label;
  element.style.cssText = `width:${size}px;height:${size}px;cursor:${item.onClick ? 'pointer' : 'default'};position:relative;`;
  element.onclick = item.onClick ?? null;
  const shape = item.kind === 'site' ? 'border-radius:6px;' : 'border-radius:999px;';
  const ring = item.alert
    ? `<span style="position:absolute;inset:-6px;border-radius:999px;border:2px solid #DC2626;animation:concr-pulse 1.2s ease-out infinite"></span>`
    : '';
  const arrow =
    item.kind === 'truck' && item.heading !== null && item.heading !== undefined
      ? `<span style="position:absolute;left:50%;top:-9px;margin-left:-5px;width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:9px solid ${item.color};transform-origin:50% ${size / 2 + 9}px;transform:rotate(${Math.round(item.heading)}deg)"></span>`
      : '';
  element.innerHTML = `${ring}${arrow}<span style="position:absolute;inset:0;${shape}background:${item.color};color:#fff;font:600 10px/1 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.35);border:2px solid #fff">${escapeHtml(item.label)}</span>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
