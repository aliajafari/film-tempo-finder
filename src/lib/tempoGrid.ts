import type {
  HitAlignment,
  HitPoint,
  HitSnap,
  MusicalGridOptions,
  TempoQuality,
} from '../types';

function snapAbsoluteBeat(
  absoluteBeat: number,
  snap: HitSnap,
  beatsPerBar: number,
  subdivision: number,
): number {
  switch (snap) {
    case 'downbeat':
      return (
        Math.round(
          absoluteBeat /
            beatsPerBar,
        ) * beatsPerBar
      );

    case 'beat':
      return Math.round(
        absoluteBeat,
      );

    case 'any':
    default:
      return (
        Math.round(
          absoluteBeat *
            subdivision,
        ) / subdivision
      );
  }
}

export function calculateAlignments(
  hitPoints: HitPoint[],
  bpm: number,
  options: MusicalGridOptions,
): HitAlignment[] {
  const beatDuration =
    60 / bpm;

  const startAbsoluteBeat =
    (options.startBar - 1) *
      options.beatsPerBar +
    (options.startBeat - 1);

  return [...hitPoints]
    .sort(
      (a, b) =>
        a.time - b.time,
    )
    .map(hit => {
      const relativeTime =
        hit.time -
        options.cueStartTime;

      const rawRelativeBeat =
        relativeTime /
        beatDuration;

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
        options.cueStartTime +
        relativeBeat *
          beatDuration;

      const error =
        hit.time -
        beatTime;

      const wholeBeat =
        Math.floor(
          absoluteBeat +
            1e-9,
        );

      const fraction =
        absoluteBeat -
        wholeBeat;

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
}

export function calculateWeightedRmse(
  alignments: HitAlignment[],
): number {
  if (
    alignments.length === 0
  ) {
    return 0;
  }

  const totalWeight =
    alignments.reduce(
      (sum, alignment) =>
        sum +
        alignment.weight,
      0,
    );

  if (totalWeight <= 0) {
    return 0;
  }

  const weightedSquaredError =
    alignments.reduce(
      (sum, alignment) =>
        sum +
        alignment.weight *
          alignment.error ** 2,
      0,
    );

  return Math.sqrt(
    weightedSquaredError /
      totalWeight,
  );
}

export function calculateMaxError(
  alignments: HitAlignment[],
): number {
  if (
    alignments.length === 0
  ) {
    return 0;
  }

  return Math.max(
    ...alignments.map(
      alignment =>
        Math.abs(
          alignment.error,
        ),
    ),
  );
}

export function getTempoQuality(
  rmse: number,
): TempoQuality {
  const milliseconds =
    rmse * 1000;

  if (milliseconds <= 20) {
    return 'excellent';
  }

  if (milliseconds <= 50) {
    return 'good';
  }

  if (milliseconds <= 100) {
    return 'loose';
  }

  return 'poor';
}