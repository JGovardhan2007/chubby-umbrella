import React, { useState } from 'react';
import { ForecastCardGrid } from './ForecastCardGrid';
import { ForecastMapViewer } from './ForecastMapViewer';
import { ForecastCategory } from './types';

export const MapsPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<ForecastCategory | null>(null);

  if (selectedCategory) {
    return (
      <div className="flex-1 h-full w-full overflow-hidden">
        <ForecastMapViewer
          category={selectedCategory}
          onBack={() => setSelectedCategory(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4EFEA] text-slate-800 flex flex-col font-sans">
      <ForecastCardGrid onSelectMap={(cat) => setSelectedCategory(cat)} />
    </div>
  );
};
