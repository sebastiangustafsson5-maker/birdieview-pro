"use client";

import React, { useState } from 'react';
import { Trophy, Target, AlertCircle, TrendingUp, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/components/ui/Card';
import { YearFilter } from '@/components/ui/Filters';
import { TrendChart } from '@/components/ui/TrendChart';
import { GolfRound, UserProfile, Stats } from '@/types';

export const Dashboard = ({ rounds, profile, stats, selectedYear, onYearChange, filteredRoundsCount, onDeleteRound }: { rounds: GolfRound[]; profile: UserProfile | null; stats: Stats; selectedYear: string; onYearChange: (year: string) => void; filteredRoundsCount: number; onDeleteRound?: (roundId: string) => void }) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const hcp = profile?.handicap || 20;
  
  // Dynamic targets based on exact HCP
  const targets = {
    scoring: Math.max(72, 72 + hcp),
    fir: Math.max(20, 60 - (hcp * 0.5)),
    gir: Math.max(5, 60 - (hcp * 2)),
    putts: Math.max(1.6, 1.7 + (hcp * 0.01)),
    avoidance: Math.max(2, 5 + (hcp * 0.5))
  };

  const shameMeterValue = Math.min(100, Math.max(0, (stats.avgStrokes - targets.scoring) * 5 + 50));
  const shameLevel = shameMeterValue > 80 ? "KATASTROF" : shameMeterValue > 60 ? "DÅLIGT" : shameMeterValue > 40 ? "OK" : "PROFFS";

  const filteredLocalRounds = selectedYear === 'all' ? rounds : rounds.filter(r => {
    if (!r.date?.seconds) return false;
    return new Date(r.date.seconds * 1000).getFullYear().toString() === selectedYear;
  });

  const trendData = [...filteredLocalRounds].sort((a, b) => a.date?.seconds - b.date?.seconds).map((r, i) => ({
    name: `R ${i + 1}`,
    score: r.totalStrokes
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-black text-golf-beige uppercase tracking-tighter leading-none">Main Stats</h1>
          <p className="text-[10px] text-golf-beige/40 font-medium">Baserat på {filteredRoundsCount} registrerade ronder</p>
        </div>
        <YearFilter selectedYear={selectedYear} onYearChange={onYearChange} rounds={rounds} />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex flex-col justify-center p-2.5 h-24">
          <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest mb-0.5">Scoring Avg</div>
          <div className="text-3xl font-black text-golf-beige leading-none">
            {stats.avgStrokes.toFixed(1)}
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[8px] text-golf-beige/80">Avg / round</p>
            <p className="text-[8px] font-bold text-golf-beige/60">Target: {targets.scoring.toFixed(1)}</p>
          </div>
        </Card>
        <Card className="flex flex-col justify-center p-2.5 h-24">
          <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest mb-0.5 flex items-center gap-1">
            <TrendingUp className="w-2.5 h-2.5" /> Strokes Gained
          </div>
          <div className="text-3xl font-black text-golf-beige leading-none">
            {stats.avgStrokesGained > 0 ? '+' : ''}{stats.avgStrokesGained.toFixed(1)}
          </div>
          <p className="text-[8px] text-golf-beige/80 mt-1">Average vs Net Par</p>
        </Card>
      </div>

      {/* Row 2: FIR & GIR */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex items-center justify-between p-2.5 h-16">
          <div className="space-y-0">
            <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest flex items-center gap-1">
              <Target className="w-2.5 h-2.5" /> FIR
            </div>
            <div className="text-xl font-black text-golf-beige leading-tight">
              {Math.round(stats.fairwayAccuracy)}%
            </div>
            <p className="text-[8px] font-bold text-golf-beige/60">Target: {Math.round(targets.fir)}%</p>
          </div>
        </Card>
        <Card className="flex items-center justify-between p-2.5 h-16">
          <div className="space-y-0">
            <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5" /> GIR
            </div>
            <div className="text-xl font-black text-golf-beige leading-tight">
              {Math.round(stats.girRate)}%
            </div>
            <p className="text-[8px] font-bold text-golf-beige/60">Target: {Math.round(targets.gir)}%</p>
          </div>
        </Card>
      </div>

      {/* Row 3: Putts */}
      <div className="grid grid-cols-1 gap-2">
        <Card className="flex items-center justify-between p-2.5 h-16">
          <div className="space-y-0">
            <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" /> Putts / Green
            </div>
            <div className="text-xl font-black text-golf-beige leading-tight">
              {stats.puttsPerGreen.toFixed(2)}
            </div>
            <p className="text-[8px] font-bold text-golf-beige/60">Target: {targets.putts.toFixed(2)}</p>
          </div>
          <div className="text-right text-[8px] text-golf-beige/80">Avg putts / hole</div>
        </Card>
      </div>

      {/* Row 4: Shame Zone */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="flex flex-col items-center justify-center text-center space-y-1 p-2 h-32">
          <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest">Shame Meter</div>
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-black/10" />
              <circle 
                cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" 
                strokeDasharray={150.8}
                strokeDashoffset={150.8 - (150.8 * shameMeterValue / 100)}
                className="transition-all duration-1000 stroke-golf-beige"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-black text-golf-beige">{Math.round(shameMeterValue)}%</span>
            </div>
          </div>
          <div className="space-y-0">
            <div className="text-[9px] font-bold tracking-tighter text-golf-beige">{shameLevel}</div>
          </div>
        </Card>

        <Card className="flex flex-col justify-center p-2.5 h-32 space-y-1">
          <div className="space-y-0">
            <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest">3-putts avoid</div>
            <div className="text-2xl font-black text-golf-beige leading-none">
              {stats.threePuttRate.toFixed(1)}%
            </div>
            <p className="text-[8px] text-golf-beige/80 mt-0.5">Holes with 3+ putts</p>
          </div>
          <div className="pt-1 border-t border-white/10 flex justify-between items-center">
            <div className="text-right w-full">
              <div className="text-golf-beige/60 uppercase text-[8px] font-bold tracking-widest">Target</div>
              <div className="text-sm font-bold text-golf-beige">{"< "}{targets.avoidance}%</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-2.5">
        <h3 className="text-[10px] font-bold mb-1.5 text-golf-beige uppercase tracking-widest">Recent Rounds</h3>
        <div className="space-y-1">
          {rounds.length === 0 ? (
            <p className="text-golf-beige/40 italic py-2 text-center text-[9px]">No rounds logged yet.</p>
          ) : (
            rounds.slice(0, 5).map(round => {
              const getWeatherEmoji = (code: number) => {
                if (code === 0) return '☀️';
                if (code >= 1 && code <= 3) return '⛅️';
                if (code >= 45 && code <= 48) return '🌫';
                if (code >= 51 && code <= 65) return '🌧';
                if (code >= 71 && code <= 75) return '❄️';
                if (code >= 80 && code <= 82) return '🌦';
                if (code >= 95) return '⛈';
                return '🏌️';
              };

              const isConfirming = confirmDeleteId === round.id;

              return (
                <div key={round.id} className="relative">
                  <div className="flex items-center justify-between p-1.5 bg-black/10 rounded-lg hover:bg-black/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-bold text-golf-beige leading-tight flex items-center gap-1.5">
                        {round.courseName || 'Unnamed Course'}
                        {round.weather && (
                          <span className="text-[9px] bg-black/20 px-1 py-0.5 rounded-sm flex items-center gap-0.5" title={round.weather.condition}>
                            {getWeatherEmoji(round.weather.iconCode)} {round.weather.temp}°
                          </span>
                        )}
                      </div>
                      <div className="text-[8px] text-golf-beige/40">{round.date?.seconds ? new Date(round.date.seconds * 1000).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {round.weather && round.weather.windSpeed > 0 && (
                        <div className="text-center border-r border-white/10 pr-2">
                          <div className="text-[6px] uppercase text-golf-beige/60 font-bold">Vind</div>
                          <div className="text-[9px] font-medium text-golf-beige flex items-center justify-center gap-0.5">
                             💨 {round.weather.windSpeed}<span className="text-[6px]">km/h</span>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-[6px] uppercase text-golf-beige/60 font-bold">Score</div>
                        <div className="text-[10px] font-black text-golf-beige">{round.totalStrokes}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[6px] uppercase text-golf-beige/60 font-bold">Putts</div>
                        <div className="text-[10px] font-bold text-golf-beige">{round.putts.reduce((a, b: number) => a + b, 0)}</div>
                      </div>
                      {onDeleteRound && round.id && (
                        <button
                          onClick={() => setConfirmDeleteId(round.id!)}
                          className="ml-1 p-1 rounded-md text-golf-beige/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          title="Ta bort runda"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  {isConfirming && (
                    <div className="absolute inset-0 bg-red-900/90 backdrop-blur-sm rounded-lg flex items-center justify-between px-3 z-10">
                      <span className="text-[9px] font-bold text-white">Ta bort denna runda?</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 text-[8px] font-bold text-white/70 bg-white/10 rounded-md hover:bg-white/20 transition-all"
                        >
                          Avbryt
                        </button>
                        <button
                          onClick={() => {
                            onDeleteRound?.(round.id!);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 text-[8px] font-bold text-white bg-red-500 rounded-md hover:bg-red-600 transition-all"
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-3 border-golf-beige/10">
        <h3 className="text-[10px] font-bold mb-1.5 text-golf-beige uppercase tracking-widest">Scoring Trend</h3>
        <TrendChart 
          data={trendData} 
          dataKey="score" 
          target={targets.scoring} 
          targetLabel="Mål"
          valueFormatter={(val) => `${Math.round(val)}`}
        />
      </Card>
    </div>
  );
};
