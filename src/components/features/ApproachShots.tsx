"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { YearFilter } from '@/components/ui/Filters';
import { TrendChart } from '@/components/ui/TrendChart';
import { Stats, UserProfile, GolfRound } from '@/types';

export const ApproachShots = ({ stats, profile, selectedYear, onYearChange, rounds, filteredRoundsCount }: { stats: Stats; profile: UserProfile | null; selectedYear: string; onYearChange: (year: string) => void; rounds: GolfRound[]; filteredRoundsCount: number }) => {
  const hcp = profile?.handicap || 20;

  // Dynamic GIR Target based on exact HCP
  const girTarget = Math.max(5, 60 - (hcp * 2));

  const getInsight = () => {
    const strikeMissRate = stats.approachDuffRate + stats.approachTopRate;
    const directionMissRate = stats.approachMissLeftRate + stats.approachMissRightRate;
    const lengthMissRate = stats.approachMissShortRate + stats.approachMissLongRate;

    if (stats.girRate < girTarget) {
      if (stats.approachMissRightRate > strikeMissRate) {
        return "Ditt största hinder för fler greener är din riktning (högermissar), inte din bollträff. Se över sikte och klubbhuvudets vinkel vid bollträff.";
      }
      if (strikeMissRate > 15) {
        return "Träffkvaliteten hindrar dig från att nå fler greener. Fokusera på en stabilare bollträff innan du börjar jaga flaggor.";
      }
      if (lengthMissRate > directionMissRate) {
        return "Dina längdmissar är vanligare än dina riktningsmissar. Arbeta med din klubbselektion – tar du tillräckligt med klubba för att nå fram?";
      }
      return `Din GIR är under snittet för HCP ${hcp}. Fokusera på en ren bollträff för att öka din GIR %.`;
    }
    
    if (stats.girRate >= girTarget) {
      return "Riktigt bra inspel! Din precision mot green är en stor tillgång för din score.";
    }
    return "Fokusera på en ren bollträff för att öka din GIR %.";
  };

  const filteredLocalRounds = selectedYear === 'all' ? rounds : rounds.filter(r => {
    if (!r.date?.seconds) return false;
    return new Date(r.date.seconds * 1000).getFullYear().toString() === selectedYear;
  });

  const trendData = [...filteredLocalRounds].sort((a, b) => a.date?.seconds - b.date?.seconds).map((r, i) => {
    const holes = r.scores?.length || 0;
    let girHits = 0;
    if (r.shots) {
      const roundShots: any[][] = typeof r.shots === 'string' ? JSON.parse(r.shots) : r.shots;
      roundShots.forEach(hs => {
        if (hs && hs.some(s => s.result === 'Green-träff (GIR)')) girHits++;
      });
    }
    return {
      name: `R ${i + 1}`,
      gir: holes > 0 ? (girHits / holes) * 100 : 0
    };
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-black text-golf-beige uppercase tracking-tighter leading-none">Inspel</h1>
          <p className="text-[10px] text-golf-beige/40 font-medium">Baserat på {filteredRoundsCount} registrerade ronder</p>
        </div>
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} rounds={rounds} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Card className="flex flex-col items-center justify-center p-2 text-center border-golf-beige/10">
          <div className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">GIR %</div>
          <div className="text-xl font-black text-golf-beige leading-none">{Math.round(stats.girRate)}%</div>
          <div className="text-[8px] font-bold text-golf-beige/40 mt-1">Target: {Math.round(girTarget)}%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-2 text-center border-golf-beige/10">
          <div className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Duff/Topp %</div>
          <div className="text-xl font-black text-golf-beige leading-none">{Math.round(stats.approachDuffRate + stats.approachTopRate)}%</div>
          <div className="text-[8px] font-bold text-golf-beige/40 mt-1">Target: &lt; 10%</div>
        </Card>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        <Card className="flex flex-col items-center justify-center p-1.5 text-center border-golf-beige/10">
          <div className="text-[7px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Vänster</div>
          <div className="text-sm font-black text-golf-beige leading-none">{Math.round(stats.approachMissLeftRate)}%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-1.5 text-center border-golf-beige/10">
          <div className="text-[7px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Höger</div>
          <div className="text-sm font-black text-golf-beige leading-none">{Math.round(stats.approachMissRightRate)}%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-1.5 text-center border-golf-beige/10">
          <div className="text-[7px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Kort</div>
          <div className="text-sm font-black text-golf-beige leading-none">{Math.round(stats.approachMissShortRate)}%</div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-1.5 text-center border-golf-beige/10">
          <div className="text-[7px] uppercase font-bold text-golf-beige/60 tracking-widest mb-0.5">Lång</div>
          <div className="text-sm font-black text-golf-beige leading-none">{Math.round(stats.approachMissLongRate)}%</div>
        </Card>
      </div>

      <Card className="space-y-3 border-golf-beige/10 p-3">
        <div className="flex justify-between items-end">
          <h3 className="text-[9px] font-bold uppercase tracking-widest text-golf-beige/60">Inspel-tendens</h3>
        </div>
        
        <div className="space-y-2">
          <div className="h-6 w-full flex rounded-lg overflow-hidden border border-white/5">
            <div 
              className="h-full bg-golf-beige/30 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-beige/60" 
              style={{ width: `${stats.approachMissLeftRate}%` }}
            >
              {stats.approachMissLeftRate > 10 && "VÄNSTER"}
            </div>
            <div 
              className="h-full bg-golf-beige transition-all duration-1000 border-x border-golf-dark flex items-center justify-center text-[8px] font-bold text-golf-medium" 
              style={{ width: `${stats.girRate}%` }}
            >
              {stats.girRate > 10 && "GIR"}
            </div>
            <div 
              className="h-full bg-golf-beige/60 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-medium" 
              style={{ width: `${stats.approachMissRightRate}%` }}
            >
              {stats.approachMissRightRate > 10 && "HÖGER"}
            </div>
            <div 
              className="h-full bg-black/40 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-beige/40" 
              style={{ width: `${stats.approachDuffRate}%` }}
            >
              {stats.approachDuffRate > 10 && "DUFF"}
            </div>
            <div 
              className="h-full bg-black/60 transition-all duration-1000 flex items-center justify-center text-[8px] font-bold text-golf-beige/20" 
              style={{ width: `${stats.approachTopRate}%` }}
            >
              {stats.approachTopRate > 10 && "TOPP"}
            </div>
          </div>
          
          <div className="flex flex-wrap justify-between gap-y-1 text-[8px] font-bold uppercase tracking-widest text-golf-beige/40 px-0.5">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-golf-beige/30" /> Vänster ({Math.round(stats.approachMissLeftRate)}%)</div>
            <div className="flex items-center gap-1.5 text-golf-beige"><div className="w-2 h-2 rounded bg-golf-beige" /> GIR ({Math.round(stats.girRate)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-golf-beige/60" /> Höger ({Math.round(stats.approachMissRightRate)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-black/40" /> Duff ({Math.round(stats.approachDuffRate)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-black/60" /> Topp ({Math.round(stats.approachTopRate)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-golf-beige/20" /> Kort ({Math.round(stats.approachMissShortRate)}%)</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded bg-golf-beige/10" /> Lång ({Math.round(stats.approachMissLongRate)}%)</div>
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
                <span className="text-[9px] text-golf-beige/60 font-bold uppercase">Minska Duff % till:</span>
                <span className="text-sm font-black text-golf-beige">{"< 10%"}</span>
              </div>
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (10 / Math.max(0.1, stats.approachDuffRate)) * 100)}%` }}
                  className="h-full bg-golf-beige"
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-golf-beige/60 font-bold uppercase">Öka GIR % till:</span>
                <span className="text-sm font-black text-golf-beige">{girTarget + 5}%</span>
              </div>
              <div className="h-1 w-full bg-black/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (stats.girRate / (girTarget + 5)) * 100)}%` }}
                  className="h-full bg-golf-beige"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-3 border-golf-beige/10 mt-3">
        <h3 className="text-[10px] font-bold mb-1.5 text-golf-beige uppercase tracking-widest">GIR Trend</h3>
        <TrendChart 
          data={trendData} 
          dataKey="gir" 
          target={girTarget} 
          targetLabel="Mål"
          valueFormatter={(val) => `${Math.round(val)}%`}
        />
      </Card>
    </div>
  );
};
