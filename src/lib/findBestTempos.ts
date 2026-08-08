import type {
  HitPoint,
  TempoResult,
  TempoSearchOptions,
} from '../types';

import {
  calculateAlignments,
  calculateMaxError,
  calculateWeightedRmse,
  getTempoQuality,
} from './tempoGrid';

export function findBestTempos(
  hitPoints: HitPoint[],
  options: TempoSearchOptions,
  limit = 3,
): TempoResult[] {
  if (
    hitPoints.length < 2 ||
    options.minBpm <= 0 ||
    options.maxBpm <=
      options.minBpm ||
    options.step <= 0
  ) {
    return [];
  }

  const results: TempoResult[] =
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

    const alignments =
      calculateAlignments(
        hitPoints,
        bpm,
        options,
      );

    const rmse =
      calculateWeightedRmse(
        alignments,
      );

    const maxError =
      calculateMaxError(
        alignments,
      );

    results.push({
      bpm,

      rmse,

      maxError,

      quality:
        getTempoQuality(
          rmse,
        ),

      alignments,
    });
  }

  return results
    .sort(
      (a, b) => {
        if (
          a.rmse !==
          b.rmse
        ) {
          return (
            a.rmse -
            b.rmse
          );
        }

        return (
          a.maxError -
          b.maxError
        );
      },
    )
    .slice(
      0,
      limit,
    );
}