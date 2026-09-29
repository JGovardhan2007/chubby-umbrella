import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Wind, Droplets, Thermometer, CloudFog, Cloud, Moon, CloudSun, Waves } from 'lucide-react';
import { CityWeatherRecord, CityForecastModal } from './CityForecastModal';

export const MAJOR_CITIES_WEATHER_DATA: CityWeatherRecord[] = [
  {
    city: 'Kolkata',
    condition: 'Haze',
    temp: '31.0 ° C',
    windDirection: 'Calm',
    windSpeed: '0 km/h',
    humidity: '75 %',
    lat: 22.5726,
    lon: 88.3639
  },
  {
    city: 'Ahmedabad',
    condition: 'Smoke Fog',
    temp: '29.0 ° C',
    windDirection: 'No Direction',
    windSpeed: '3.7 km/h',
    humidity: '58 %',
    lat: 23.0225,
    lon: 72.5714
  },
  {
    city: 'Pune',
    condition: 'Generally Cloudy Sky',
    temp: '28.6 ° C',
    windDirection: 'Calm',
    windSpeed: '0 km/h',
    humidity: '70 %',
    lat: 18.5204,
    lon: 73.8567
  },
  {
    city: 'Delhi',
    condition: 'Clear Sky',
    temp: '30.8 ° C',
    windDirection: 'Southwesterly',
    windSpeed: '9.3 km/h',
    humidity: '61 %',
    lat: 28.6139,
    lon: 77.2090
  },
  {
    city: 'Mumbai',
    condition: 'Smoke Fog',
    temp: '26.0 ° C',
    windDirection: 'Northwesterly',
    windSpeed: '13 km/h',
    humidity: '79 %',
    lat: 19.0760,
    lon: 72.8777
  },
  {
    city: 'Chennai',
    condition: 'Humid / Partly Cloudy',
    temp: '31.4 ° C',
    windDirection: 'Easterly',
    windSpeed: '14.2 km/h',
    humidity: '82 %',
    lat: 13.0827,
    lon: 80.2707
  },
  {
    city: 'Bengaluru',
    condition: 'Passing Showers',
    temp: '27.2 ° C',
    windDirection: 'Westerly',
    windSpeed: '11.5 km/h',
    humidity: '68 %',
    lat: 12.9716,
    lon: 77.5946
  },
  {
    city: 'Hyderabad',
    condition: 'Scattered Clouds',
    temp: '29.5 ° C',
    windDirection: 'Northwesterly',
    windSpeed: '8.0 km/h',
    humidity: '64 %',
    lat: 17.3850,
    lon: 78.4867
  }
];

interface MajorCitiesWeatherProps {
  onOpenMapForCity: (city: { name: string; lat: number; lon: number }) => void;
}

