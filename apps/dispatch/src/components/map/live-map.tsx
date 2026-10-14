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
  /** Plant: its name under the badge. Site: the trip number inside the pin. Truck: the plate under it. */
  label: string;
  /** Hover text. */
  title?: string;
  color: string;
  /** Plant only: the supplier's own icon; a factory symbol is drawn when it is missing or fails. */
  imageUrl?: string | null;
  /** Degrees clockwise from north; draws the heading arrow on a truck. */
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
const GRAPHITE = '#12161F';

/** Pixel box of each marker element; the anchor point is derived from it. */
const SIZE: Record<MapMarkerKind, { width: number; height: number; anchor: 'center' | 'bottom' }> =
  {
    plant: { width: 44, height: 44, anchor: 'center' },
    site: { width: 28, height: 36, anchor: 'bottom' },
    truck: { width: 36, height: 36, anchor: 'center' },
  };

const Z_INDEX: Record<MapMarkerKind, string> = { plant: '1', site: '2', truck: '3' };

interface MarkerHandle {
  marker: Marker;
  inner: HTMLDivElement;
  paintedKey: string;
}

/**
 * Thin React wrapper over MapLibre GL: the map is created once, markers are reconciled by id on
 * every render, the polygon is a GeoJSON layer. Nothing else in the panel knows which map renders
 * (ADR 0008: Google Maps can replace it behind this component).
 *
 * MapLibre positions a marker by writing `transform` on the element it is given, so that element
 * is never styled or repainted here: all drawing happens in a child node, and only when the
 * marker's look actually changes.
 */
export function LiveMap({ center, zoom = 10, markers, polygon, className }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const handles = useRef(new Map<string, MarkerHandle>());
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
    const store = handles.current;
    return () => {
      map.remove();
      mapRef.current = null;
      store.clear();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();
    for (const item of markers) {
      seen.add(item.id);
      let handle = handles.current.get(item.id);
      if (!handle) {
        const { width, height, anchor } = SIZE[item.kind];
        const element = document.createElement('div');
        element.className = 'concr-marker';
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        element.style.zIndex = Z_INDEX[item.kind];
        const inner = document.createElement('div');
        inner.className = 'concr-marker-inner';
        element.appendChild(inner);
        const marker = new Marker({ element, anchor })
          .setLngLat([item.position.lng, item.position.lat])
          .addTo(map);
        handle = { marker, inner, paintedKey: '' };
        handles.current.set(item.id, handle);
      }
      const key = visualKey(item);
      if (handle.paintedKey !== key) {
        paintMarker(handle.inner, item);
        handle.paintedKey = key;
      }
      handle.marker.getElement().title = item.title ?? item.label;
      handle.inner.style.cursor = item.onClick ? 'pointer' : 'default';
      handle.inner.onclick = item.onClick ?? null;
      handle.marker.setLngLat([item.position.lng, item.position.lat]);
    }
    for (const [id, handle] of handles.current) {
      if (!seen.has(id)) {
        handle.marker.remove();
        handles.current.delete(id);
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

function visualKey(item: MapMarker): string {
  return [
    item.kind,
    item.label,
    item.color,
    item.imageUrl ?? '',
    item.heading === null || item.heading === undefined ? '' : Math.round(item.heading),
    item.alert ? 'alert' : '',
  ].join('|');
}

/** Concrete mixer silhouette (drum, cab, chassis, wheels) in a 24 × 24 box. */
const MIXER_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff" aria-hidden="true"><path d="M2.5 11.5 4 7.5q3-2 8.5-1L14 9.5V15H3.5Z"/><path d="M15 10h4.2l2.3 3v3h-6.5z"/><rect x="2" y="15" width="20" height="2.2" rx="0.6"/><circle cx="6.5" cy="18.8" r="2.2"/><circle cx="17.5" cy="18.8" r="2.2"/></svg>`;

/** Factory symbol for a plant without a logo. */
const FACTORY_SVG = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${GRAPHITE}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>`;

const LABEL_STYLE =
  'position:absolute;top:100%;left:50%;transform:translate(-50%,3px);background:rgba(18,22,31,.92);color:#fff;font:600 10px/1.2 system-ui,sans-serif;padding:2px 6px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3);pointer-events:none';

function paintMarker(inner: HTMLDivElement, item: MapMarker): void {
  inner.style.cssText = 'position:absolute;inset:0;';
  inner.innerHTML = '';
  switch (item.kind) {
    case 'plant':
      paintPlant(inner, item);
      return;
    case 'site':
      inner.innerHTML = `<svg viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path d="M14 1C7 1 1.5 6.5 1.5 13.5c0 9 12.5 21 12.5 21s12.5-12 12.5-21C26.5 6.5 21 1 14 1z" fill="${item.color}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="13.5" r="8" fill="#fff"/><text x="14" y="17.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="${GRAPHITE}">${escapeHtml(item.label)}</text></svg>`;
      return;
    case 'truck':
      paintTruck(inner, item);
      return;
    default:
      return;
  }
}

function paintPlant(inner: HTMLDivElement, item: MapMarker): void {
  const badge = document.createElement('div');
  badge.style.cssText = `position:absolute;inset:0;border-radius:999px;background:#fff;border:3px solid ${GRAPHITE};box-shadow:0 2px 6px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center;overflow:hidden`;
  if (item.imageUrl) {
    const image = document.createElement('img');
    image.src = item.imageUrl;
    image.alt = '';
    image.style.cssText = 'width:34px;height:34px;object-fit:contain;border-radius:999px';
    image.addEventListener('error', () => {
      badge.innerHTML = FACTORY_SVG;
    });
    badge.appendChild(image);
  } else {
    badge.innerHTML = FACTORY_SVG;
  }
  const label = document.createElement('span');
  label.style.cssText = LABEL_STYLE;
  label.textContent = item.label;
  inner.append(badge, label);
}

function paintTruck(inner: HTMLDivElement, item: MapMarker): void {
  const ring = item.alert
    ? `<span style="position:absolute;inset:-7px;border-radius:999px;border:3px solid #DC2626;animation:concr-pulse 1.2s ease-out infinite;pointer-events:none"></span>`
    : '';
  const arrow =
    item.heading !== null && item.heading !== undefined
      ? `<span style="position:absolute;left:50%;top:-11px;margin-left:-6px;width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${item.color};transform-origin:50% 29px;transform:rotate(${Math.round(item.heading)}deg);pointer-events:none"></span>`
      : '';
  inner.innerHTML = `${ring}${arrow}<span style="position:absolute;inset:0;border-radius:999px;background:${item.color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center">${MIXER_SVG}</span><span style="${LABEL_STYLE}">${escapeHtml(item.label)}</span>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
