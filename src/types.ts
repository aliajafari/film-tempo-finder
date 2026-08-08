export type AppMode =
  | 'find-tempo'
  | 'project-tempo';

export type HitSnap =
  | 'any'
  | 'beat'
  | 'downbeat';

export type HitWeight =
  | 1
  | 2
  | 4;

export type SceneWeight =
  | 1
  | 2
  | 4;

export type Subdivision =
  | 1
  | 2
  | 4;

export type TempoQuality =
  | 'excellent'
  | 'good'
  | 'loose'
  | 'poor';

export type HitPoint = {
  id: string;

  time: number;

  snap: HitSnap;

  weight: HitWeight;
};

export type MusicalGridOptions = {
  cueStartTime: number;

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

/*
 * Single Cue / Find Tempo
 */

export type TempoSearchOptions =
  MusicalGridOptions & {
    minBpm: number;

    maxBpm: number;

    step: number;
  };

export type FixedTempoOptions =
  MusicalGridOptions & {
    bpm: number;
  };

export type TempoResult = {
  bpm: number;

  rmse: number;

  maxError: number;

  quality: TempoQuality;

  alignments: HitAlignment[];
};

/*
 * Project Tempo
 */

export type SceneTempoInput = {
  id: string;

  startTime: number;

  endTime: number;

  weight: SceneWeight;

  beatsPerBar: number;

  subdivision: Subdivision;

  hitPoints: HitPoint[];
};

export type SceneTempoFit = {
  sceneId: string;

  bpm: number;

  recommendedCueStart: number;

  offsetFromSceneStart: number;

  rmse: number;

  maxError: number;

  quality: TempoQuality;

  sceneIn: HitAlignment;

  sceneOut: HitAlignment;

  hitAlignments: HitAlignment[];
};

export type ProjectTempoSearchOptions = {
  minBpm: number;

  maxBpm: number;

  step: number;

  fps: number;
};

export type ProjectTempoResult = {
  bpm: number;

  rmse: number;

  maxError: number;

  quality: TempoQuality;

  scenes: SceneTempoFit[];
};