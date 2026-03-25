"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { YearFilter } from '@/components/ui/Filters';
import { Stats, UserProfile, GolfRound } from '@/types';

export const TeeShots = ({ stats, profile, selectedYear, onYearChange, rounds, filteredRoundsCount }: { stats: Stats; profile: UserProfile | null; selectedYear: string; onYearChange: (year: string) => void; rounds: GolfRound[]; filteredRoundsCount: number }) => {
  const hcp = profile?.handicap || 20;

  // Dynamic FIR Target based on exact HCP
  const firTarget = Math.max(20, 60 - (hcp * 0.5));

  const getInsight = () => {
    if (stats.fairwayAccuracy < firTarget) {
      return `Din fairway-procent är lägre än snittet för HCP ${hcp}. Överväg att slå en mer kontrollerad klubba (t.ex. Spoon eller Hybrid) på smala hål.`;
    }
    if (stats.missRightRate > 25) {
      return "Du har en tydlig tendens att missa till höger. Justera ditt sikte eller kontrollera din uppställning för att centrera dina utslag.";
    }
    if (stats.missLeftRate > 25) {
      return "Du har en tydlig tendens att missa till vänster. Justera ditt sikte eller kontrollera din uppställning för att centrera dina utslag.";
    }
    if (stats.fairwayAccuracy >= firTarget) {
      return "Grymt jobb från tee! Din precision ger dig de bästa förutsättningarna för att sänka din score.";
    }
    return "Välj rätt klubba för att maximera chansen till fairway-träff.";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-black text-golf-beige uppercase tracking-tighter leading-none">Utslag</h1>
          <p className="text-[10px] text-golf-beige/40 font-medium">Baserat på {filteredRoundsCount} registrerade ronder</p>
        </div>
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} rounds={rounds} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="flex flex-col items-center justify-center p-2 text-center border-golf-beige/10">
          <div className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">FIR %</div>
          <div className="text-xl font-black text-golf-beige leading-none">{Math.round(stats.fairwayAccuracy)}%</div>
          <div className="text-[8px] font-bold text-golf-beige/40 mt-1">Target: {Math.round(firTarget)}%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-2 text-center border-golf-beige/10">
          <div className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Miss Vänster</div>
          <div className="text-xl font-black text-golf-beige leading-none">{Math.round(stats.missLeftRate)}%</div>
          <div className="text-[8px] font-bold text-golf-beige/40 mt-1">Target: &lt; 20%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-2 text-center border-golf-beige/10">
          <div className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Miss Höger</div>
          <div className="text-xl font-black text-golf-beige leading-none">{Math.round(stats.missRightRate)}%</div>
          <div className="text-[8px] font-bold text-golf-beige/40 mt-1">Target: &lt; 20%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-2 text-center border-golf-beige/10">
          <div className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Övriga Missar</div>
          <div className="text-xl font-black text-golf-beige leading-none">{Math.round(stats.missOtherRate)}%</div>
          <div className="text-[8px] font-bold text-golf-beige/40 mt-1">Target: &lt; 10%</div>
        </Card>
      </div>

      <Card className="space-y-3 border-golf-beige/10 p-3">
        <div className="flex justify-between items-end">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-golf-beige/60">Miss-tendens</h3>
        </div>
        
        <div className="space-y-2">
          <div className="h-6 w-full flex rounded-lg overflow-hidden border border-white/5">
            <div 
              className="h-full bg-golf-beige/30 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-beige/60" 
              style={{ width: `${stats.missLeftRate}%` }}
            >
              {stats.missLeftRate > 15 && "VÄNSTER"}
            </div>
            <div 
              className="h-full bg-golf-beige transition-all duration-1000 border-x border-golf-dark flex items-center justify-center text-[8px] font-bold text-golf-medium" 
              style={{ width: `${stats.fairwayAccuracy}%` }}
            >
              {stats.fairwayAccuracy > 15 && "FIR"}
            </div>
            <div 
              className="h-full bg-golf-beige/60 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-medium" 
              style={{ width: `${stats.missRightRate}%` }}
            >
              {stats.missRightRate > 15 && "HÖGER"}
            </div>
            <div 
              className="h-full bg-black/40 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-beige/40" 
              style={{ width: `${stats.missOtherRate}%` }}
            >
              {stats.missOtherRate > 15 && "ÖVRIGT"}
            </div>
          </div>
          
          <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest text-golf-beige/40 px-0.5">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-golf-beige/30" /> Vänster ({Math.round(stats.missLeftRate)}%)</div>
            <div className="flex items-center gap-1.5 text-golf-beige"><div className="w-2 h-2 rounded bg-golf-beige" /> Center ({Math.round(stats.fairwayAccuracy)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-golf-beige/60" /> Höger ({Math.round(stats.missRightRate)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-black/40" /> Övrigt ({Math.round(stats.missOtherRate)}%)</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="p-3 space-y-2 border-golf-beige/10">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-golf-beige/60">Strategisk Insikt</h3>
          <p className="text-[11px] text-golf-beige/80 leading-relaxed italic">
            "{getInsight()}"
          </p>
        </Card>
        <Card className="p-3 space-y-3 border-golf-beige/10">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-golf-beige/60">Målsättning</h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-golf-beige/60 font-bold uppercase">Minska Miss Höger till:</span>
                <span className="text-sm font-black text-golf-beige">{"< 15%"}</span>
              </div>
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (15 / Math.max(0.1, stats.missRightRate)) * 100)}%` }}
                  className="h-full bg-golf-beige"
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-golf-beige/60 font-bold uppercase">Öka FIR % till:</span>
                <span className="text-sm font-black text-golf-beige">{firTarget}%</span>
              </div>
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats.fairwayAccuracy / firTarget) * 100)}%` }}
                  className="h-full bg-golf-beige"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
