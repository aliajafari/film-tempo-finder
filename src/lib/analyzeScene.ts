import type {
  HitPoint,
  SceneTempoInput,
  SceneTimingFit,
} from '../types';

import {
  calculateAlignments,
  calculateMaxError,
  calculateWeightedRmse,
  getTempoQuality,
} from './tempoGrid';

const SCENE_IN_ID =
  '__scene_in__';

const SCENE_OUT_ID =
  '__scene_out__';

export function analyzeSceneAtTempo(
  scene: SceneTempoInput,
  bpm: number,
  fps: number,
): SceneTimingFit | null {
  if (
    bpm <= 0 ||
    fps <= 0 ||
    scene.endTime <=
      scene.startTime ||
    scene.beatsPerBar <= 0
  ) {
    return null;
  }

  const beatDuration =
    60 / bpm;

  const barDuration =
    beatDuration *
    scene.beatsPerBar;

  const frameDuration =
    1 / fps;

  /*
   * Scene In and Scene Out are
   * structural points.
   *
   * We currently prefer them on
   * downbeats.
   */
  const points: HitPoint[] = [
    {
      id: SCENE_IN_ID,

      time:
        scene.startTime,

      snap:
        'downbeat',

      weight:
        4,
    },

    ...scene.hitPoints,

    {
      id: SCENE_OUT_ID,

      time:
        scene.endTime,

      snap:
        'downbeat',

      weight:
        4,
    },
  ];

  /*
   * The grid phase repeats after
   * one complete bar.
   *
   * Searching one bar before
   * Scene In therefore covers all
   * unique bar-grid phases.
   */
  const searchStart =
    Math.max(
      0,
      scene.startTime -
        barDuration,
    );

  const searchEnd =
    scene.startTime;

  let best:
    | {
        cueStartTime: number;
        rmse: number;
        alignments:
          ReturnType<
            typeof calculateAlignments
          >;
      }
    | null = null;

  /*
   * Search on exact video frames.
   *
   * We calculate using an integer
   * frame index instead of repeatedly
   * adding frameDuration. This avoids
   * accumulating floating-point drift.
   */
  const totalFrames =
    Math.max(
      0,
      Math.round(
        (
          searchEnd -
          searchStart
        ) *
          fps,
      ),
    );

  for (
    let frameIndex = 0;
    frameIndex <=
    totalFrames;
    frameIndex++
  ) {
    const cueStart =
      Math.min(
        searchEnd,
        searchStart +
          frameIndex *
            frameDuration,
      );

    const alignments =
      calculateAlignments(
        points,
        bpm,
        {
          cueStartTime:
            cueStart,

          beatsPerBar:
            scene.beatsPerBar,

          startBar: 1,
          startBeat: 1,

          subdivision:
            scene.subdivision,
        },
      );

    const rmse =
      calculateWeightedRmse(
        alignments,
      );

    if (
      !best ||
      rmse < best.rmse
    ) {
      best = {
        cueStartTime:
          cueStart,

        rmse,

        alignments,
      };
    }
  }

  if (!best) {
    return null;
  }

  const sceneIn =
    best.alignments.find(
      alignment =>
        alignment.hitId ===
        SCENE_IN_ID,
    );

  const sceneOut =
    best.alignments.find(
      alignment =>
        alignment.hitId ===
        SCENE_OUT_ID,
    );

  if (
    !sceneIn ||
    !sceneOut
  ) {
    return null;
  }

  const hitAlignments =
    best.alignments.filter(
      alignment =>
        alignment.hitId !==
          SCENE_IN_ID &&
        alignment.hitId !==
          SCENE_OUT_ID,
    );

  return {
    sceneId:
      scene.id,

    bpm,

    recommendedCueStart:
      best.cueStartTime,

    offsetFromSceneStart:
      best.cueStartTime -
      scene.startTime,

    rmse:
      best.rmse,

    maxError:
      calculateMaxError(
        best.alignments,
      ),

    quality:
      getTempoQuality(
        best.rmse,
      ),

    sceneIn,

    sceneOut,

    hitAlignments,
  };
}