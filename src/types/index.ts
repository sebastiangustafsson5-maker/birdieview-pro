export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  handicap: number;
}

export type FairwayResult = 'center' | 'left' | 'right' | 'miss';
export type ApproachResult = 'gir' | 'left' | 'right' | 'short' | 'long' | 'duff' | 'top';

export type ShortGameType = 'none' | '0-10m' | '10-20m' | '20-50m' | '50-100m' | 'bunker';
export type ShortGameResult = 'good' | 'left' | 'right' | 'duff' | 'top';

export interface Shot {
  club: string;
  result: string;
  lat?: number;
  lng?: number;
}

export interface GolfRound {
  id?: string;
  uid: string;
  date: { seconds: number; nanoseconds: number } | any; // allow firebase timestamp or date
  courseName: string;
  totalStrokes: number;
  tee: string;
  hcpStrokes: number;
  scores: number[];
  holePars: number[];
  putts: number[];
  fairwayHits: FairwayResult[];
  approachResults: ApproachResult[];
  shortGameTypes: ShortGameType[];
  shortGameProximities: number[];
  shortGameResults: ShortGameResult[];
  puttsInside3m: number[];
  madeInside3m: number[];
  handicapAtTime: number;
  par: number;
  greensInRegulation: number;
  shots?: Shot[][] | string;
  isExtrapolated?: boolean;
}

export interface Stats {
  avgStrokes: number;
  avgPutts: number;
  fairwayAccuracy: number;
  missLeftRate: number;
  missRightRate: number;
  missOtherRate: number;
  approachMissLeftRate: number;
  approachMissRightRate: number;
  approachMissShortRate: number;
  approachMissLongRate: number;
  approachDuffRate: number;
  approachTopRate: number;
  scrambling0_10: number;
  scrambling10_20: number;
  scrambling20_50: number;
  scrambling50_100: number;
  scramblingBunker: number;
  proximity0_10: number;
  proximity10_20: number;
  proximity20_50: number;
  proximity50_100: number;
  proximityBunker: number;
  totalScrambling: number;
  totalScramblingTrend: 'up' | 'down' | 'stable';
  shortGameErrors: Record<string, { duffRate: number; topRate: number; leftRate: number; rightRate: number; }>;
  threePuttRate: number;
  onePuttRate: number;
  puttsPerGIR: number;
  makeRateInside3m: number;
  avgStrokesGained: number;
  girRate: number;
  puttsPerGreen: number;
  avgPar: number;
}
