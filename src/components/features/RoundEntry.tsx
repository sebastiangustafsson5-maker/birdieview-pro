"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Save,
  Search
} from 'lucide-react';
import { auth, db, addDoc, collection } from '@/lib/firebase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserProfile, Shot, FairwayResult, ApproachResult, ShortGameType, ShortGameResult } from '@/types';
import { cn } from '@/components/ui/Card';
import { useGeolocation } from '@/hooks/useGeolocation';

const COURSES = [
  { name: 'Bokskogens Golfklubb, Gamla Banan', par: 72, region: 'Skåne, Sverige', parString: '4,3,4,4,5,3,4,4,5,3,4,5,4,4,3,4,4,4' },
  { name: 'Bokskogens Golfklubb, Kungsbanan', par: 71, region: 'Skåne, Sverige', parString: '4,5,4,3,4,4,3,4,3,5,4,3,4,4,3,5,4,5' },
  { name: 'Halmstad GK (Norra)', par: 72, region: 'Halland, Sverige', parString: '4,4,3,4,5,4,4,3,5,4,4,3,4,4,5,4,3,5' },
  { name: 'Halmstad GK (Södra)', par: 72, region: 'Halland, Sverige', parString: '4,4,5,3,4,4,3,4,5,4,4,5,3,4,4,3,4,5' },
  { name: 'Falsterbo Golfklubb', par: 71, region: 'Skåne, Sverige', parString: '4,3,4,4,4,3,5,4,4,4,3,4,5,4,4,3,4,5' },
];

const FAVORITE_COURSES = [
  { name: 'Bokskogens GK, Gamla Banan', par: 72, parString: '4,3,4,4,5,3,4,4,5,3,4,5,4,4,3,4,4,4' },
  { name: 'Bokskogens GK, Kungsbanan', par: 71, parString: '4,5,4,3,4,4,3,4,3,5,4,3,4,4,3,5,4,5' },
];

const TEES = ['Gul', 'Röd', 'Vit', 'Blå'];

