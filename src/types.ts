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
   * Preferred/original tempo
   * for this individual scene.
   */
  preferredBpm: number;

  weight: SceneWeight;

  beatsPerBar: number;
  subdivision: Subdivision;

  hitPoints: HitPoint[];
};

/*
 * Raw timing analysis for a scene.
 *
 * This is what analyzeSceneAtTempo()
 * returns.
 */
export type SceneTimingFit = {
  sceneId: string;

  /**
   * Candidate project tempo currently
   * being tested.
   */
  bpm: number;

  recommendedCueStart: number;

  /**
   * Difference from exact Scene In.
   *
   * Negative = before Scene In.
   * Positive = after Scene In.
   */
  offsetFromSceneStart: number;

  rmse: number;
  maxError: number;

  quality: TempoQuality;

  sceneIn: HitAlignment;
  sceneOut: HitAlignment;

  hitAlignments: HitAlignment[];
};

export type TempoRelationship =
  | 'quarter-time'
  | 'half-time'
  | 'same'
  | 'double-time'
  | 'quadruple-time'
  | 'related';

/*
 * Enriched project-level scene result.
 *
 * findProjectTempos() creates this by
 * combining SceneTimingFit with the
 * preferred tempo information.
 */
export type SceneTempoFit =
  SceneTimingFit & {
    preferredBpm: number;

    /**
     * Closest rhythmic equivalent of
     * preferredBpm to the candidate
     * project BPM.
     */
    matchedTempo: number;

    tempoRelationship:
      TempoRelationship;

    /**
     * Percentage difference between
     * project BPM and matchedTempo.
     *
     * 0 = exact tempo relationship.
     */
    tempoDeviationPercent: number;
  };

export type ProjectTempoSearchOptions = {
  minBpm: number;
  maxBpm: number;
  step: number;

  fps: number;

  /**
   * 0 = ignore scene tempo preferences.
   * 1 = balanced.
   * >1 = stronger scene-tempo influence.
   */
  tempoInfluence: number;
};

export type ProjectTempoResult = {
  bpm: number;

  /**
   * Combined normalized project score.
   * Lower is better.
   */
  score: number;

  /**
   * Timing-only weighted RMSE.
   */
  timingRmse: number;

  maxError: number;

  /**
   * Weighted project-wide scene tempo
   * deviation.
   */
  tempoDeviationPercent: number;

  quality: TempoQuality;

  scenes: SceneTempoFit[];
};