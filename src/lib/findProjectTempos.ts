import { analyzeSceneAtTempo } from './analyzeScene';

import {
  getTempoQuality,
} from './tempoGrid';

import type {
  ProjectTempoResult,
  ProjectTempoSearchOptions,
  SceneTempoInput,
} from '../types';

export function findProjectTempos(
  scenes: SceneTempoInput[],
  options: ProjectTempoSearchOptions,
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
    ProjectTempoResult[] = [];

  const totalSteps =
    Math.floor(
      (options.maxBpm -
        options.minBpm) /
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

    const sceneFits =
      scenes
        .map(scene =>
          analyzeSceneAtTempo(
            scene,
            bpm,
            options.fps,
          ),
        )
        .filter(
          (
            result,
          ): result is NonNullable<
            typeof result
          > =>
            result !== null,
        );

    if (
      sceneFits.length !==
      scenes.length
    ) {
      continue;
    }

    const totalSceneWeight =
      scenes.reduce(
        (sum, scene) =>
          sum +
          scene.weight,
        0,
      );

    if (
      totalSceneWeight <= 0
    ) {
      continue;
    }

    const weightedSquaredError =
      sceneFits.reduce(
        (sum, fit) => {
          const scene =
            scenes.find(
              item =>
                item.id ===
                fit.sceneId,
            );

          const weight =
            scene?.weight ??
            1;

          return (
            sum +
            weight *
              fit.rmse ** 2
          );
        },
        0,
      );

    const projectRmse =
      Math.sqrt(
        weightedSquaredError /
          totalSceneWeight,
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

      rmse:
        projectRmse,

      maxError,

      quality:
        getTempoQuality(
          projectRmse,
        ),

      scenes:
        sceneFits,
    });
  }

  return results
    .sort(
      (a, b) =>
        a.rmse - b.rmse,
    )
    .slice(0, limit);
}