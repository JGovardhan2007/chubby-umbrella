import React, { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { MAJOR_RADAR_CITIES, LocationOption } from '../panels/TopBar';

interface RadarStationLayerProps {
  map: maplibregl.Map | null;
  onSelectStation?: (station: LocationOption) => void;
}

export const RadarStationLayer: React.FC<RadarStationLayerProps> = ({
  map,
  onSelectStation
}) => {
  useEffect(() => {
    if (!map) return;

    const sourceId = 'nationwide-radar-stations-source';
    const pointLayerId = 'nationwide-radar-stations-points';
    const ringLayerId = 'nationwide-radar-stations-rings';
    const labelLayerId = 'nationwide-radar-stations-labels';

    const features: GeoJSON.Feature[] = MAJOR_RADAR_CITIES.map((city, idx) => ({
      type: 'Feature',
      id: idx,
      geometry: {
        type: 'Point',
        coordinates: [city.lon, city.lat]
      },
      properties: {
        name: city.name,
        state: city.state,
        radarStation: city.radarStation,
        lat: city.lat,
        lon: city.lon
      }
    }));

    const geojsonData: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features
    };

    if (map.getSource(sourceId)) {
      (map.getSource(sourceId) as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource(sourceId, {
        type: 'geojson',
        data: geojsonData
      });

      // 1. Radar coverage rings (subtle neutral slate footprint)
      map.addLayer({
        id: ringLayerId,
        type: 'circle',
        source: sourceId,
        maxzoom: 9,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 18,
            6, 38,
            8, 75
          ],
          'circle-color': '#334155',
          'circle-opacity': 0.04,
          'circle-stroke-width': 1.0,
          'circle-stroke-color': '#64748B',
          'circle-stroke-opacity': 0.25
        }
      });

      // 2. Doppler radar station observatory beacons (charcoal slate with white border)
      map.addLayer({
        id: pointLayerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            4, 3.5,
            7, 5,
            10, 6.5
          ],
          'circle-color': '#0F172A',
          'circle-stroke-width': 1.8,
          'circle-stroke-color': '#FFFFFF'
        }
      });

      // 3. Station name labels with radar tower prefix
      map.addLayer({
        id: labelLayerId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['concat', '📡 ', ['get', 'name']],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-size': 10.5,
          'text-offset': [0, 1.2],
          'text-anchor': 'top',
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#334155',
          'text-halo-color': '#FFFFFF',
          'text-halo-width': 2.0
        }
      });

      // Handle clicking radar station to jump
      map.on('click', pointLayerId, (e) => {
        if (e.features && e.features[0] && onSelectStation) {
          const props = e.features[0].properties as any;
          onSelectStation({
            name: props.name,
            state: props.state,
            lat: Number(props.lat),
            lon: Number(props.lon),
            radarStation: props.radarStation
          });
        }
      });

      map.on('mouseenter', pointLayerId, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', pointLayerId, () => {
        map.getCanvas().style.cursor = '';
      });
    }
  }, [map, onSelectStation]);

  return null;
};
