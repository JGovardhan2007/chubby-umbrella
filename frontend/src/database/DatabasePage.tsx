import React, { useState } from 'react';
import { HistoricalDateSelector } from './HistoricalDateSelector';
import { HistoricalMapPlayer } from './HistoricalMapPlayer';
import { HistoricalDayRecord } from './types';

export const DatabasePage: React.FC = () => {
  const [selectedDay, setSelectedDay] = useState<HistoricalDayRecord | null>(null);

  if (selectedDay) {
    return (
      <div className="flex-1 h-full w-full overflow-hidden">
        <HistoricalMapPlayer
          dayRecord={selectedDay}
          onBack={() => setSelectedDay(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#F4EFEA] text-slate-800 flex flex-col font-sans select-none">
      <HistoricalDateSelector onSelectDay={(day) => setSelectedDay(day)} />
    </div>
  );
};
