import type {
  HitPoint,
  HitSnap,
  TempoQuality,
  TempoResult,
  TempoSearchOptions,
} from '../types';

function calculateWeightedRmse(
  alignments: {
    error: number;
    weight: number;
  }[],
) {
  if (alignments.length === 0) {
    return 0;
  }

  const totalWeight = alignments.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  if (totalWeight === 0) {
    return 0;
  }

  const weightedSquaredError =
    alignments.reduce(
      (sum, item) =>
        sum + item.weight * item.error ** 2,
      0,
    );

  return Math.sqrt(
    weightedSquaredError / totalWeight,
  );
}

function calculateMaxError(
  alignments: {
    error: number;
  }[],
) {
  if (alignments.length === 0) {
    return 0;
  }

  return Math.max(
    ...alignments.map(item =>
      Math.abs(item.error),
    ),
  );
}

function getQuality(
  rmse: number,
): TempoQuality {
  const rmseMs = rmse * 1000;

  if (rmseMs <= 20) {
    return 'excellent';
  }

  if (rmseMs <= 50) {
    return 'good';
  }

  if (rmseMs <= 100) {
    return 'loose';
  }

  return 'poor';
}

function snapAbsoluteBeat(
  absoluteBeat: number,
  snap: HitSnap,
  beatsPerBar: number,
  subdivision: number,
) {
  switch (snap) {
    case 'downbeat':
      return (
        Math.round(
          absoluteBeat / beatsPerBar,
        ) * beatsPerBar
      );

    case 'beat':
      return Math.round(absoluteBeat);

    case 'any':
    default:
      return (
        Math.round(
          absoluteBeat * subdivision,
        ) / subdivision
      );
  }
}

export function findBestTempos(
  hitPoints: HitPoint[],
  options: TempoSearchOptions,
  limit = 5,
): TempoResult[] {
  if (hitPoints.length < 2) {
    return [];
  }

  const sortedHitPoints = [...hitPoints].sort(
    (a, b) => a.time - b.time,
  );

  const origin = sortedHitPoints[0].time;

  const startAbsoluteBeat =
    (options.startBar - 1) *
      options.beatsPerBar +
    (options.startBeat - 1);

  const results: TempoResult[] = [];

  const totalSteps = Math.floor(
    (options.maxBpm - options.minBpm) /
      options.step,
  );

  for (let i = 0; i <= totalSteps; i++) {
    const bpm = Number(
      (
        options.minBpm +
        i * options.step
      ).toFixed(6),
    );

    const beatDuration = 60 / bpm;

    const alignments = sortedHitPoints.map(hit => {
      const relativeTime =
        hit.time - origin;

      const rawRelativeBeat =
        relativeTime / beatDuration;

      const rawAbsoluteBeat =
        startAbsoluteBeat +
        rawRelativeBeat;

      const absoluteBeat =
        snapAbsoluteBeat(
          rawAbsoluteBeat,
          hit.snap,
          options.beatsPerBar,
          options.subdivision,
        );

      const relativeBeat =
        absoluteBeat -
        startAbsoluteBeat;

      const beatTime =
        origin +
        relativeBeat * beatDuration;

      const error =
        hit.time - beatTime;

      const wholeBeat =
        Math.floor(absoluteBeat);

      const fraction =
        absoluteBeat - wholeBeat;

      const bar =
        Math.floor(
          wholeBeat /
            options.beatsPerBar,
        ) + 1;

      const beatInBar =
        (wholeBeat %
          options.beatsPerBar) +
        1;

      const subdivisionIndex =
        Math.round(
          fraction *
            options.subdivision,
        );

      return {
        hitId: hit.id,
        hitTime: hit.time,

        snap: hit.snap,
        weight: hit.weight,

        beat: absoluteBeat,
        beatTime,
        error,

        bar,
        beatInBar,
        subdivisionIndex,
      };
    });

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
      quality: getQuality(rmse),
      alignments,
    });
  }

  return results
    .sort(
      (a, b) => a.rmse - b.rmse,
    )
    .slice(0, limit);
}