const CLUBS = [
  { group: 'Träklubbor', items: ['Driver', '3-Wood', '5-Wood', '7-Wood'] },
  { group: 'Hybrider', items: ['Hybrid 3', 'Hybrid 4'] },
  { group: 'Järn', items: ['J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'J9'] },
  { group: 'Wedgar', items: ['PW', 'GW', 'SW', 'LW'] },
  { group: 'Putter', items: ['Putter'] },
];

export const RoundEntry = ({ onComplete, profile }: { onComplete: () => void; profile: UserProfile | null }) => {
  const [step, setStep] = useState(1);
  const [courseName, setCourseName] = useState('');
  const [totalStrokes, setTotalStrokes] = useState<string>('72');
  const [par, setPar] = useState(72);
  const [selectedTee, setSelectedTee] = useState('Gul');
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const location = useGeolocation(gpsEnabled);
  const [hcpStrokes, setHcpStrokes] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [parHighlight, setParHighlight] = useState(false);
  const [isCourseLocked, setIsCourseLocked] = useState(false);

  const [currentHole, setCurrentHole] = useState(1);
  const [currentShot, setCurrentShot] = useState(1);
  const [selectedClub, setSelectedClub] = useState('');
  const [selectedResult, setSelectedResult] = useState('');
  const [shots, setShots] = useState<Shot[][]>(new Array(18).fill([]).map(() => []));

  const teeSelectRef = React.useRef<HTMLSelectElement>(null);
  
  const [greensInRegulation, setGreensInRegulation] = useState(9);
  const [scores, setScores] = useState<number[]>(new Array(18).fill(4));
  const [holePars, setHolePars] = useState<number[]>(new Array(18).fill(4));
  const [putts, setPutts] = useState<number[]>(new Array(18).fill(2));
  const [fairwayHits, setFairwayHits] = useState<FairwayResult[]>(new Array(18).fill('center'));
  const [approachResults, setApproachResults] = useState<ApproachResult[]>(new Array(18).fill('gir'));
  const [shortGameTypes, setShortGameTypes] = useState<ShortGameType[]>(new Array(18).fill('none'));
  const [shortGameProximities, setShortGameProximities] = useState<number[]>(new Array(18).fill(0));
  const [shortGameResults, setShortGameResults] = useState<ShortGameResult[]>(new Array(18).fill('good'));
  const [puttsInside3m, setPuttsInside3m] = useState<number[]>(new Array(18).fill(0));
  const [madeInside3m, setMadeInside3m] = useState<number[]>(new Array(18).fill(0));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [holeCompleteFeedback, setHoleCompleteFeedback] = useState(false);
  const [isExtrapolated, setIsExtrapolated] = useState(false);

  const handleCourseSelect = (course: { name: string; par: number; parString?: string }) => {
    setCourseName(course.name);
    setPar(course.par);
    setTotalStrokes(course.par.toString());
    if (course.parString) {
      const pars = course.parString.split(',').map(Number);
      setHolePars(pars);
      setScores([...pars]);
    }
    setShowSuggestions(false);
    setIsCourseLocked(true);
    setParHighlight(true);
    setTimeout(() => setParHighlight(false), 1000);
  };

  const handleNextShot = () => {
    if (!selectedClub || !selectedResult) return;
    const newShots = [...shots];
    const holeShots = [...newShots[currentHole - 1]];
    
    const shotData: Shot = { 
      club: selectedClub, 
      result: selectedResult as any,
      ...(gpsEnabled && location.latitude && location.longitude 
        ? { lat: location.latitude, lng: location.longitude } 
        : {})
    };
    
    if (currentShot <= holeShots.length) {
      holeShots[currentShot - 1] = shotData;
    } else {
      holeShots.push(shotData);
    }
    
    newShots[currentHole - 1] = holeShots;
    setShots(newShots);

    if (selectedClub === 'Putter' && selectedResult === 'Sänkt') {
      setHoleCompleteFeedback(true);
      setTimeout(() => {
        setHoleCompleteFeedback(false);
        if (currentHole < 18) {
          const nextHole = currentHole + 1;
          setCurrentHole(nextHole);
          setCurrentShot(shots[nextHole - 1]?.length + 1 || 1);
          setSelectedClub('');
          setSelectedResult('');
        } else {
          calculateStatsFromShots();
          setStep(6);
        }
      }, 800);
    } else {
      setCurrentShot(currentShot + 1);
      setSelectedClub('');
      setSelectedResult('');
    }
  };

  const handlePrevShot = () => {
    if (currentShot > 1) {
      const prevShot = shots[currentHole - 1][currentShot - 2];
      setSelectedClub(prevShot?.club || '');
      setSelectedResult(prevShot?.result || '');
      setCurrentShot(currentShot - 1);
    }
  };

  const handleNextHole = () => {
    if (currentHole < 18) {
      setCurrentHole(currentHole + 1);
      setCurrentShot(shots[currentHole]?.length + 1 || 1);
      setSelectedClub('');
      setSelectedResult('');
    } else {
      calculateStatsFromShots();
      setStep(6);
    }
  };

  const calculateStatsFromShots = (extrapolate = false) => {
    let finalShots = [...shots];
    let finalHolePars = [...holePars];
    
    if (extrapolate) {
      setIsExtrapolated(true);
      const nineHoleShots = shots.slice(0, 9);
      const nineHolePars = holePars.slice(0, 9);
      finalShots = [...nineHoleShots, ...nineHoleShots];
      finalHolePars = [...nineHolePars, ...nineHolePars];
      setShots(finalShots);
      setHolePars(finalHolePars);
    }

    const newScores = finalShots.map(h => h.length);
    const newPutts = finalShots.map(h => h.filter(s => s.club === 'Putter').length);
    
    const newFairwayHits: FairwayResult[] = new Array(18).fill('miss');
    const newApproachResults: ApproachResult[] = new Array(18).fill('top');
    
    finalShots.forEach((holeShots, i) => {
      if (holeShots.length === 0) return;

      const fairwayClubs = ['Driver', '3-Wood', '5-Wood', '7-Wood', 'Hybrid 3', 'Hybrid 4', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'J9'];
      const fairwayShot = holeShots.find(s => fairwayClubs.includes(s.club));
      if (fairwayShot) {
        if (fairwayShot.result === 'Fairway') newFairwayHits[i] = 'center';
        else if (fairwayShot.result === 'Miss Vänster') newFairwayHits[i] = 'left';
        else if (fairwayShot.result === 'Miss Höger') newFairwayHits[i] = 'right';
        else newFairwayHits[i] = 'miss';
      }

      const girShot = holeShots.find(s => s.result === 'Green-träff' || s.result === 'Green-träff (GIR)');
      if (girShot) {
        newApproachResults[i] = 'gir';
      } else {
        const approachShot = [...holeShots].reverse().find(s => s.club !== 'Putter' && s.club !== 'Driver');
        if (approachShot) {
          if (approachShot.result === 'Miss Vänster') newApproachResults[i] = 'left';
          else if (approachShot.result === 'Miss Höger') newApproachResults[i] = 'right';
          else if (approachShot.result === 'Miss Kort') newApproachResults[i] = 'short';
          else if (approachShot.result === 'Miss Lång') newApproachResults[i] = 'long';
          else if (approachShot.result === 'Duff') newApproachResults[i] = 'duff';
          else if (approachShot.result === 'Topp') newApproachResults[i] = 'top';
        }
      }
    });

    const girCount = finalShots.reduce((acc, h) => {
      const hadExplicitGIR = h.some(s => s.result === 'Green-träff (GIR)');
      return hadExplicitGIR ? acc + 1 : acc;
    }, 0);

    setScores(newScores);
    setPutts(newPutts);
    setFairwayHits(newFairwayHits);
    setApproachResults(newApproachResults);
    setGreensInRegulation(girCount);

    if (extrapolate) {
      const nineHoleScores = newScores.slice(0, 9);
      const nineHolePars = finalHolePars.slice(0, 9);
      const scoreOverPar = nineHoleScores.reduce((a, b, i) => a + (b - nineHolePars[i]), 0);
      const extrapolatedTotal = par + (scoreOverPar * 2);
      setTotalStrokes(extrapolatedTotal.toString());
    } else {
      setTotalStrokes(newScores.reduce((a, b) => a + b, 0).toString());
    }
  };

  const getWeatherConditionString = (code: number) => {
    if (code === 0) return 'Klart';
    if (code >= 1 && code <= 3) return 'Molnigt';
    if (code >= 45 && code <= 48) return 'Dimma';
    if (code >= 51 && code <= 65) return 'Regn';
    if (code >= 71 && code <= 75) return 'Snö';
    if (code >= 80 && code <= 82) return 'Skurar';
    if (code >= 95) return 'Åska';
    return 'Okänt';
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    
    let weatherData = null;
    if (gpsEnabled && location.latitude && location.longitude) {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current_weather=true`);
        if (res.ok) {
          const data = await res.json();
          if (data.current_weather) {
            weatherData = {
              temp: Math.round(data.current_weather.temperature),
              windSpeed: Math.round(data.current_weather.windspeed),
              condition: getWeatherConditionString(data.current_weather.weathercode),
              iconCode: data.current_weather.weathercode
            };
          }
        }
      } catch (err) {
        console.warn("Could not fetch weather data", err);
      }
    }

    try {
      await addDoc(collection(db, 'rounds'), {
        uid: auth.currentUser.uid,
        date: new Date(),
        courseName,
        totalStrokes: parseInt(totalStrokes) || 0,
        tee: selectedTee,
        hcpStrokes: parseInt(hcpStrokes) || 0,
        scores,
        holePars,
        putts,
        fairwayHits,
        approachResults,
        shortGameTypes,
        shortGameProximities,
        shortGameResults,
        puttsInside3m,
        madeInside3m,
        handicapAtTime: profile?.handicap || 0,
        par,
        greensInRegulation,
        shots: JSON.stringify(shots),
        isExtrapolated,
        weather: weatherData
      });
      onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 pb-20">
      <header className="px-1">
        <h2 className="text-base font-bold tracking-tight text-golf-beige">Registrera Runda</h2>
        <p className="text-[8px] text-golf-beige/80 font-medium">Fyll i dina slag hål för hål.</p>
      </header>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <Card className="space-y-3 relative overflow-visible border-golf-beige/10 p-3">
              <div className="space-y-1.5">
                <label className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest">FAVORITBANOR</label>
                <div className="flex flex-wrap gap-1.5">
                  {FAVORITE_COURSES.map((fav, i) => (
                    <button
                      key={i}
                      onClick={() => handleCourseSelect(fav)}
                      className="px-2.5 py-1 bg-golf-beige text-golf-dark text-[9px] font-black rounded-md hover:bg-golf-beige/90 transition-all shadow-md active:scale-95"
                    >
                      {fav.name.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1 relative">
                <label className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest">BANA</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-golf-beige/40" />
                  <input 
                    type="text" 
                    value={courseName}
                    onChange={e => {
                      setCourseName(e.target.value);
                      setShowSuggestions(true);
                      setIsCourseLocked(false);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Sök bana..."
                    className="w-full bg-black/20 border border-white/5 rounded-md pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-golf-beige/30 outline-none transition-all text-golf-beige placeholder:text-golf-beige/20"
                  />
                </div>
                
                <AnimatePresence>
                  {showSuggestions && courseName.length >= 1 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute z-50 w-full mt-1 bg-golf-medium border border-golf-beige/20 rounded-md shadow-2xl overflow-hidden"
                    >
                      {COURSES.filter(c => c.name.toLowerCase().includes(courseName.toLowerCase())).map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleCourseSelect(c)}
                          className="w-full text-left px-3 py-1.5 hover:bg-golf-dark text-golf-beige transition-colors border-b border-white/5 last:border-0"
                        >
                          <div className="font-bold text-xs">{c.name}</div>
                          <div className="text-[8px] text-golf-beige/40 uppercase tracking-widest">{c.region} [Par {c.par}]</div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest">TEE</label>
                  <select 
                    ref={teeSelectRef}
                    value={selectedTee}
                    onChange={e => setSelectedTee(e.target.value)}
                    className="w-full bg-black/20 border border-white/5 rounded-md px-2 py-1.5 text-xs focus:ring-1 focus:ring-golf-beige/30 outline-none transition-all text-golf-beige appearance-none"
                  >
                    {TEES.map(t => <option key={t} value={t} className="bg-golf-dark">{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest">BANANS PAR</label>
                  <input 
                    type="number" 
                    value={par}
                    readOnly={isCourseLocked}
                    onChange={e => setPar(parseInt(e.target.value) || 0)}
                    onFocus={e => e.target.select()}
                    className={cn(
                      "w-full bg-black/20 border border-white/5 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-golf-beige/30 outline-none transition-all text-golf-beige text-xs font-bold",
                      isCourseLocked && "opacity-50 cursor-not-allowed",
                      parHighlight && "ring-1 ring-golf-beige/50 bg-golf-beige/10"
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-golf-beige/60 uppercase tracking-widest">HCP Strokes (Slope)</label>
                  <input 
                    type="number" 
                    value={hcpStrokes}
                    onChange={e => setHcpStrokes(e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="0"
                    className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 focus:ring-1 focus:ring-golf-beige/30 outline-none transition-all text-golf-beige text-base font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-golf-beige/60 uppercase tracking-widest">Total Gross Strokes</label>
                  <input 
                    type="number" 
                    value={totalStrokes}
                    onChange={e => setTotalStrokes(e.target.value)}
                    onFocus={e => e.target.select()}
                    placeholder="72"
                    className="w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 focus:ring-1 focus:ring-golf-beige/30 outline-none transition-all text-golf-beige text-base font-bold"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between p-2 mt-4 bg-black/20 border border-white/5 rounded-lg shadow-inner">
                <div className="space-y-0.5">
                  <label className="text-[10px] font-bold text-golf-beige uppercase tracking-widest">Strokes Gained Toggle (GPS)</label>
                  <p className="text-[7px] text-golf-beige/60">Aktiverar spårning av position mellan slag</p>
                </div>
                <button
                  onClick={() => setGpsEnabled(!gpsEnabled)}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors duration-200",
                    gpsEnabled ? "bg-golf-beige" : "bg-white/10"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200 shadow-md",
                    gpsEnabled ? "translate-x-5 bg-golf-dark" : "translate-x-0 bg-golf-beige/40"
                  )} />
                </button>
              </div>
            </Card>
            <div className="flex justify-end pt-1">
              <Button 
                onClick={() => setStep(2)} 
                className="w-24 h-10 bg-golf-beige text-golf-dark hover:bg-golf-beige/90 font-bold text-sm"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4 relative"
          >
            <AnimatePresence>
              {holeCompleteFeedback && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.2 }}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-golf-dark/80 backdrop-blur-sm rounded-xl"
                >
                  <div className="text-center space-y-1">
                    <div className="w-12 h-12 bg-golf-beige rounded-full flex items-center justify-center mx-auto shadow-xl">
                      <Trophy className="w-6 h-6 text-golf-dark" />
                    </div>
                    <h3 className="text-lg font-black text-golf-beige tracking-tighter uppercase">Hål klart!</h3>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center px-1 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-golf-beige animate-pulse" />
                <span className="text-[10px] font-black text-golf-beige uppercase tracking-tight">Runda pågår</span>
              </div>
              
              <div className="relative">
                <select
                  value={currentHole}
                  onChange={(e) => {
                    const h = parseInt(e.target.value);
                    setCurrentHole(h);
                    setCurrentShot(shots[h - 1]?.length + 1 || 1);
                    setSelectedClub('');
                    setSelectedResult('');
                  }}
                  className="bg-golf-medium text-golf-beige text-[11px] font-black uppercase tracking-tight py-1 px-2 rounded-lg border border-white/10 outline-none focus:ring-1 focus:ring-golf-beige/30 appearance-none pr-8"
                >
                  {holePars.map((p, i) => (
                    <option key={i} value={i + 1} className="bg-golf-dark">
                      Hål {i + 1} - Par {p}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-golf-beige/40 pointer-events-none" />
              </div>
            </div>

            <div className="flex justify-end gap-1.5">
                {currentHole === 9 && (
                  <Button 
                    onClick={() => {
                      calculateStatsFromShots(true);
                      setStep(6);
                    }}
                    className="bg-golf-beige text-golf-dark hover:bg-golf-beige/90 h-7 px-2.5 text-[9px] font-black uppercase tracking-tight"
                  >
                    Avsluta & Spara (9 hål)
                  </Button>
                )}
                <Button 
                  variant="secondary" 
                  onClick={handleNextHole}
                  className="bg-golf-beige/10 text-golf-beige border-none hover:bg-golf-beige/20 h-7 px-2.5 text-[9px] font-black uppercase tracking-tight"
                >
                  {currentHole === 18 ? 'Slutför' : 'Nästa hål'} <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>

            <Card className="space-y-3 border-golf-beige/10 p-3">
              <div className="text-center space-y-0">
                <div className="text-[7px] font-bold text-golf-beige/40 uppercase tracking-widest">Nuvarande slag</div>
                <div className="text-xl font-black text-golf-beige tracking-tighter">Slag {currentShot}</div>
              </div>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <label className="text-[7px] font-bold text-golf-beige/40 uppercase tracking-widest block text-center">Välj Klubb</label>
                  <select 
                    value={selectedClub}
                    onChange={e => {
                      setSelectedClub(e.target.value);
                      setSelectedResult('');
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-golf-beige/30 outline-none transition-all text-golf-beige text-xs font-bold appearance-none text-center"
                  >
                    <option value="">-- Välj klubba --</option>
                    {CLUBS.map(group => (
                      <optgroup key={group.group} label={group.group} className="bg-golf-dark">
                        {group.items.map(club => (
                          <option key={club} value={club}>{club}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {selectedClub && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5"
                  >
                    <label className="text-[7px] font-bold text-golf-beige/40 uppercase tracking-widest block text-center">Välj Utfall</label>
                    <div className="grid grid-cols-2 gap-1">
                      {(() => {
                        const par = holePars[currentHole - 1];
                        const shot = currentShot;
                        const isGIR = (par === 3 && shot === 1) || (par === 4 && (shot === 1 || shot === 2)) || (par === 5 && (shot === 2 || shot === 3));
                        const greenLabel = isGIR ? 'Green-träff (GIR)' : 'Green';

                        if (selectedClub === 'Putter') {
                          return ['Sänkt', 'Miss Kort', 'Miss Lång', 'Miss Höger', 'Miss Vänster'];
                        }
                        
                        if (selectedClub === 'Driver') {
                          return ['Fairway', 'Miss Vänster', 'Miss Höger', 'Miss Kort', 'Miss Lång', 'Övrigt'];
                        }

                        const fairwayClubs = ['3-Wood', '5-Wood', '7-Wood', 'Hybrid 3', 'Hybrid 4', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8', 'J9'];
                        if (fairwayClubs.includes(selectedClub)) {
                          return ['Fairway', greenLabel, 'Miss Vänster', 'Miss Höger', 'Miss Kort', 'Miss Lång', 'Duff', 'Topp'];
                        }

                        return [greenLabel, 'Miss Vänster', 'Miss Höger', 'Miss Kort', 'Miss Lång', 'Duff', 'Topp'];
                      })().map(res => (
                        <button
                          key={res}
                          onClick={() => setSelectedResult(res)}
                          className={cn(
                            "min-h-[32px] py-1 px-1.5 rounded-lg text-[9px] font-bold transition-all border",
                            selectedResult === res 
                              ? "bg-golf-beige text-golf-dark border-golf-beige shadow-md scale-[1.02]" 
                              : "bg-black/20 text-golf-beige/60 border-white/5 hover:bg-black/40"
                          )}
                        >
                          {res}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="flex gap-1.5 pt-0.5">
                <Button 
                  variant="secondary" 
                  onClick={handlePrevShot}
                  disabled={currentShot === 1}
                  className="flex-1 bg-black/20 text-golf-beige/40 border-none py-1.5 rounded-lg h-9 text-[10px]"
                >
                  Bakåt
                </Button>
                <Button 
                  onClick={handleNextShot}
                  disabled={!selectedClub || !selectedResult}
                  className="flex-1 bg-golf-beige text-golf-dark hover:bg-golf-beige/90 py-1.5 rounded-lg h-9 text-[10px] font-bold"
                >
                  Nästa slag <ChevronRight className="w-3 h-3 ml-0.5" />
                </Button>
              </div>
            </Card>

            <div className="bg-black/20 rounded-xl p-3 border border-white/5">
              <div className="text-[9px] font-bold text-golf-beige/40 uppercase tracking-widest mb-2">Klubbor använda på hålet</div>
              <div className="flex flex-wrap gap-1.5">
                {shots[currentHole - 1].length === 0 ? (
                  <div className="text-[10px] text-golf-beige/20 italic">Inga slag loggade än...</div>
                ) : (
                  shots[currentHole - 1].map((s, i) => (
                    <div key={i} className="px-2 py-1 bg-golf-beige/5 border border-golf-beige/10 rounded-md text-[9px] font-bold text-golf-beige/80">
                      S{i+1}: {s.club}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button variant="secondary" onClick={() => setStep(1)} className="text-golf-beige/40 border-none hover:bg-transparent h-8 text-[10px] uppercase tracking-widest font-bold">
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Tillbaka till ban-info
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <Card className="p-3">
              <h3 className="text-sm font-bold mb-2 text-golf-beige uppercase tracking-tight">Puttingdetaljer</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {putts.map((p, i) => (
                  <div key={i} className="p-1.5 bg-black/10 rounded-lg grid grid-cols-4 gap-1.5 items-center">
                    <div className="text-[10px] font-bold text-golf-beige">Hål {i + 1}</div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] uppercase text-golf-beige/40 font-bold block text-center">Puttar</label>
                      <input 
                        type="number" 
                        value={p}
                        onChange={e => {
                          const newPutts = [...putts];
                          newPutts[i] = parseInt(e.target.value) || 0;
                          setPutts(newPutts);
                        }}
                        className="w-full bg-black/20 border-white/5 rounded-md p-1 text-center text-[10px] focus:ring-1 focus:ring-golf-beige/30 outline-none text-golf-beige"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] uppercase text-golf-beige/40 font-bold block text-center">Inom 3m</label>
                      <input 
                        type="number" 
                        value={puttsInside3m[i]}
                        onChange={e => {
                          const newInside = [...puttsInside3m];
                          newInside[i] = parseInt(e.target.value) || 0;
                          setPuttsInside3m(newInside);
                        }}
                        className="w-full bg-black/20 border-white/5 rounded-md p-1 text-center text-[10px] focus:ring-1 focus:ring-golf-beige/30 outline-none text-golf-beige"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[7px] uppercase text-golf-beige/40 font-bold block text-center">Sänkta</label>
                      <input 
                        type="number" 
                        value={madeInside3m[i]}
                        onChange={e => {
                          const newMade = [...madeInside3m];
                          newMade[i] = parseInt(e.target.value) || 0;
                          setMadeInside3m(newMade);
                        }}
                        className="w-full bg-black/20 border-white/5 rounded-md p-1 text-center text-[10px] focus:ring-1 focus:ring-golf-beige/30 outline-none text-golf-beige"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(2)} className="h-9 text-[10px] flex-1"><ChevronLeft className="w-3.5 h-3.5 mr-1" /> Bakåt</Button>
              <Button onClick={() => setStep(4)} className="h-9 text-[10px] font-bold flex-1">Nästa <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
            </div>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <Card className="p-3">
              <h3 className="text-sm font-bold mb-2 text-golf-beige uppercase tracking-tight">Inspel</h3>
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {approachResults.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-1 bg-black/10 rounded-lg">
                    <span className="text-[10px] font-bold text-golf-beige/60 ml-1">Hål {i + 1}</span>
                    <div className="flex gap-0.5">
                      {(['gir', 'left', 'right', 'duff', 'top'] as ApproachResult[]).map(option => (
                        <button
                          key={option}
                          onClick={() => {
                            const newResults = [...approachResults];
                            newResults[i] = option;
                            setApproachResults(newResults);
                            const girCount = newResults.filter(r => r === 'gir').length;
                            setGreensInRegulation(girCount);
                            if (option === 'gir') {
                              const newTypes = [...shortGameTypes];
                              newTypes[i] = 'none';
                              setShortGameTypes(newTypes);
                            }
                          }}
                          className={cn(
                            "px-1.5 py-1 text-[7px] uppercase font-bold rounded-md transition-all",
                            a === option 
                              ? "bg-golf-beige text-golf-medium"
                              : "bg-black/20 text-golf-beige/40 hover:text-golf-beige/80"
                          )}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(3)} className="h-9 text-[10px] flex-1"><ChevronLeft className="w-3.5 h-3.5 mr-1" /> Bakåt</Button>
              <Button onClick={() => setStep(5)} className="h-9 text-[10px] font-bold flex-1">Nästa <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
            </div>
          </motion.div>
        )}

        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <Card className="p-3">
              <h3 className="text-sm font-bold mb-2 text-golf-beige uppercase tracking-tight">Närspel</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {approachResults.map((a, i) => {
                  if (a === 'gir') return null;
                  return (
                    <div key={i} className="p-2 bg-black/10 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-golf-beige">Hål {i + 1}</span>
                        <span className="text-[7px] uppercase font-bold text-golf-beige/40">Miss ({a})</span>
                      </div>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="text-[7px] uppercase text-golf-beige/40 font-bold">Avstånd</label>
                          <div className="flex flex-wrap gap-1">
                            {(['0-10m', '10-20m', '20-50m', '50-100m', 'bunker'] as ShortGameType[]).map(type => (
                              <button
                                key={type}
                                onClick={() => {
                                  const newTypes = [...shortGameTypes];
                                  newTypes[i] = type;
                                  setShortGameTypes(newTypes);
                                }}
                                className={cn(
                                  "px-1.5 py-0.5 text-[7px] uppercase font-bold rounded-md transition-all",
                                  shortGameTypes[i] === type 
                                    ? "bg-golf-beige text-golf-medium"
                                    : "bg-black/20 text-golf-beige/40 hover:text-golf-beige/80"
                                )}
                              >
                                {type}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label className="text-[7px] uppercase text-golf-beige/40 font-bold">Proximity (m)</label>
                            <input 
                              type="number" 
                              step="0.1"
                              value={shortGameProximities[i]}
                              onChange={e => {
                                const newProximities = [...shortGameProximities];
                                newProximities[i] = parseFloat(e.target.value) || 0;
                                setShortGameProximities(newProximities);
                              }}
                              className="w-full bg-black/20 border-white/5 rounded-md p-1 text-center text-[10px] focus:ring-1 focus:ring-golf-beige/30 outline-none text-golf-beige"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[7px] uppercase text-golf-beige/40 font-bold">Resultat</label>
                            <div className="flex flex-wrap gap-1">
                              {(['good', 'left', 'right', 'duff', 'top'] as ShortGameResult[]).map(res => (
                                <button
                                  key={res}
                                  onClick={() => {
                                    const newResults = [...shortGameResults];
                                    newResults[i] = res;
                                    setShortGameResults(newResults);
                                  }}
                                  className={cn(
                                    "px-1.5 py-0.5 text-[7px] uppercase font-bold rounded-md transition-all",
                                    shortGameResults[i] === res 
                                      ? "bg-golf-beige text-golf-medium"
                                      : "bg-black/20 text-golf-beige/40 hover:text-golf-beige/80"
                                  )}
                                >
                                  {res}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <div className="flex justify-between gap-2">
              <Button variant="secondary" onClick={() => setStep(4)} className="h-9 text-[10px] flex-1"><ChevronLeft className="w-3.5 h-3.5 mr-1" /> Bakåt</Button>
              <Button onClick={() => setStep(6)} className="h-9 text-[10px] font-bold flex-1">Nästa <ChevronRight className="w-3.5 h-3.5 ml-1" /></Button>
            </div>
          </motion.div>
        )}

        {step === 6 && (
          <motion.div 
            key="step6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <Card className="space-y-3 border-golf-beige/10 p-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-golf-beige uppercase tracking-tight">Sammanställning</h3>
                <div className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest truncate max-w-[120px]">{courseName}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                  <div className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest mb-0.5">Total Score</div>
                  <div className="text-xl font-black text-golf-beige tracking-tighter">{totalStrokes}</div>
                  <div className="text-[8px] font-bold text-golf-beige/60">Par {par} ({parseInt(totalStrokes) - par > 0 ? '+' : ''}{parseInt(totalStrokes) - par})</div>
                </div>
                <div className="p-2 bg-black/20 rounded-lg border border-white/5">
                  <div className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest mb-0.5">GIR</div>
                  <div className="text-xl font-black text-golf-beige tracking-tighter">{greensInRegulation}</div>
                  <div className="text-[8px] font-bold text-golf-beige/60">{Math.round((greensInRegulation / 18) * 100)}%</div>
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h4 className="text-[8px] font-bold text-golf-beige/40 uppercase tracking-widest">Hål för hål</h4>
                <div className="grid grid-cols-6 gap-1">
                  {scores.map((s, i) => (
                    <div key={i} className={cn(
                      "flex flex-col items-center justify-center py-1 rounded-md border border-white/5 transition-all",
                      s < holePars[i] ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : 
                      s > holePars[i] ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-black/20 text-golf-beige/60"
                    )}>
                      <span className="text-[6px] opacity-40 mb-0.5">{i + 1}</span>
                      <span className="text-[10px] font-black">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <div className="flex justify-between items-center pt-1">
              <Button 
                variant="secondary" 
                onClick={() => setStep(2)} 
                className="text-golf-beige/40 border-none hover:bg-transparent h-7 text-[8px] uppercase tracking-widest font-bold"
              >
                <ChevronLeft className="w-3 h-3 mr-1" /> Redigera slag
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting} 
                className="bg-golf-beige text-golf-dark font-black px-4 py-1.5 rounded-lg shadow-lg hover:scale-105 transition-transform text-xs"
              >
                {isSubmitting ? 'Sparar...' : 'Spara Runda'} <Save className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
