import {
  analyzeSceneAtTempo,
} from './analyzeScene';

import {
  getTempoQuality,
} from './tempoGrid';

import type {
  ProjectTempoResult,
  ProjectTempoSearchOptions,
  SceneTempoFit,
  SceneTempoInput,
  TempoRelationship,
} from '../types';

type TempoMatch = {
  matchedTempo: number;

  relationship:
    TempoRelationship;

  deviationPercent: number;
};

const TEMPO_RELATIONSHIPS: Array<{
  factor: number;

  relationship:
    TempoRelationship;
}> = [
  {
    factor: 0.25,
    relationship:
      'quarter-time',
  },

  {
    factor: 0.5,
    relationship:
      'half-time',
  },

  {
    factor: 1,
    relationship:
      'same',
  },

  {
    factor: 2,
    relationship:
      'double-time',
  },

  {
    factor: 4,
    relationship:
      'quadruple-time',
  },
];

function getTempoMatch(
  candidateBpm: number,
  preferredBpm: number,
): TempoMatch {
  let best:
    TempoMatch | null =
    null;

  for (
    const item of
      TEMPO_RELATIONSHIPS
  ) {
    const matchedTempo =
      preferredBpm *
      item.factor;

    const deviationPercent =
      Math.abs(
        candidateBpm -
          matchedTempo,
      ) /
      matchedTempo *
      100;

    if (
      !best ||
      deviationPercent <
        best.deviationPercent
    ) {
      best = {
        matchedTempo,

        relationship:
          item.relationship,

        deviationPercent,
      };
    }
  }

  if (!best) {
    return {
      matchedTempo:
        preferredBpm,

      relationship:
        'related',

      deviationPercent:
        100,
    };
  }

  return best;
}

function attachTempoFit(
  scene:
    SceneTempoInput,

  fit:
    ReturnType<
      typeof analyzeSceneAtTempo
    > extends infer T
      ? NonNullable<T>
      : never,

  candidateBpm: number,
): SceneTempoFit {
  const tempoMatch =
    getTempoMatch(
      candidateBpm,
      scene.preferredBpm,
    );

  return {
    ...fit,

    preferredBpm:
      scene.preferredBpm,

    matchedTempo:
      tempoMatch.matchedTempo,

    tempoRelationship:
      tempoMatch.relationship,

    tempoDeviationPercent:
      tempoMatch.deviationPercent,
  };
}

export function findProjectTempos(
  scenes:
    SceneTempoInput[],

  options:
    ProjectTempoSearchOptions,

  limit = 3,
): ProjectTempoResult[] {
  if (
    scenes.length === 0 ||
    options.minBpm <= 0 ||
    options.maxBpm <=
      options.minBpm ||
    options.step <= 0 ||
    options.fps <= 0
  ) {
    return [];
  }

  const results:
    ProjectTempoResult[] =
    [];

  const totalSteps =
    Math.floor(
      (
        options.maxBpm -
        options.minBpm
      ) /
        options.step,
    );

  const totalSceneWeight =
    scenes.reduce(
      (
        total,
        scene,
      ) =>
        total +
        scene.weight,

      0,
    );

  if (
    totalSceneWeight <= 0
  ) {
    return [];
  }

  for (
    let index = 0;
    index <= totalSteps;
    index++
  ) {
    const bpm =
      Number(
        (
          options.minBpm +
          index *
            options.step
        ).toFixed(6),
      );

    const sceneFits:
      SceneTempoFit[] =
      [];

    for (
      const scene of scenes
    ) {
      const analysis =
        analyzeSceneAtTempo(
          scene,
          bpm,
          options.fps,
        );

      if (!analysis) {
        continue;
      }

      sceneFits.push(
        attachTempoFit(
          scene,
          analysis,
          bpm,
        ),
      );
    }

    if (
      sceneFits.length !==
      scenes.length
    ) {
      continue;
    }

    /*
     * Timing score.
     *
     * We normalize timing error relative
     * to one beat at the candidate BPM.
     *
     * This makes the value dimensionless
     * and allows us to combine it with
     * tempo deviation.
     */
    const beatDuration =
      60 / bpm;

    const weightedTimingSquared =
      sceneFits.reduce(
        (
          total,
          fit,
        ) => {
          const sourceScene =
            scenes.find(
              scene =>
                scene.id ===
                fit.sceneId,
            );

          const weight =
            sourceScene?.weight ??
            1;

          const normalizedTiming =
            fit.rmse /
            beatDuration;

          return (
            total +
            weight *
              normalizedTiming **
                2
          );
        },

        0,
      );

    const timingNormalizedRmse =
      Math.sqrt(
        weightedTimingSquared /
          totalSceneWeight,
      );

    /*
     * Raw timing RMSE is still kept
     * separately so it can be displayed
     * to the user in milliseconds.
     */
    const weightedTimingError =
      sceneFits.reduce(
        (
          total,
          fit,
        ) => {
          const sourceScene =
            scenes.find(
              scene =>
                scene.id ===
                fit.sceneId,
            );

          const weight =
            sourceScene?.weight ??
            1;

          return (
            total +
            weight *
              fit.rmse ** 2
          );
        },

        0,
      );

    const timingRmse =
      Math.sqrt(
        weightedTimingError /
          totalSceneWeight,
      );

    /*
     * Tempo deviation.
     *
     * Convert percent to decimal:
     *
     * 5% -> 0.05
     */
    const weightedTempoSquared =
      sceneFits.reduce(
        (
          total,
          fit,
        ) => {
          const sourceScene =
            scenes.find(
              scene =>
                scene.id ===
                fit.sceneId,
            );

          const weight =
            sourceScene?.weight ??
            1;

          const deviation =
            fit.tempoDeviationPercent /
            100;

          return (
            total +
            weight *
              deviation **
                2
          );
        },

        0,
      );

    const tempoNormalizedRmse =
      Math.sqrt(
        weightedTempoSquared /
          totalSceneWeight,
      );

    const weightedAverageTempoDeviation =
      sceneFits.reduce(
        (
          total,
          fit,
        ) => {
          const sourceScene =
            scenes.find(
              scene =>
                scene.id ===
                fit.sceneId,
            );

          const weight =
            sourceScene?.weight ??
            1;

          return (
            total +
            weight *
              fit.tempoDeviationPercent
          );
        },

        0,
      ) /
      totalSceneWeight;

    /*
     * Final project score.
     *
     * Lower is better.
     *
     * Timing and tempo preference are
     * both dimensionless here.
     */
    const score =
      Math.sqrt(
        timingNormalizedRmse **
          2 +
          (
            tempoNormalizedRmse *
            options.tempoInfluence
          ) **
            2,
      );

    const maxError =
      Math.max(
        ...sceneFits.map(
          fit =>
            fit.maxError,
        ),
      );

    results.push({
      bpm,

      score,

      timingRmse,

      maxError,

      tempoDeviationPercent:
        weightedAverageTempoDeviation,

      quality:
        getTempoQuality(
          timingRmse,
        ),

      scenes:
        sceneFits,
    });
  }

  return results
    .sort(
      (
        a,
        b,
      ) => {
        if (
          a.score !==
          b.score
        ) {
          return (
            a.score -
            b.score
          );
        }

        if (
          a.tempoDeviationPercent !==
          b.tempoDeviationPercent
        ) {
          return (
            a.tempoDeviationPercent -
            b.tempoDeviationPercent
          );
        }

        return (
          a.timingRmse -
          b.timingRmse
        );
      },
    )
    .slice(
      0,
      limit,
    );
}