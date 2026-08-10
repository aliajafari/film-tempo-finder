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
 * Find Tempo
 */

export type TempoSearchOptions =
  MusicalGridOptions & {
    minBpm: number;

    maxBpm: number;

    step: number;
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

  /**
   * Tempo originally preferred
   * for this scene.
   */
  preferredBpm: number;

  weight: SceneWeight;

  beatsPerBar: number;

  subdivision: Subdivision;

  hitPoints: HitPoint[];
};

export type TempoRelationship =
  | 'quarter-time'
  | 'half-time'
  | 'same'
  | 'double-time'
  | 'quadruple-time'
  | 'related';

export type SceneTempoFit = {
  sceneId: string;

  /**
   * Candidate project BPM.
   */
  bpm: number;

  /**
   * Original / preferred BPM
   * entered for this scene.
   */
  preferredBpm: number;

  /**
   * Closest rhythmically equivalent
   * version of preferredBpm.
   */
  matchedTempo: number;

  tempoRelationship:
    TempoRelationship;

  /**
   * Percentage distance between the
   * candidate project BPM and the
   * nearest equivalent scene tempo.
   *
   * 0 = exact rhythmic relationship.
   */
  tempoDeviationPercent: number;

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

  /**
   * Controls how strongly scene tempo
   * preferences influence the final
   * ranking.
   *
   * 0 = timing only.
   * 1 = balanced.
   * > 1 = stronger tempo preference.
   */
  tempoInfluence: number;
};

export type ProjectTempoResult = {
  bpm: number;

  /**
   * Final normalized score.
   * Lower is better.
   */
  score: number;

  /**
   * Timing-only weighted RMSE.
   */
  timingRmse: number;

  maxError: number;

  /**
   * Weighted average tempo deviation
   * across all scenes.
   */
  tempoDeviationPercent: number;

  quality: TempoQuality;

  scenes: SceneTempoFit[];
};