export const MajorCitiesWeather: React.FC<MajorCitiesWeatherProps> = ({ onOpenMapForCity }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [selectedForecastCity, setSelectedForecastCity] = useState<CityWeatherRecord | null>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const renderWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('clear')) {
      return <Moon className="w-7 h-7 text-cyan-200 stroke-[1.7]" />;
    }
    if (c.includes('cloud')) {
      return <Cloud className="w-7 h-7 text-cyan-200 stroke-[1.7]" />;
    }
    if (c.includes('fog') || c.includes('smoke')) {
      return (
        <div className="flex flex-col items-center justify-center">
          <CloudFog className="w-7 h-7 text-cyan-200 stroke-[1.7]" />
        </div>
      );
    }
    if (c.includes('haze')) {
      return (
        <div className="flex items-center justify-center">
          <Waves className="w-7 h-7 text-cyan-200 stroke-[1.7]" />
        </div>
      );
    }
    return <CloudSun className="w-7 h-7 text-cyan-200 stroke-[1.7]" />;
  };

  return (
    <div className="bg-[#004B87] text-white rounded-2xl overflow-hidden shadow-xl border border-blue-600/40 select-none flex flex-col h-[560px]">
      {/* 1. Header: Matches IMD "CURRENT WEATHER ACROSS MAJOR CITIES" */}
      <div className="py-4 px-6 text-center border-b border-blue-400/20 relative bg-[#004278]">
        <h2 className="text-base sm:text-lg font-bold tracking-wider uppercase text-white font-sans">
          CURRENT WEATHER ACROSS MAJOR CITIES
        </h2>
        <p className="text-[11px] text-cyan-200/90 font-medium mt-0.5">
          India Meteorological Department (IMD) • Live Station Observations
        </p>

        {/* Carousel Scroll Buttons */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            onClick={scrollLeft}
            title="Scroll Left"
            className="w-7 h-7 rounded-full bg-blue-900/80 hover:bg-blue-800 border border-blue-400/40 text-cyan-200 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={scrollRight}
            title="Scroll Right"
            className="w-7 h-7 rounded-full bg-blue-900/80 hover:bg-blue-800 border border-blue-400/40 text-cyan-200 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Scrollable City Cards Container */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-5 overflow-x-auto overflow-y-auto flex gap-4 items-stretch scroll-smooth"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {MAJOR_CITIES_WEATHER_DATA.map((record) => (
          <div
            key={record.city}
            style={{ scrollSnapAlign: 'start' }}
            className="w-[200px] sm:w-[220px] shrink-0 bg-[#003B6D]/80 hover:bg-[#003B6D] border border-blue-400/30 rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg hover:border-cyan-400/60 group"
          >
            {/* City Title */}
            <div className="text-center pb-2 border-b border-blue-400/20">
              <h3 className="text-base font-bold text-white tracking-wide">
                {record.city}
              </h3>
            </div>

            {/* Row 1: Weather Condition Icon & Thermometer / Temp */}
            <div className="grid grid-cols-2 gap-2 my-3 text-center items-center">
              {/* Condition */}
              <div className="flex flex-col items-center justify-center">
                <div className="mb-1 flex items-center justify-center h-8">
                  {renderWeatherIcon(record.condition)}
                </div>
                <span className="text-[11px] font-medium text-slate-200 leading-tight">
                  {record.condition}
                </span>
              </div>

              {/* Temp */}
              <div className="flex flex-col items-center justify-center">
                <div className="mb-1 flex items-center justify-center h-8">
                  <Thermometer className="w-6 h-6 text-cyan-200 stroke-[1.7]" />
                </div>
                <span className="text-xs font-bold text-white">
                  {record.temp}
                </span>
              </div>
            </div>

            {/* Row 2: Wind and Humidity */}
            <div className="grid grid-cols-2 gap-2 my-2 text-center items-center border-t border-blue-400/20 pt-3">
              {/* Wind */}
              <div className="flex flex-col items-center justify-center">
                <Wind className="w-5 h-5 text-cyan-200 stroke-[1.7] mb-1" />
                <span className="text-[10px] text-slate-300 font-medium leading-tight">
                  {record.windDirection}
                </span>
                <span className="text-[10px] font-bold text-white mt-0.5">
                  {record.windSpeed}
                </span>
              </div>

              {/* Humidity */}
              <div className="flex flex-col items-center justify-center">
                <Droplets className="w-5 h-5 text-cyan-200 stroke-[1.7] mb-1" />
                <span className="text-[10px] text-slate-300 font-medium">
                  Humidity
                </span>
                <span className="text-xs font-bold text-white mt-0.5">
                  {record.humidity}
                </span>
              </div>
            </div>

            {/* FORECAST Button in Gold/Yellow */}
            <div className="pt-3 text-center border-t border-blue-400/20">
              <button
                onClick={() => setSelectedForecastCity(record)}
                className="w-full py-1.5 text-xs font-black tracking-wider text-[#FCD34D] hover:text-amber-200 hover:bg-blue-900/60 rounded-lg uppercase transition-all duration-150"
              >
                FORECAST
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom Information Bar */}
      <div className="bg-[#003868] px-6 py-2.5 border-t border-blue-400/20 flex items-center justify-between text-xs text-cyan-200/90">
        <span className="text-[11px]">
          Observation frequency: 15-minute AWS surface cycle
        </span>
        <button
          onClick={() => onOpenMapForCity({ name: 'Chennai', lat: 13.0827, lon: 80.2707 })}
          className="text-xs font-bold text-[#FCD34D] hover:underline"
        >
          View All Synoptic Radar Stations →
        </button>
      </div>

      {/* Modal on clicking FORECAST */}
      <CityForecastModal
        city={selectedForecastCity}
        onClose={() => setSelectedForecastCity(null)}
        onOpenMap={(c) => onOpenMapForCity({ name: c.city, lat: c.lat, lon: c.lon })}
      />
    </div>
  );
};
