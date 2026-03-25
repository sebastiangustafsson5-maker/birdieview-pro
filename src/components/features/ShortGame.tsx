"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, AlertCircle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { YearFilter } from '@/components/ui/Filters';
import { Stats, UserProfile, GolfRound, ShortGameType } from '@/types';
import { cn } from '@/components/ui/Card';

export const ShortGame = ({ stats, profile, selectedYear, onYearChange, rounds, filteredRoundsCount }: { stats: Stats; profile: UserProfile | null; selectedYear: string; onYearChange: (year: string) => void; rounds: GolfRound[]; filteredRoundsCount: number }) => {
  const hcp = profile?.handicap || 20;
  const categories: { name: string; key: keyof Stats; proxKey: keyof Stats; targetScramble: number; targetProx: number; type: ShortGameType }[] = [
    { name: '0–10m (Chip)', key: 'scrambling0_10', proxKey: 'proximity0_10', targetScramble: Math.max(20, 70 - hcp), targetProx: 1.5, type: '0-10m' },
    { name: '10–20m (Kort pitch)', key: 'scrambling10_20', proxKey: 'proximity10_20', targetScramble: Math.max(15, 55 - hcp), targetProx: 2.5, type: '10-20m' },
    { name: '20–50m (Lång pitch)', key: 'scrambling20_50', proxKey: 'proximity20_50', targetScramble: Math.max(10, 45 - hcp), targetProx: 4.0, type: '20-50m' },
    { name: '50–100m (Wedge)', key: 'scrambling50_100', proxKey: 'proximity50_100', targetScramble: Math.max(5, 35 - hcp), targetProx: 6.0, type: '50-100m' },
    { name: 'Bunkerslag', key: 'scramblingBunker', proxKey: 'proximityBunker', targetScramble: Math.max(10, 50 - hcp), targetProx: 3.0, type: 'bunker' },
  ];

  const getInsight = () => {
    if (stats.totalScrambling > 45) {
      return "Ditt närspel är din styrka. Du räddar slag effektivt över hela banan.";
    }

    const weakCategory = categories.find(cat => (stats as any)[cat.key] > 0 && (stats as any)[cat.key] < cat.targetScramble);
    if (weakCategory) {
      return `Din ${weakCategory.name} ligger under målet. Fokusera på landningspunkt och längdkontroll för att öka din Scrambling %.`;
    }

    const highError = Object.values(stats.shortGameErrors || {}).find(e => e && (e.duffRate > 15 || e.topRate > 15));
    if (highError) {
      return "Ojämn bollträff hindrar din precision. Fokusera på ren kontakt i nästa träningspass.";
    }

    return "Fokusera på att komma nära hålet för att underlätta dina puttar.";
  };

  const totalScrambleTarget = Math.max(15, 55 - hcp);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-black text-golf-beige uppercase tracking-tighter leading-none">Närspel</h1>
          <p className="text-[10px] text-golf-beige/40 font-medium">Baserat på {filteredRoundsCount} registrerade ronder</p>
        </div>
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} rounds={rounds} />
      </div>

      {/* Total Scrambling Card */}
      <Card className="p-2.5 border-golf-beige/20">
        <div className="flex flex-col gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="text-[8px] font-bold uppercase tracking-widest text-golf-beige/60">Total Scrambling %</h3>
              {stats.totalScramblingTrend !== 'stable' && (
                <div className={cn(
                  "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase",
                  stats.totalScramblingTrend === 'up' ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                )}>
                  {stats.totalScramblingTrend === 'up' ? <TrendingUp className="w-2 h-2" /> : <TrendingUp className="w-2 h-2 rotate-180" />}
                  {stats.totalScramblingTrend === 'up' ? 'Upp' : 'Ner'}
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-black text-golf-beige">{Math.round(stats.totalScrambling)}%</div>
              <div className="text-[8px] font-bold text-golf-beige/40">Target: {Math.round(totalScrambleTarget)}%</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, stats.totalScrambling)}%` }}
                className={cn(
                  "h-full transition-all duration-1000",
                  stats.totalScrambling >= totalScrambleTarget ? "bg-golf-beige" : "bg-golf-beige/40"
                )}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2">
        {categories.map(cat => {
          const errors = (stats.shortGameErrors || {})[cat.type];
          const hasData = (stats as any)[cat.key] > 0 || (stats as any)[cat.proxKey] > 0;

          return (
            <Card key={cat.name} className="p-2 space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-1">
                <h3 className="text-[10px] font-bold text-golf-beige truncate pr-1">{cat.name}</h3>
                {!hasData && <span className="text-[7px] text-golf-beige/40 uppercase font-bold">N/A</span>}
              </div>

              <div className="space-y-2">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[7px] uppercase font-bold text-golf-beige/60 tracking-widest">Scramble</div>
                    <div className="text-lg font-black text-golf-beige leading-none">{Math.round((stats as any)[cat.key] || 0)}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[7px] text-golf-beige/40 font-bold uppercase">Tgt</div>
                    <div className="text-[9px] font-bold text-golf-beige/60">{Math.round(cat.targetScramble)}%</div>
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[7px] uppercase font-bold text-golf-beige/60 tracking-widest">Prox</div>
                    <div className="text-lg font-black text-golf-beige leading-none">{((stats as any)[cat.proxKey] || 0).toFixed(1)}m</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[7px] text-golf-beige/40 font-bold uppercase">Tgt</div>
                    <div className="text-[9px] font-bold text-golf-beige/60">&lt; {cat.targetProx}m</div>
                  </div>
                </div>
              </div>

              {errors && (
                <div className="pt-1 border-t border-white/5 grid grid-cols-2 gap-1 text-center">
                  <div>
                    <div className="text-[7px] uppercase font-bold text-golf-beige/40">Duff</div>
                    <div className="text-[10px] font-bold text-golf-beige">{Math.round(errors.duffRate)}%</div>
                  </div>
                  <div>
                    <div className="text-[7px] uppercase font-bold text-golf-beige/40">Topp</div>
                    <div className="text-[10px] font-bold text-golf-beige">{Math.round(errors.topRate)}%</div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card className="p-2.5 space-y-1">
        <h3 className="text-[8px] font-bold uppercase tracking-widest text-golf-beige/60">Strategisk Insikt</h3>
        <p className="text-[10px] text-golf-beige/80 leading-tight italic">
          "{getInsight()}"
        </p>
      </Card>
    </div>
  );
};
