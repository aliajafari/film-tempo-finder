export type HitSnap = 'any' | 'beat' | 'downbeat';

export type HitWeight = 1 | 2 | 4;

export type HitPoint = {
  id: string;
  time: number;
  snap: HitSnap;
  weight: HitWeight;
};

export type Subdivision = 1 | 2 | 4;

export type TempoSearchOptions = {
  minBpm: number;
  maxBpm: number;
  step: number;
  beatsPerBar: number;
  startBar: number;
  startBeat: number;
  subdivision: Subdivision;
};

export type HitAlignment = {
  hitId: string;
  hitTime: number;
  snap: HitSnap;
  weight: HitWeight;

  beat: number;
  beatTime: number;
  error: number;

  bar: number;
  beatInBar: number;
  subdivisionIndex: number;
};

export type TempoQuality =
  | 'excellent'
  | 'good'
  | 'loose'
  | 'poor';

export type TempoResult = {
  bpm: number;

  rmse: number;
  maxError: number;
  quality: TempoQuality;

  alignments: HitAlignment[];
};