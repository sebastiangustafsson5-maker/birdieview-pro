"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { YearFilter } from '@/components/ui/Filters';
import { TrendChart } from '@/components/ui/TrendChart';
import { Stats, UserProfile, GolfRound } from '@/types';
import { cn } from '@/components/ui/Card';

export const Putting = ({ stats, profile, selectedYear, onYearChange, rounds, filteredRoundsCount }: { stats: Stats; profile: UserProfile | null; selectedYear: string; onYearChange: (year: string) => void; rounds: GolfRound[]; filteredRoundsCount: number }) => {
  const hcp = profile?.handicap || 20;

  // Dynamic targets based on exact HCP
  const targets = {
    puttsPerRound: Math.max(28, 30 + (hcp * 0.1)),
    avgPutts: Math.max(1.6, 1.7 + (hcp * 0.01)),
    inside3m: Math.max(40, 85 - (hcp * 1.5)),
    threePuttRate: Math.max(2, 5 + (hcp * 0.5))
  };

  const metrics = [
    { name: 'Puttar / Runda', value: stats.avgPutts * 18, target: targets.puttsPerRound, unit: '', desc: 'Totalt antal puttar per 18 hål.', isLowerBetter: true },
    { name: 'Snitt / Hål', value: stats.avgPutts, target: targets.avgPutts, unit: '', desc: 'Antal puttar i snitt per hål.', isLowerBetter: true },
    { name: 'Inom 3m %', value: stats.makeRateInside3m, target: targets.inside3m, unit: '%', desc: 'Sänkta puttar från inom 3 meter.', isLowerBetter: false },
    { name: '3-Putt %', value: stats.threePuttRate, target: targets.threePuttRate, unit: '%', desc: 'Andel hål med 3 puttar eller fler.', isLowerBetter: true },
  ];

  const getInsight = () => {
    if (stats.threePuttRate > targets.threePuttRate) {
      return "Du har för många 3-puttar. Fokusera på din längdkontroll på de långa förstaputtarna för att lämna enklare returer.";
    }
    if (stats.makeRateInside3m > targets.inside3m) {
      return "Starkt spel inom 3 meter! Det är här du räddar dina par och utnyttjar dina birdies.";
    }
    if (stats.avgPutts > targets.avgPutts && stats.makeRateInside3m >= targets.inside3m) {
      return "Ditt totala antal puttar är högt, troligtvis pga. svagt närspel som lämnar för långa förstaputtar.";
    }
    return "Fortsätt träna på din längdkontroll för att hålla nere antalet puttar.";
  };

  const filteredLocalRounds = selectedYear === 'all' ? rounds : rounds.filter(r => {
    if (!r.date?.seconds) return false;
    return new Date(r.date.seconds * 1000).getFullYear().toString() === selectedYear;
  });

  const trendData = [...filteredLocalRounds].sort((a, b) => a.date?.seconds - b.date?.seconds).map((r, i) => ({
    name: `R ${i + 1}`,
    putts: r.putts?.reduce((a, b) => a + b, 0) || 0
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-black text-golf-beige uppercase tracking-tighter leading-none">Puttning</h1>
          <p className="text-[10px] text-golf-beige/40 font-medium">Baserat på {filteredRoundsCount} registrerade ronder</p>
        </div>
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} rounds={rounds} />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map(m => (
          <Card key={m.name} className="p-2 space-y-1 border-golf-beige/10">
            <div className="space-y-0.5">
              <h3 className="text-[8px] uppercase font-bold text-golf-beige/60 tracking-widest">{m.name}</h3>
            </div>
            <div className="flex items-baseline gap-1">
              <div className="text-xl font-black text-golf-beige leading-none">
                {m.name.includes('Average') || m.name.includes('Round') || m.name.includes('Snitt') ? m.value.toFixed(1) : Math.round(m.value)}{m.unit}
              </div>
              <div className="text-[8px] font-bold text-golf-beige/40">
                Tgt: {m.isLowerBetter ? '< ' : ''}{m.target.toFixed(m.name.includes('Average') || m.name.includes('Snitt') ? 1 : 0)}{m.unit}
              </div>
            </div>
            <div className="h-1 bg-black/20 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, m.isLowerBetter ? (m.target / Math.max(0.1, m.value)) * 100 : (m.value / Math.max(0.1, m.target)) * 100)}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  (m.isLowerBetter ? m.value <= m.target : m.value >= m.target) ? "bg-golf-beige" : "bg-golf-beige/40"
                )}
              />
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-2.5 space-y-1">
        <h3 className="text-[8px] font-bold uppercase tracking-widest text-golf-beige/60">Strategisk Insikt</h3>
        <p className="text-[10px] text-golf-beige/80 leading-tight italic">
          "{getInsight()}"
        </p>
      </Card>

      <Card className="p-3 border-golf-beige/10 mt-3">
        <h3 className="text-[10px] font-bold mb-1.5 text-golf-beige uppercase tracking-widest">Puttar per Runda Trend</h3>
        <TrendChart 
          data={trendData} 
          dataKey="putts" 
          target={targets.puttsPerRound} 
          targetLabel="Mål"
          valueFormatter={(val) => `${Math.round(val)}`}
        />
      </Card>
    </div>
  );
};
