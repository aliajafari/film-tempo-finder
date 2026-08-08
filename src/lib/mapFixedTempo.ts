import type {
  FixedTempoOptions,
  HitPoint,
  TempoResult,
} from '../types';

import {
  calculateAlignments,
  calculateMaxError,
  calculateWeightedRmse,
  getTempoQuality,
} from './tempoGrid';

export function mapFixedTempo(
  hitPoints: HitPoint[],
  options: FixedTempoOptions,
): TempoResult | null {
  if (
    hitPoints.length === 0 ||
    options.bpm <= 0
  ) {
    return null;
  }

  const alignments =
    calculateAlignments(
      hitPoints,
      options.bpm,
      options,
    );

  const rmse =
    calculateWeightedRmse(
      alignments,
    );

  return {
    bpm: options.bpm,

    rmse,

    maxError:
      calculateMaxError(
        alignments,
      ),

    quality:
      getTempoQuality(rmse),

    alignments,
  };
}