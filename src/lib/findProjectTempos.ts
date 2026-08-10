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
  SceneTimingFit,
  TempoRelationship,
} from '../types';

type TempoMatch = {
  matchedTempo: number;

  relationship:
    TempoRelationship;

  deviationPercent: number;
};

type TempoRelationshipDefinition = {
  factor: number;

  relationship:
    TempoRelationship;
};

const TEMPO_RELATIONSHIPS:
  TempoRelationshipDefinition[] =
  [
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
  if (
    candidateBpm <= 0 ||
    preferredBpm <= 0
  ) {
    return {
      matchedTempo:
        preferredBpm,

      relationship:
        'related',

      deviationPercent:
        100,
    };
  }

  let best:
    TempoMatch | null =
    null;

  for (
    const definition of
      TEMPO_RELATIONSHIPS
  ) {
    const matchedTempo =
      preferredBpm *
      definition.factor;

    const deviationPercent =
      (
        Math.abs(
          candidateBpm -
            matchedTempo,
        ) /
        matchedTempo
      ) *
      100;

    if (
      !best ||
      deviationPercent <
        best.deviationPercent
    ) {
      best = {
        matchedTempo,

        relationship:
          definition.relationship,

        deviationPercent,
      };
    }
  }

  return (
    best ?? {
      matchedTempo:
        preferredBpm,

      relationship:
        'related',

      deviationPercent:
        100,
    }
  );
}

function enrichSceneFit(
  scene: SceneTempoInput,
  timingFit: SceneTimingFit,
  candidateBpm: number,
): SceneTempoFit {
  const tempoMatch =
    getTempoMatch(
      candidateBpm,
      scene.preferredBpm,
    );

  return {
    ...timingFit,

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
  scenes: SceneTempoInput[],
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
    options.fps <= 0 ||
    options.tempoInfluence <
      0
  ) {
    return [];
  }

  if (
    scenes.some(
      scene =>
        scene.preferredBpm <=
          0 ||
        scene.weight <= 0,
    )
  ) {
    return [];
  }

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
      const timingFit =
        analyzeSceneAtTempo(
          scene,
          bpm,
          options.fps,
        );

      if (!timingFit) {
        sceneFits.length =
          0;

        break;
      }

      sceneFits.push(
        enrichSceneFit(
          scene,
          timingFit,
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
     * ----------------------
     * TIMING SCORE
     * ----------------------
     *
     * Timing RMSE in seconds is
     * normalized against the duration
     * of one beat.
     *
     * This lets us combine it with
     * tempo percentage deviation.
     */

    const beatDuration =
      60 / bpm;

    let weightedTimingSquared =
      0;

    let weightedRawTimingSquared =
      0;

    let weightedTempoSquared =
      0;

    let weightedTempoDeviation =
      0;

    for (
      const fit of sceneFits
    ) {
      const scene =
        scenes.find(
          currentScene =>
            currentScene.id ===
            fit.sceneId,
        );

      if (!scene) {
        continue;
      }

      const weight =
        scene.weight;

      const normalizedTiming =
        fit.rmse /
        beatDuration;

      weightedTimingSquared +=
        weight *
        normalizedTiming **
          2;

      weightedRawTimingSquared +=
        weight *
        fit.rmse ** 2;

      const normalizedTempoDeviation =
        fit.tempoDeviationPercent /
        100;

      weightedTempoSquared +=
        weight *
        normalizedTempoDeviation **
          2;

      weightedTempoDeviation +=
        weight *
        fit.tempoDeviationPercent;
    }

    const timingNormalizedRmse =
      Math.sqrt(
        weightedTimingSquared /
          totalSceneWeight,
      );

    const timingRmse =
      Math.sqrt(
        weightedRawTimingSquared /
          totalSceneWeight,
      );

    const tempoNormalizedRmse =
      Math.sqrt(
        weightedTempoSquared /
          totalSceneWeight,
      );

    const tempoDeviationPercent =
      weightedTempoDeviation /
      totalSceneWeight;

    /*
     * ----------------------
     * PROJECT SCORE
     * ----------------------
     *
     * Timing and tempo deviation are
     * normalized dimensionless values.
     *
     * tempoInfluence = 0:
     * timing only.
     *
     * tempoInfluence = 1:
     * balanced.
     *
     * tempoInfluence > 1:
     * increasingly favors scene tempos.
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

      tempoDeviationPercent,

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
        first,
        second,
      ) => {
        if (
          first.score !==
          second.score
        ) {
          return (
            first.score -
            second.score
          );
        }

        if (
          first.tempoDeviationPercent !==
          second.tempoDeviationPercent
        ) {
          return (
            first.tempoDeviationPercent -
            second.tempoDeviationPercent
          );
        }

        if (
          first.timingRmse !==
          second.timingRmse
        ) {
          return (
            first.timingRmse -
            second.timingRmse
          );
        }

        return (
          first.bpm -
          second.bpm
        );
      },
    )
    .slice(
      0,
      limit,
    );
}