'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import type { Map as LeafletMap, LayerGroup } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapCluster } from '@/lib/map';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function MapCanvas({ clusters, prefix }: { clusters: MapCluster[]; prefix: string }) {
  const t = useTranslations('Map');
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let disposed = false;

    (async () => {
      const L = await import('leaflet');
      if (disposed || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          scrollWheelZoom: true,
          worldCopyJump: true
        }).setView([28, 3], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap'
        }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      const map = mapRef.current;
      const layer = layerRef.current;
      if (!map || !layer) return;

      layer.clearLayers();
      const bounds: Array<[number, number]> = [];

      for (const cluster of clusters) {
        const radius = Math.min(28, 5 + Math.sqrt(cluster.count) * 1.8);
        const marker = L.circleMarker([cluster.lat, cluster.lng], {
          radius,
          color: '#1f6f5c',
          weight: 1.4,
          fillColor: '#1f6f5c',
          fillOpacity: 0.3
        });
        marker.bindPopup(
          `<div style="font:13px/1.45 system-ui,sans-serif;min-width:160px">
            <strong>${escapeHtml(cluster.sampleName)}</strong><br/>
            ${escapeHtml(t('projectsCount', { count: cluster.count }))}<br/>
            <a href="${prefix}/startup/${cluster.sampleId}">${escapeHtml(t('viewProject'))}</a>
          </div>`
        );
        marker.addTo(layer);
        bounds.push([cluster.lat, cluster.lng]);
      }

      if (bounds.length > 0) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 });
      }
      window.setTimeout(() => map.invalidateSize(), 60);
    })();

    return () => {
      disposed = true;
    };
  }, [clusters, prefix, t]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label={t('canvasLabel')}
      className="relative z-0 h-[520px] w-full overflow-hidden rounded-2xl border border-line/60 bg-surface"
    />
  );
}
