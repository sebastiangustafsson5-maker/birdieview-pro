"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  PlusCircle, 
  Settings, 
  Home, 
  Wind, 
  Crosshair, 
  Flag, 
  CircleDot, 
  Menu, 
  X,
  Video
} from 'lucide-react';

import { auth, db, doc, getDoc, collection, query, where, orderBy, onSnapshot, updateDoc } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { cn } from '@/components/ui/Card';
import { UserProfile, GolfRound, Stats, Shot } from '@/types';

import { LoginPage } from '@/components/features/LoginPage';
import { Dashboard } from '@/components/features/Dashboard';
import { TeeShots } from '@/components/features/TeeShots';
import { ApproachShots } from '@/components/features/ApproachShots';
import { ShortGame } from '@/components/features/ShortGame';
import { Putting } from '@/components/features/Putting';
import { RoundEntry } from '@/components/features/RoundEntry';
import { Profile } from '@/components/features/Profile';
import { SwingAI } from '@/components/features/SwingAI';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [rounds, setRounds] = useState<GolfRound[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'entry' | 'profile' | 'tee' | 'approach' | 'short' | 'putt' | 'swing'>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState('all');

  const filteredRounds = useMemo(() => {
    if (selectedYear === 'all') return rounds;
    return rounds.filter(r => {
      if (!r.date?.seconds) return false;
      const year = new Date(r.date.seconds * 1000).getFullYear().toString();
      return year === selectedYear;
    });
  }, [rounds, selectedYear]);

  const stats = useMemo((): Stats => {
    if (filteredRounds.length === 0) return {
      avgStrokes: 0, 
      avgPutts: 0, 
      fairwayAccuracy: 0, 
      missLeftRate: 0, 
      missRightRate: 0, 
      missOtherRate: 0, 
      approachMissLeftRate: 0,
      approachMissRightRate: 0,
      approachMissShortRate: 0,
      approachMissLongRate: 0,
      approachDuffRate: 0,
      approachTopRate: 0,
      scrambling0_10: 0,
      scrambling10_20: 0,
      scrambling20_50: 0,
      scrambling50_100: 0,
      scramblingBunker: 0,
      proximity0_10: 0,
      proximity10_20: 0,
      proximity20_50: 0,
      proximity50_100: 0,
      proximityBunker: 0,
      totalScrambling: 0,
      totalScramblingTrend: 'stable',
      shortGameErrors: {},
      threePuttRate: 0, 
      onePuttRate: 0,
      puttsPerGIR: 0,
      makeRateInside3m: 0,
      avgStrokesGained: 0, 
      girRate: 0, 
      puttsPerGreen: 0, 
      avgPar: 72
    };

    const calculateScrambling = (roundList: GolfRound[]) => {
      let scrambles = 0;
      let attempts = 0;
      roundList.forEach(r => {
        if (r.approachResults) {
          r.approachResults.forEach((a, i) => {
            if (a !== 'gir' && r.shortGameTypes && r.shortGameTypes[i] !== 'none') {
              attempts++;
              const score = r.scores ? r.scores[i] : 0;
              const holePar = r.holePars ? r.holePars[i] : 4;
              if (score <= holePar) scrambles++;
            }
          });
        }
      });
      return attempts > 0 ? (scrambles / attempts) * 100 : 0;
    };

    const totalScrambling = calculateScrambling(filteredRounds);
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (filteredRounds.length >= 2) {
      const sortedRounds = [...filteredRounds].sort((a, b) => b.date.seconds - a.date.seconds);
      const recentRounds = sortedRounds.slice(0, Math.ceil(filteredRounds.length / 2));
      const olderRounds = sortedRounds.slice(Math.ceil(filteredRounds.length / 2));
      const recentScrambling = calculateScrambling(recentRounds);
      const olderScrambling = calculateScrambling(olderRounds);
      if (recentScrambling > olderScrambling + 2) trend = 'up';
      else if (recentScrambling < olderScrambling - 2) trend = 'down';
    }

    let totalStrokes = 0;
    let totalPutts = 0;
    let totalAttempts = 0;
    let centerHits = 0, leftMisses = 0, rightMisses = 0, otherMisses = 0;
    let totalApproachAttempts = 0;
    let approachGIR = 0, approachLeft = 0, approachRight = 0, approachShort = 0, approachLong = 0, approachDuff = 0, approachTop = 0;
    let totalHoles = 0;

    const sgCounters: Record<string, any> = {
      '0-10m': { attempts: 0, scrambles: 0, totalProximity: 0, duffs: 0, tops: 0, lefts: 0, rights: 0 },
      '10-20m': { attempts: 0, scrambles: 0, totalProximity: 0, duffs: 0, tops: 0, lefts: 0, rights: 0 },
      '20-50m': { attempts: 0, scrambles: 0, totalProximity: 0, duffs: 0, tops: 0, lefts: 0, rights: 0 },
      '50-100m': { attempts: 0, scrambles: 0, totalProximity: 0, duffs: 0, tops: 0, lefts: 0, rights: 0 },
      'bunker': { attempts: 0, scrambles: 0, totalProximity: 0, duffs: 0, tops: 0, lefts: 0, rights: 0 },
    };

    let threePutts = 0, totalOnePutts = 0, totalPuttsOnGIR = 0, holesWithGIR = 0;
    let totalPuttsInside3m = 0, totalMadeInside3m = 0, totalStrokesGained = 0, totalPar = 0;

    filteredRounds.forEach(r => {
      const holesInRound = r.scores.length;
      totalHoles += holesInRound;
      totalStrokes += r.totalStrokes;
      totalPar += r.par;
      
      const roundPutts = r.putts.reduce((a, b) => a + b, 0);
      totalPutts += roundPutts;
      threePutts += r.putts.filter(p => p >= 3).length;
      totalOnePutts += r.putts.filter(p => p === 1).length;
      
      if (r.puttsInside3m) totalPuttsInside3m += r.puttsInside3m.reduce((a, b) => a + b, 0);
      if (r.madeInside3m) totalMadeInside3m += r.madeInside3m.reduce((a, b) => a + b, 0);

      r.fairwayHits.forEach(f => {
        totalAttempts++;
        if (f === 'center') centerHits++;
        else if (f === 'left') leftMisses++;
        else if (f === 'right') rightMisses++;
        else if (f === 'miss') otherMisses++;
      });

      if (r.shots) {
        try {
          const roundShots: Shot[][] = typeof r.shots === 'string' ? JSON.parse(r.shots) : r.shots;
          roundShots.forEach(holeShots => {
            holeShots.forEach(s => {
              const approachOutcomes = ['Green-träff (GIR)', 'Green', 'Miss Vänster', 'Miss Höger', 'Miss Kort', 'Miss Lång', 'Duff', 'Topp'];
              if (approachOutcomes.includes(s.result) && s.club !== 'Putter' && s.club !== 'Driver') {
                totalApproachAttempts++;
                if (s.result === 'Green-träff (GIR)') approachGIR++;
                else if (s.result === 'Miss Vänster') approachLeft++;
                else if (s.result === 'Miss Höger') approachRight++;
                else if (s.result === 'Miss Kort') approachShort++;
                else if (s.result === 'Miss Lång') approachLong++;
                else if (s.result === 'Duff') approachDuff++;
                else if (s.result === 'Topp') approachTop++;
              }
            });
          });
        } catch (e) {
          console.error("Error parsing shots", e);
        }
      }

      if (r.shots && r.shortGameTypes) {
        r.shortGameTypes.forEach((type, i) => {
          if (type !== 'none') {
            const proximity = r.shortGameProximities ? r.shortGameProximities[i] : 0;
            const result = r.shortGameResults ? r.shortGameResults[i] : 'good';
            const score = r.scores ? r.scores[i] : 0;
            const holePar = r.holePars ? r.holePars[i] : 4;
            const isScramble = score <= holePar;
            let mappedType: string = type;
            if (type === 'chip' as any) mappedType = '0-10m';
            if (type === 'pitch' as any) mappedType = '10-20m';
            if (sgCounters[mappedType]) {
              sgCounters[mappedType].attempts++;
              sgCounters[mappedType].totalProximity += proximity;
              if (isScramble) sgCounters[mappedType].scrambles++;
              if (result === 'duff') sgCounters[mappedType].duffs++;
              if (result === 'top') sgCounters[mappedType].tops++;
              if (result === 'left') sgCounters[mappedType].lefts++;
              if (result === 'right') sgCounters[mappedType].rights++;
            }
          }
        });
      }

      const roundHandicap = r.handicapAtTime ?? profile?.handicap ?? 0;
      const netPar = r.par + (roundHandicap * (holesInRound / 18));
      totalStrokesGained += (netPar - r.totalStrokes);
    });

    const shortGameErrors: any = {};
    Object.keys(sgCounters).forEach(key => {
      const c = sgCounters[key];
      if (c.attempts > 0) {
        shortGameErrors[key] = {
          duffRate: (c.duffs / c.attempts) * 100,
          topRate: (c.tops / c.attempts) * 100,
          leftRate: (c.lefts / c.attempts) * 100,
          rightRate: (c.rights / c.attempts) * 100,
        };
      }
    });

    return {
      avgStrokes: totalHoles > 0 ? (totalStrokes / totalHoles) * 18 : 0,
      avgPutts: totalHoles > 0 ? totalPutts / totalHoles : 0,
      fairwayAccuracy: totalAttempts > 0 ? (centerHits / totalAttempts) * 100 : 0,
      missLeftRate: totalAttempts > 0 ? (leftMisses / totalAttempts) * 100 : 0,
      missRightRate: totalAttempts > 0 ? (rightMisses / totalAttempts) * 100 : 0,
      missOtherRate: totalAttempts > 0 ? (otherMisses / totalAttempts) * 100 : 0,
      approachMissLeftRate: totalApproachAttempts > 0 ? (approachLeft / totalApproachAttempts) * 100 : 0,
      approachMissRightRate: totalApproachAttempts > 0 ? (approachRight / totalApproachAttempts) * 100 : 0,
      approachMissShortRate: totalApproachAttempts > 0 ? (approachShort / totalApproachAttempts) * 100 : 0,
      approachMissLongRate: totalApproachAttempts > 0 ? (approachLong / totalApproachAttempts) * 100 : 0,
      approachDuffRate: totalApproachAttempts > 0 ? (approachDuff / totalApproachAttempts) * 100 : 0,
      approachTopRate: totalApproachAttempts > 0 ? (approachTop / totalApproachAttempts) * 100 : 0,
      scrambling0_10: sgCounters['0-10m'].attempts > 0 ? (sgCounters['0-10m'].scrambles / sgCounters['0-10m'].attempts) * 100 : 0,
      scrambling10_20: sgCounters['10-20m'].attempts > 0 ? (sgCounters['10-20m'].scrambles / sgCounters['10-20m'].attempts) * 100 : 0,
      scrambling20_50: sgCounters['20-50m'].attempts > 0 ? (sgCounters['20-50m'].scrambles / sgCounters['20-50m'].attempts) * 100 : 0,
      scrambling50_100: sgCounters['50-100m'].attempts > 0 ? (sgCounters['50-100m'].scrambles / sgCounters['50-100m'].attempts) * 100 : 0,
      scramblingBunker: sgCounters['bunker'].attempts > 0 ? (sgCounters['bunker'].scrambles / sgCounters['bunker'].attempts) * 100 : 0,
      proximity0_10: sgCounters['0-10m'].attempts > 0 ? sgCounters['0-10m'].totalProximity / sgCounters['0-10m'].attempts : 0,
      proximity10_20: sgCounters['10-20m'].attempts > 0 ? sgCounters['10-20m'].totalProximity / sgCounters['10-20m'].attempts : 0,
      proximity20_50: sgCounters['20-50m'].attempts > 0 ? sgCounters['20-50m'].totalProximity / sgCounters['20-50m'].attempts : 0,
      proximity50_100: sgCounters['50-100m'].attempts > 0 ? sgCounters['50-100m'].totalProximity / sgCounters['50-100m'].attempts : 0,
      proximityBunker: sgCounters['bunker'].attempts > 0 ? sgCounters['bunker'].totalProximity / sgCounters['bunker'].attempts : 0,
      totalScrambling,
      totalScramblingTrend: trend,
      shortGameErrors,
      threePuttRate: totalHoles > 0 ? (threePutts / totalHoles) * 100 : 0,
      onePuttRate: totalHoles > 0 ? (totalOnePutts / totalHoles) * 100 : 0,
      puttsPerGIR: holesWithGIR > 0 ? totalPuttsOnGIR / holesWithGIR : 0,
      makeRateInside3m: totalPuttsInside3m > 0 ? (totalMadeInside3m / totalPuttsInside3m) * 100 : 0,
      avgStrokesGained: totalHoles > 0 ? totalStrokesGained / (totalHoles / 18) : 0,
      girRate: totalHoles > 0 ? (approachGIR / totalHoles) * 100 : 0,
      puttsPerGreen: totalHoles > 0 ? totalPutts / totalHoles : 0,
      avgPar: totalHoles > 0 ? (totalPar / totalHoles) * 18 : 72
    };
  }, [filteredRounds, profile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProfile(docSnap.data() as UserProfile);
      else setActiveTab('profile');
    };
    fetchProfile();

    const q = query(collection(db, 'rounds'), where('uid', '==', user.uid), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roundsData = snapshot.docs.map(doc => {
        const data = doc.data();
        let parsedShots: Shot[][] | undefined;
        if (data.shots) {
          try {
            parsedShots = typeof data.shots === 'string' ? JSON.parse(data.shots) : data.shots;
          } catch (e) { console.error('Failed to parse shots', e); }
        }
        return { id: doc.id, ...data, shots: parsedShots } as GolfRound;
      });
      setRounds(roundsData);
    });
    return unsubscribe;
  }, [user]);

  // Retroactive correction for latest 9-hole round
  useEffect(() => {
    if (rounds.length > 0 && user) {
      const latestRound = rounds[0];
      const nonZeroScores = latestRound.scores.filter(s => s > 0);
      if (nonZeroScores.length === 9 && !latestRound.isExtrapolated) {
        const applyCorrection = async () => {
          const nineHoleScores = latestRound.scores.slice(0, 9);
          const nineHolePars = latestRound.holePars.slice(0, 9);
          const scoreOverPar = nineHoleScores.reduce((a, b, i) => a + (b - nineHolePars[i]), 0);
          const extrapolatedTotal = latestRound.par + (scoreOverPar * 2);
          
          const newScores = [...nineHoleScores, ...nineHoleScores];
          const newPutts = [...latestRound.putts.slice(0, 9), ...latestRound.putts.slice(0, 9)];
          const newFairwayHits = [...latestRound.fairwayHits.slice(0, 9), ...latestRound.fairwayHits.slice(0, 9)];
          const newApproachResults = [...latestRound.approachResults.slice(0, 9), ...latestRound.approachResults.slice(0, 9)];
          const newHolePars = [...nineHolePars, ...nineHolePars];
          
          let newShots: string | undefined;
          if (latestRound.shots && Array.isArray(latestRound.shots)) {
            const nineHoleShots = latestRound.shots.slice(0, 9);
            newShots = JSON.stringify([...nineHoleShots, ...nineHoleShots]);
          }
          
          try {
            const updateData: any = {
              totalStrokes: extrapolatedTotal,
              scores: newScores,
              putts: newPutts,
              fairwayHits: newFairwayHits,
              approachResults: newApproachResults,
              holePars: newHolePars,
              isExtrapolated: true
            };
            if (newShots) updateData.shots = newShots;
            
            await updateDoc(doc(db, 'rounds', latestRound.id!), updateData);
          } catch (e) {
            console.error('Failed to correct round', e);
          }
        };
        applyCorrection();
      }
    }
  }, [rounds, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-golf-dark">
        <div className="w-12 h-12 border-4 border-golf-beige/30 border-t-golf-beige rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const menuItems = [
    { id: 'dashboard', label: 'Main Stats' },
    { id: 'tee', label: 'Utslag' },
    { id: 'approach', label: 'Inspel' },
    { id: 'short', label: 'Närspel' },
    { id: 'putt', label: 'Puttning' },
    { id: 'swing', label: 'Swing AI' },
  ] as const;

  return (
    <div className="min-h-screen bg-golf-dark pb-28 md:pb-0 md:pl-20">
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-golf-medium border-r border-white/5 flex-col items-center py-8 gap-8 z-50">
        <div className="w-12 h-12 bg-golf-beige/10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 mb-4">
          <Trophy className="w-6 h-6 text-golf-beige" />
        </div>
        <button onClick={() => setActiveTab('dashboard')} className={cn("p-3 rounded-xl transition-all", activeTab === 'dashboard' ? "bg-golf-beige/10 text-golf-beige" : "text-golf-beige/40 hover:text-golf-beige/80")} title="Dashboard">
          <Home className="w-6 h-6" />
        </button>
        <div className="h-px w-8 bg-white/5" />
        {menuItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn("p-3 rounded-xl transition-all", activeTab === item.id ? "bg-golf-beige/10 text-golf-beige" : "text-golf-beige/40 hover:text-golf-beige/80")}
            title={item.label}
          >
            {item.id === 'tee' && <Wind className="w-6 h-6" />}
            {item.id === 'approach' && <Crosshair className="w-6 h-6" />}
            {item.id === 'short' && <Flag className="w-6 h-6" />}
            {item.id === 'putt' && <CircleDot className="w-6 h-6" />}
            {item.id === 'swing' && <Video className="w-6 h-6" />}
          </button>
        ))}
        <div className="h-px w-8 bg-white/5" />
        <button onClick={() => setActiveTab('entry')} className={cn("p-3 rounded-xl transition-all", activeTab === 'entry' ? "bg-golf-beige/10 text-golf-beige" : "text-golf-beige/40 hover:text-golf-beige/80")} title="Logga Runda">
          <PlusCircle className="w-6 h-6" />
        </button>
        <div className="mt-auto">
          <button onClick={() => setActiveTab('profile')} className={cn("p-3 rounded-xl transition-all", activeTab === 'profile' ? "bg-golf-beige/10 text-golf-beige" : "text-golf-beige/40 hover:text-golf-beige/80")} title="Inställningar">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </nav>

      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95, originX: 0, originY: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute bottom-16 left-0 w-48 bg-golf-medium border border-white/5 rounded-xl shadow-2xl overflow-hidden py-1"
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); }}
                  className={cn("w-full text-left px-4 py-2 text-[11px] font-bold transition-all uppercase tracking-wider", activeTab === item.id ? "text-golf-beige bg-white/10" : "text-golf-beige/60 hover:text-golf-beige hover:bg-white/5")}
                >
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <nav className="h-12 bg-golf-medium border border-white/5 rounded-xl flex items-center justify-between px-4 shadow-2xl relative overflow-visible">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="w-8 h-8 flex items-center justify-center active:scale-95 transition-all text-golf-beige">
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <button onClick={() => { setActiveTab('entry'); setIsMenuOpen(false); }} className="w-16 h-16 bg-golf-beige rounded-full flex items-center justify-center shadow-2xl shadow-black/60 border-[4px] border-golf-medium active:scale-95 transition-all z-10 -mt-8">
            <PlusCircle className="w-8 h-8 text-golf-medium" />
          </button>

          <button onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }} className="w-8 h-8 flex items-center justify-center active:scale-95 transition-all text-golf-beige">
            <Settings className="w-5 h-5" />
          </button>
        </nav>
      </div>

      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Dashboard rounds={rounds} profile={profile} stats={stats} selectedYear={selectedYear} onYearChange={setSelectedYear} filteredRoundsCount={filteredRounds.length} /></motion.div>}
          {activeTab === 'tee' && <motion.div key="tee" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><TeeShots stats={stats} profile={profile} selectedYear={selectedYear} onYearChange={setSelectedYear} rounds={rounds} filteredRoundsCount={filteredRounds.length} /></motion.div>}
          {activeTab === 'approach' && <motion.div key="approach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><ApproachShots stats={stats} profile={profile} selectedYear={selectedYear} onYearChange={setSelectedYear} rounds={rounds} filteredRoundsCount={filteredRounds.length} /></motion.div>}
          {activeTab === 'short' && <motion.div key="short" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><ShortGame stats={stats} profile={profile} selectedYear={selectedYear} onYearChange={setSelectedYear} rounds={rounds} filteredRoundsCount={filteredRounds.length} /></motion.div>}
          {activeTab === 'putt' && <motion.div key="putt" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Putting stats={stats} profile={profile} selectedYear={selectedYear} onYearChange={setSelectedYear} rounds={rounds} filteredRoundsCount={filteredRounds.length} /></motion.div>}
          {activeTab === 'swing' && <motion.div key="swing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><SwingAI stats={stats} /></motion.div>}
          {activeTab === 'entry' && <motion.div key="entry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><RoundEntry profile={profile} onComplete={() => setActiveTab('dashboard')} /></motion.div>}
          {activeTab === 'profile' && <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><Profile profile={profile} onUpdate={setProfile} /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
  );
}
