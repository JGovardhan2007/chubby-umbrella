import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';

interface RadarLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  radarPoints?: { lat: number; lon: number; dbz: number }[];
  centerLat?: number;
  centerLon?: number;
  maxDbz?: number;
}

export const RadarLayer: React.FC<RadarLayerProps> = ({
  map,
  visible,
  radarPoints = [],
  centerLat,
  centerLon,
  maxDbz
}) => {
  const [liveRadarPath, setLiveRadarPath] = useState<string | null>(null);

  // 1. Fetch latest real-time Live Doppler Weather Radar raster tile path from RainViewer
  useEffect(() => {
    let isMounted = true;
    const fetchLiveRadar = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        if (res.ok) {
          const data = await res.json();
          const pastFrames = data.radar?.past;
          if (pastFrames && pastFrames.length > 0 && isMounted) {
            const latest = pastFrames[pastFrames.length - 1];
            setLiveRadarPath(latest.path);
          }
        }
      } catch (err) {
        console.warn('Could not fetch RainViewer live radar metadata:', err);
      }
    };

    fetchLiveRadar();
    const interval = setInterval(fetchLiveRadar, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Manage Real Live Doppler Radar Raster Tile Layer on Map
  useEffect(() => {
    if (!map) return;

    const liveRasterSourceId = 'live-rainviewer-radar-source';
    const liveRasterLayerId = 'live-rainviewer-radar-layer';

    if (liveRadarPath) {
      const tileUrl = `https://tilecache.rainviewer.com${liveRadarPath}/256/{z}/{x}/{y}/4/1_1.png`;

      // Check if style is loaded
      if (!map.isStyleLoaded()) {
        const onStyleLoad = () => {
          if (!map.getSource(liveRasterSourceId)) {
            map.addSource(liveRasterSourceId, {
              type: 'raster',
              tiles: [tileUrl],
              tileSize: 256,
              minzoom: 0,
              maxzoom: 7,
              attribution: 'Live Global Doppler Radar (RainViewer)'
            });
            map.addLayer({
              id: liveRasterLayerId,
              type: 'raster',
              source: liveRasterSourceId,
              paint: {
                'raster-opacity': 0.85,
                'raster-resampling': 'linear',
                'raster-fade-duration': 200
              }
            });
          }
        };
        map.once('styledata', onStyleLoad);
        return;
      }

      if (map.getSource(liveRasterSourceId)) {
        const existingLayer = map.getLayer(liveRasterLayerId);
        if (existingLayer) {
          map.setLayoutProperty(liveRasterLayerId, 'visibility', visible ? 'visible' : 'none');
        }
      } else {
        map.addSource(liveRasterSourceId, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          minzoom: 0,
          maxzoom: 7,
          attribution: 'Live Global Doppler Radar (RainViewer)'
        });

        map.addLayer({
          id: liveRasterLayerId,
          type: 'raster',
          source: liveRasterSourceId,
          paint: {
            'raster-opacity': 0.85,
            'raster-resampling': 'linear',
            'raster-fade-duration': 200
          }
        });
      }
    }

    if (map.getLayer(liveRasterLayerId)) {
      map.setLayoutProperty(liveRasterLayerId, 'visibility', visible ? 'visible' : 'none');
    }
  }, [map, visible, liveRadarPath]);

  // 3. Manage High-Resolution Local Convective Cell Contours
  useEffect(() => {
    if (!map) return;

    const sourceId = 'radar-reflectivity-source';
    const fillLayerId = 'radar-reflectivity-fill';
    const outlineLayerId = 'radar-reflectivity-outline';

    // Generate realistic organic multi-lobed radar reflectivity contours
    const buildRadarFeatures = (pulseFactor: number = 1.0) => {
      const features: any[] = [];

      const dbzLevels = [
        { minDbz: 20, color: 'rgba(56, 189, 248, 0.35)', stroke: '#38BDF8', radiusKm: 42 * pulseFactor, lobes: 5, noise: 0.18 },
        { minDbz: 32, color: 'rgba(34, 197, 94, 0.50)', stroke: '#22C55E', radiusKm: 30 * pulseFactor, lobes: 4, noise: 0.22 },
        { minDbz: 42, color: 'rgba(234, 179, 8, 0.70)', stroke: '#EAB308', radiusKm: 20 * pulseFactor, lobes: 3, noise: 0.25 },
        { minDbz: 50, color: 'rgba(239, 68, 68, 0.85)', stroke: '#EF4444', radiusKm: 12 * pulseFactor, lobes: 3, noise: 0.20 },
        { minDbz: 56, color: 'rgba(168, 85, 247, 0.95)', stroke: '#A855F7', radiusKm: 6 * pulseFactor, lobes: 2, noise: 0.15 },
      ];

      if (centerLat && centerLon && maxDbz) {
        for (const lvl of dbzLevels) {
          if (maxDbz >= lvl.minDbz) {
            const poly = createOrganicRadarCoords(centerLat, centerLon, lvl.radiusKm, lvl.lobes, lvl.noise);
            features.push({
              type: 'Feature' as const,
              geometry: {
                type: 'Polygon' as const,
                coordinates: [poly]
              },
              properties: {
                dbz: lvl.minDbz,
                color: lvl.color,
                stroke: lvl.stroke
              }
            });
          }
        }
      }

      // Add extra Doppler radar sample scatter points
      for (const pt of radarPoints) {
        features.push({
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [pt.lon, pt.lat]
          },
          properties: {
            dbz: pt.dbz,
            color: pt.dbz >= 50 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(34, 197, 94, 0.65)',
            stroke: '#FFFFFF'
          }
        });
      }

      return features;
    };

    const initialFeatures = buildRadarFeatures(1.0);
    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: initialFeatures
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      });

      // Semi-transparent radar reflectivity fill
      map.addLayer({
        id: fillLayerId,
        type: 'fill',
        source: sourceId,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.82
        }
      });

      // Smooth radar contour outline
      map.addLayer({
        id: outlineLayerId,
        type: 'line',
        source: sourceId,
        filter: ['==', '$type', 'Polygon'],
        paint: {
          'line-color': ['get', 'stroke'],
          'line-width': 1.5,
          'line-opacity': 0.75
        }
      });
    }

    // Update visibility
    [fillLayerId, outlineLayerId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });

  }, [map, visible, radarPoints, centerLat, centerLon, maxDbz]);

  return null;
};

/**
 * Creates realistic organic, multi-lobed Doppler radar reflectivity contours
 * mimicking real turbulent rain bands and convective cell boundaries.
 */
function createOrganicRadarCoords(
  lat: number,
  lon: number,
  radiusKm: number,
  lobes: number = 4,
  noiseAmp: number = 0.2,
  points: number = 36
): [number, number][] {
  const coords: [number, number][] = [];
  const cosLat = Math.cos((lat * Math.PI) / 180);

  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points;

    // Harmonic multi-lobed elongation along storm convective axis
    const elongation = 1.0 + 0.22 * Math.cos(angle - 0.8) + 0.15 * Math.sin(lobes * angle);
    const rKm = radiusKm * (elongation + noiseAmp * Math.sin(7 * angle));

    const dLat = (rKm * Math.cos(angle)) / 111.0;
    const dLon = (rKm * Math.sin(angle)) / (111.0 * Math.max(cosLat, 0.1));

    coords.push([Number((lon + dLon).toFixed(4)), Number((lat + dLat).toFixed(4))]);
  }

  return coords;
}
