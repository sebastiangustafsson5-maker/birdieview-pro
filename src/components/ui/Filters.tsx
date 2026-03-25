import React, { useMemo } from 'react';
import { GolfRound } from '@/types';

export const YearFilter = ({ selectedYear, onYearChange, rounds }: { selectedYear: string; onYearChange: (year: string) => void; rounds: GolfRound[] }) => {
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    rounds.forEach(r => {
      if (r.date?.seconds) {
        yearsSet.add(new Date(r.date.seconds * 1000).getFullYear().toString());
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [rounds]);

  return (
    <div className="flex justify-end mb-2">
      <select 
        value={selectedYear}
        onChange={(e) => onYearChange(e.target.value)}
        className="bg-golf-medium text-golf-beige text-[10px] font-bold py-1 px-2 rounded-lg border border-white/10 outline-none focus:ring-1 focus:ring-golf-beige/30 appearance-none text-center min-w-[80px]"
      >
        <option value="all">Alla år</option>
        {years.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
    </div>
  );
};

export const RoundCounter = ({ count }: { count: number }) => (
  <p className="text-[9px] text-golf-beige/40 font-bold uppercase tracking-wider mb-2">Baserat på {count} registrerade ronder</p>
);
