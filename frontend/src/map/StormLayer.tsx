import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { StormCell } from '../types/storm';
import { formatStormName } from '../utils/formatters';

interface StormLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  storms: StormCell[];
  selectedStormId: string | null;
  onSelectStorm: (storm: StormCell) => void;
}

export const StormLayer: React.FC<StormLayerProps> = ({
  map,
  visible,
  storms,
  selectedStormId,
  onSelectStorm
}) => {
  useEffect(() => {
    if (!map) return;

    const polySourceId = 'storm-cells-poly-source';
    const polyFillLayerId = 'storm-cells-fill';
    const polyLineLayerId = 'storm-cells-outline';

    const centroidSourceId = 'storm-cells-centroid-source';
    const centroidLayerId = 'storm-cells-centroids';
    const labelLayerId = 'storm-cells-labels';

    // 1. Build Polygons GeoJSON
    const polyFeatures = storms
      .filter((s) => s.polygon_coords && s.polygon_coords.length >= 3)
      .map((s, idx) => ({
        type: 'Feature' as const,
        id: s.storm_id,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [s.polygon_coords!]
        },
        properties: {
          storm_id: s.storm_id,
          display_name: formatStormName(s.storm_id, idx),
          intensity: s.intensity,
          isSelected: s.storm_id === selectedStormId,
          color: s.intensity >= 52 ? '#EF4444' : s.intensity >= 45 ? '#EAB308' : '#38BDF8'
        }
      }));

    // 2. Build Centroids GeoJSON
    const centroidFeatures = storms.map((s, idx) => ({
      type: 'Feature' as const,
      id: s.storm_id,
      geometry: {
        type: 'Point' as const,
        coordinates: [s.centroid_lon, s.centroid_lat]
      },
      properties: {
        storm_id: s.storm_id,
        display_name: formatStormName(s.storm_id, idx),
        intensity: s.intensity,
        stage: s.convective_stage,
        speed: s.speed_kmh,
        heading: s.heading_deg,
        isSelected: s.storm_id === selectedStormId
      }
    }));

    // Update or Add Polygons Source
    if (map.getSource(polySourceId)) {
      (map.getSource(polySourceId) as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: polyFeatures
      });
    } else {
      map.addSource(polySourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: polyFeatures }
      });

      map.addLayer({
        id: polyFillLayerId,
        type: 'fill',
        source: polySourceId,
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': ['case', ['get', 'isSelected'], 0.5, 0.25]
        }
      });

      map.addLayer({
        id: polyLineLayerId,
        type: 'line',
        source: polySourceId,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': ['case', ['get', 'isSelected'], 3.0, 1.8],
          'line-dasharray': [1, 0]
        }
      });
    }

    // Update or Add Centroids Source
    if (map.getSource(centroidSourceId)) {
      (map.getSource(centroidSourceId) as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: centroidFeatures
      });
    } else {
      map.addSource(centroidSourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: centroidFeatures }
      });

      // Pulsing outer halo for active convective cores
      map.addLayer({
        id: 'storm-cells-halo',
        type: 'circle',
        source: centroidSourceId,
        paint: {
          'circle-radius': ['case', ['get', 'isSelected'], 16, 12],
          'circle-color': '#F59E0B',
          'circle-opacity': 0.25,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#F59E0B',
          'circle-stroke-opacity': 0.6
        }
      });

      // Centroid marker point
      map.addLayer({
        id: centroidLayerId,
        type: 'circle',
        source: centroidSourceId,
        paint: {
          'circle-radius': ['case', ['get', 'isSelected'], 9, 7],
          'circle-color': '#F59E0B',
          'circle-stroke-width': 3,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // Centroid label text & detail tag
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: centroidSourceId,
        layout: {
          'text-field': ['concat', ['get', 'display_name'], ' (', ['to-string', ['round', ['get', 'intensity']]], ' dBZ)'],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 11,
          'text-offset': [0, 1.6],
          'text-anchor': 'top'
        },
        paint: {
          'text-color': '#0F172A',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2.5
        }
      });

      // Click & Hover handlers on storm centroid or polygon
      const handleStormClick = (e: any) => {
        if (e.features && e.features.length > 0) {
          const clickedId = e.features[0].properties.storm_id;
          const match = storms.find((s) => s.storm_id === clickedId);
          if (match) {
            onSelectStorm(match);
          }
        }
      };

      const handleMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };

      const handleMouseLeave = () => {
        map.getCanvas().style.cursor = 'default';
      };

      map.on('click', centroidLayerId, handleStormClick);
      map.on('click', polyFillLayerId, handleStormClick);

      map.on('mouseenter', centroidLayerId, handleMouseEnter);
      map.on('mouseleave', centroidLayerId, handleMouseLeave);
      map.on('mouseenter', polyFillLayerId, handleMouseEnter);
      map.on('mouseleave', polyFillLayerId, handleMouseLeave);
    }

    // Toggle visibility
    [polyFillLayerId, polyLineLayerId, 'storm-cells-halo', centroidLayerId, labelLayerId].forEach((layerId) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    });

  }, [map, visible, storms, selectedStormId, onSelectStorm]);

  return null;
};
