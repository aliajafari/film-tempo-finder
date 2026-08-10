import {
  Fragment,
  type ReactNode,
  useMemo,
  useState,
} from 'react';

import {
  findBestTempos,
} from './lib/findBestTempos';

import {
  findProjectTempos,
} from './lib/findProjectTempos';

import {
  formatTimecodeInput,
  getTimecodeError,
  isValidTimecode,
  normalizeTimecode,
  secondsToTimecode,
  timecodeToSeconds,
} from './lib/timecode';

import type {
  AppMode,
  HitAlignment,
  HitSnap,
  HitWeight,
  ProjectTempoResult,
  SceneWeight,
  Subdivision,
  TempoQuality,
  TempoRelationship,
  TempoResult,
} from './types';

type TooltipProps = {
  children:
    ReactNode;

  text:
    string;
};

type CueHitInput = {
  id:
    string;

  timecode:
    string;

  snap:
    HitSnap;

  weight:
    HitWeight;
};

type SceneHitInput = {
  id:
    string;

  timecode:
    string;

  snap:
    HitSnap;

  weight:
    HitWeight;
};

type SceneInput = {
  id:
    string;

  name:
    string;

  inTimecode:
    string;

  outTimecode:
    string;

  preferredBpm:
    number;

  weight:
    SceneWeight;

  beatsPerBar:
    number;

  subdivision:
    Subdivision;

  hitPoints:
    SceneHitInput[];
};

function Tooltip({
  children,
  text,
}: TooltipProps) {
  return (
    <span
      className="tooltip"
      data-tooltip={text}
      tabIndex={0}
    >
      {children}
    </span>
  );
}

function createScene(
  index:
    number,
): SceneInput {
  return {
    id:
      crypto.randomUUID(),

    name:
      `Scene ${index}`,

    inTimecode:
      '',

    outTimecode:
      '',

    preferredBpm:
      120,

    weight:
      1,

    beatsPerBar:
      4,

    subdivision:
      1,

    hitPoints:
      [],
  };
}

function createCueHit():
  CueHitInput {
  return {
    id:
      crypto.randomUUID(),

    timecode:
      '',

    snap:
      'any',

    weight:
      1,
  };
}

function App() {
  const [
    mode,
    setMode,
  ] =
    useState<AppMode>(
      'find-tempo',
    );

  /*
   * Shared
   */

  const [
    fps,
    setFps,
  ] =
    useState(24);

  /*
   * Find Tempo
   */

  const [
    cueStartTimecode,
    setCueStartTimecode,
  ] =
    useState('');

  const [
    cueMinBpm,
    setCueMinBpm,
  ] =
    useState(60);

  const [
    cueMaxBpm,
    setCueMaxBpm,
  ] =
    useState(180);

  const [
    cueStep,
    setCueStep,
  ] =
    useState(0.1);

  const [
    cueBeatsPerBar,
    setCueBeatsPerBar,
  ] =
    useState(4);

  const [
    cueStartBar,
    setCueStartBar,
  ] =
    useState(1);

  const [
    cueStartBeat,
    setCueStartBeat,
  ] =
    useState(1);

  const [
    cueSubdivision,
    setCueSubdivision,
  ] =
    useState<Subdivision>(
      1,
    );

  const [
    cueHits,
    setCueHits,
  ] =
    useState<
      CueHitInput[]
    >([]);

  /*
   * Project Tempo
   */

  const [
    projectMinBpm,
    setProjectMinBpm,
  ] =
    useState(60);

  const [
    projectMaxBpm,
    setProjectMaxBpm,
  ] =
    useState(180);

  const [
    projectStep,
    setProjectStep,
  ] =
    useState(0.1);

  const [
    tempoInfluence,
    setTempoInfluence,
  ] =
    useState(1);

  const [
    scenes,
    setScenes,
  ] =
    useState<
      SceneInput[]
    >([]);

  /*
   * Find Tempo
   */

  const updateCueStartTimecode =
    (
      value:
        string,
    ) => {
      setCueStartTimecode(
        formatTimecodeInput(
          value,
        ),
      );
    };

  const normalizeCueStartTimecode =
    () => {
      if (
        !cueStartTimecode
      ) {
        return;
      }

      setCueStartTimecode(
        normalizeTimecode(
          cueStartTimecode,
        ),
      );
    };

  const addCueHit =
    () => {
      setCueHits(
        current => [
          ...current,

          createCueHit(),
        ],
      );
    };

  const removeCueHit =
    (
      hitId:
        string,
    ) => {
      setCueHits(
        current =>
          current.filter(
            hit =>
              hit.id !==
              hitId,
          ),
      );
    };

  const updateCueHit =
    (
      hitId:
        string,

      patch:
        Partial<CueHitInput>,
    ) => {
      setCueHits(
        current =>
          current.map(
            hit =>
              hit.id ===
              hitId
                ? {
                    ...hit,
                    ...patch,
                  }
                : hit,
          ),
      );
    };

  const cueStartValid =
    isValidTimecode(
      cueStartTimecode,
      fps,
    );

  const cueStartError =
    getTimecodeError(
      cueStartTimecode,
      fps,
    );

  const findTempoHasErrors =
    cueHits.some(
      hit =>
        !isValidTimecode(
          hit.timecode,
          fps,
        ),
    );

  const findTempoHasHitBeforeStart =
    useMemo(
      () => {
        if (
          !cueStartValid
        ) {
          return false;
        }

        const cueStart =
          timecodeToSeconds(
            cueStartTimecode,
            fps,
          );

        return cueHits.some(
          hit => {
            if (
              !isValidTimecode(
                hit.timecode,
                fps,
              )
            ) {
              return false;
            }

            return (
              timecodeToSeconds(
                hit.timecode,
                fps,
              ) <
              cueStart
            );
          },
        );
      },
      [
        cueHits,
        cueStartTimecode,
        cueStartValid,
        fps,
      ],
    );

  const findTempoResults =
    useMemo(
      () => {
        if (
          mode !==
            'find-tempo' ||
          !cueStartValid ||
          cueHits.length <
            2 ||
          findTempoHasErrors ||
          findTempoHasHitBeforeStart ||
          cueMinBpm <= 0 ||
          cueMaxBpm <=
            cueMinBpm ||
          cueStep <= 0 ||
          cueBeatsPerBar <=
            0 ||
          cueStartBar <=
            0 ||
          cueStartBeat <=
            0 ||
          cueStartBeat >
            cueBeatsPerBar
        ) {
          return [];
        }

        try {
          const cueStartTime =
            timecodeToSeconds(
              cueStartTimecode,
              fps,
            );

          const hitPoints =
            cueHits.map(
              hit => ({
                id:
                  hit.id,

                time:
                  timecodeToSeconds(
                    hit.timecode,
                    fps,
                  ),

                snap:
                  hit.snap,

                weight:
                  hit.weight,
              }),
            );

          return findBestTempos(
            hitPoints,

            {
              cueStartTime,

              minBpm:
                cueMinBpm,

              maxBpm:
                cueMaxBpm,

              step:
                cueStep,

              beatsPerBar:
                cueBeatsPerBar,

              startBar:
                cueStartBar,

              startBeat:
                cueStartBeat,

              subdivision:
                cueSubdivision,
            },

            3,
          );
        } catch {
          return [];
        }
      },
      [
        mode,
        cueHits,
        cueStartValid,
        cueStartTimecode,
        fps,
        findTempoHasErrors,
        findTempoHasHitBeforeStart,
        cueMinBpm,
        cueMaxBpm,
        cueStep,
        cueBeatsPerBar,
        cueStartBar,
        cueStartBeat,
        cueSubdivision,
      ],
    );

  /*
   * Project Tempo
   */

  const addScene =
    () => {
      setScenes(
        current => [
          ...current,

          createScene(
            current.length +
              1,
          ),
        ],
      );
    };

  const removeScene =
    (
      sceneId:
        string,
    ) => {
      setScenes(
        current =>
          current.filter(
            scene =>
              scene.id !==
              sceneId,
          ),
      );
    };

  const updateScene = <
    K extends
      keyof SceneInput,
  >(
    sceneId:
      string,

    key:
      K,

    value:
      SceneInput[K],
  ) => {
    setScenes(
      current =>
        current.map(
          scene =>
            scene.id ===
            sceneId
              ? {
                  ...scene,

                  [key]:
                    value,
                }
              : scene,
        ),
    );
  };

  const updateSceneTimecode =
    (
      sceneId:
        string,

      field:
        | 'inTimecode'
        | 'outTimecode',

      value:
        string,
    ) => {
      updateScene(
        sceneId,

        field,

        formatTimecodeInput(
          value,
        ),
      );
    };

  const normalizeSceneTimecode =
    (
      sceneId:
        string,

      field:
        | 'inTimecode'
        | 'outTimecode',
    ) => {
      setScenes(
        current =>
          current.map(
            scene => {
              if (
                scene.id !==
                sceneId
              ) {
                return scene;
              }

              const value =
                scene[field];

              if (!value) {
                return scene;
              }

              return {
                ...scene,

                [field]:
                  normalizeTimecode(
                    value,
                  ),
              };
            },
          ),
      );
    };

  const addSceneHit =
    (
      sceneId:
        string,
    ) => {
      setScenes(
        current =>
          current.map(
            scene =>
              scene.id ===
              sceneId
                ? {
                    ...scene,

                    hitPoints: [
                      ...scene.hitPoints,

                      {
                        id:
                          crypto.randomUUID(),

                        timecode:
                          '',

                        snap:
                          'any',

                        weight:
                          1,
                      },
                    ],
                  }
                : scene,
          ),
      );
    };

  const updateSceneHit =
    (
      sceneId:
        string,

      hitId:
        string,

      patch:
        Partial<SceneHitInput>,
    ) => {
      setScenes(
        current =>
          current.map(
            scene =>
              scene.id ===
              sceneId
                ? {
                    ...scene,

                    hitPoints:
                      scene.hitPoints.map(
                        hit =>
                          hit.id ===
                          hitId
                            ? {
                                ...hit,
                                ...patch,
                              }
                            : hit,
                      ),
                  }
                : scene,
          ),
      );
    };

  const removeSceneHit =
    (
      sceneId:
        string,

      hitId:
        string,
    ) => {
      setScenes(
        current =>
          current.map(
            scene =>
              scene.id ===
              sceneId
                ? {
                    ...scene,

                    hitPoints:
                      scene.hitPoints.filter(
                        hit =>
                          hit.id !==
                          hitId,
                      ),
                  }
                : scene,
          ),
      );
    };

  const hasIncompleteScenes =
    useMemo(
      () =>
        scenes.some(
          scene =>
            scene.preferredBpm <=
              0 ||
            !isValidTimecode(
              scene.inTimecode,
              fps,
            ) ||
            !isValidTimecode(
              scene.outTimecode,
              fps,
            ) ||
            Boolean(
              getSceneRangeError(
                scene,
                fps,
              ),
            ) ||
            scene.hitPoints.some(
              hit =>
                !isValidTimecode(
                  hit.timecode,
                  fps,
                ) ||
                Boolean(
                  getHitRangeError(
                    scene,
                    hit.timecode,
                    fps,
                  ),
                ),
            ),
        ),

      [
        scenes,
        fps,
      ],
    );

  const projectResults =
    useMemo(
      () => {
        if (
          mode !==
            'project-tempo' ||
          scenes.length ===
            0 ||
          hasIncompleteScenes ||
          projectMinBpm <=
            0 ||
          projectMaxBpm <=
            projectMinBpm ||
          projectStep <=
            0 ||
          tempoInfluence <
            0
        ) {
          return [];
        }

        try {
          const parsedScenes =
            scenes.map(
              scene => {
                const startTime =
                  timecodeToSeconds(
                    scene.inTimecode,
                    fps,
                  );

                const endTime =
                  timecodeToSeconds(
                    scene.outTimecode,
                    fps,
                  );

                return {
                  id:
                    scene.id,

                  startTime,

                  endTime,

                  preferredBpm:
                    scene.preferredBpm,

                  weight:
                    scene.weight,

                  beatsPerBar:
                    scene.beatsPerBar,

                  subdivision:
                    scene.subdivision,

                  hitPoints:
                    scene.hitPoints.map(
                      hit => ({
                        id:
                          hit.id,

                        time:
                          timecodeToSeconds(
                            hit.timecode,
                            fps,
                          ),

                        snap:
                          hit.snap,

                        weight:
                          hit.weight,
                      }),
                    ),
                };
              },
            );

          return findProjectTempos(
            parsedScenes,

            {
              minBpm:
                projectMinBpm,

              maxBpm:
                projectMaxBpm,

              step:
                projectStep,

              fps,

              tempoInfluence,
            },

            3,
          );
        } catch {
          return [];
        }
      },

      [
        mode,
        scenes,
        fps,
        hasIncompleteScenes,
        projectMinBpm,
        projectMaxBpm,
        projectStep,
        tempoInfluence,
      ],
    );

  return (
    <main className="app">
      <header>
        <h1>
          Film Tempo Finder
        </h1>

        <p>
          Find musical tempos
          that fit important
          moments in picture.
        </p>
      </header>

      <section>
        <h2>
          What do you want to
          do?
        </h2>

        <div
          className="mode-tabs"
          role="tablist"
          aria-label="Tempo workflow"
        >
          <button
            type="button"
            role="tab"
            aria-selected={
              mode ===
              'find-tempo'
            }
            className={
              mode ===
              'find-tempo'
                ? 'mode-tab mode-tab--active'
                : 'mode-tab'
            }
            onClick={() =>
              setMode(
                'find-tempo',
              )
            }
          >
            <strong>
              Find Tempo
            </strong>

            <span>
              Find the best BPM
              for one cue from
              its hit points.
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={
              mode ===
              'project-tempo'
            }
            className={
              mode ===
              'project-tempo'
                ? 'mode-tab mode-tab--active'
                : 'mode-tab'
            }
            onClick={() =>
              setMode(
                'project-tempo',
              )
            }
          >
            <strong>
              Project Tempo
            </strong>

            <span>
              Find a common
              project BPM using
              scene tempos and
              picture timing.
            </span>
          </button>
        </div>
      </section>

      {mode ===
        'find-tempo' && (
        <>
          <section>
            <h2>
              Cue Setup
            </h2>

            <p>
              Define where the
              musical grid starts
              for this cue.
            </p>

            <div className="project-settings-grid">
              <label>
                <span className="field-label">
                  Cue Start
                  Timecode
                </span>

                <div className="timecode-field">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={
                      11
                    }
                    placeholder="HH:MM:SS:FF"
                    value={
                      cueStartTimecode
                    }
                    className={
                      cueStartError
                        ? 'timecode-input timecode-input--invalid'
                        : 'timecode-input'
                    }
                    onChange={
                      event =>
                        updateCueStartTimecode(
                          event
                            .target
                            .value,
                        )
                    }
                    onBlur={
                      normalizeCueStartTimecode
                    }
                  />

                  {cueStartError && (
                    <span className="field-error">
                      {
                        cueStartError
                      }
                    </span>
                  )}
                </div>
              </label>

              <label>
                <span className="field-label">
                  <Tooltip text="Frames Per Second">
                    FPS
                  </Tooltip>
                </span>

                <select
                  value={fps}
                  onChange={
                    event =>
                      setFps(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                >
                  <option value={24}>
                    24 fps
                  </option>

                  <option value={25}>
                    25 fps
                  </option>

                  <option value={30}>
                    30 fps
                  </option>
                </select>
              </label>

              <label>
                <span className="field-label">
                  Time Signature
                </span>

                <select
                  value={
                    cueBeatsPerBar
                  }
                  onChange={
                    event => {
                      const value =
                        Number(
                          event
                            .target
                            .value,
                        );

                      setCueBeatsPerBar(
                        value,
                      );

                      if (
                        cueStartBeat >
                        value
                      ) {
                        setCueStartBeat(
                          value,
                        );
                      }
                    }
                  }
                >
                  <option value={2}>
                    2/4
                  </option>

                  <option value={3}>
                    3/4
                  </option>

                  <option value={4}>
                    4/4
                  </option>

                  <option value={5}>
                    5/4
                  </option>

                  <option value={6}>
                    6/4
                  </option>

                  <option value={7}>
                    7/4
                  </option>
                </select>
              </label>

              <label>
                <span className="field-label">
                  Start Bar
                </span>

                <input
                  type="number"
                  min={1}
                  step={1}
                  value={
                    cueStartBar
                  }
                  onChange={
                    event =>
                      setCueStartBar(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  Start Beat
                </span>

                <input
                  type="number"
                  min={1}
                  max={
                    cueBeatsPerBar
                  }
                  step={1}
                  value={
                    cueStartBeat
                  }
                  onChange={
                    event =>
                      setCueStartBeat(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  Hit Resolution
                </span>

                <select
                  value={
                    cueSubdivision
                  }
                  onChange={
                    event =>
                      setCueSubdivision(
                        Number(
                          event
                            .target
                            .value,
                        ) as Subdivision,
                      )
                  }
                >
                  <option value={1}>
                    Full Beat
                  </option>

                  <option value={2}>
                    Half Beat
                  </option>

                  <option value={4}>
                    Quarter Beat
                  </option>
                </select>
              </label>
            </div>
          </section>

          <section>
            <h2>
              Tempo Search
            </h2>

            <p>
              Define the BPM
              range to search.
            </p>

            <div className="project-settings-grid">
              <label>
                <span className="field-label">
                  Minimum{' '}
                  <Tooltip text="Beats Per Minute">
                    BPM
                  </Tooltip>
                </span>

                <input
                  type="number"
                  min={1}
                  value={
                    cueMinBpm
                  }
                  onChange={
                    event =>
                      setCueMinBpm(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  Maximum{' '}
                  <Tooltip text="Beats Per Minute">
                    BPM
                  </Tooltip>
                </span>

                <input
                  type="number"
                  min={1}
                  value={
                    cueMaxBpm
                  }
                  onChange={
                    event =>
                      setCueMaxBpm(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  Search Step
                </span>

                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={
                    cueStep
                  }
                  onChange={
                    event =>
                      setCueStep(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>
            </div>
          </section>

          <section>
            <div className="section-header">
              <div>
                <h2>
                  Hit Points
                </h2>

                <p>
                  Add the
                  important events
                  inside this cue.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addCueHit
                }
              >
                + Add Hit
              </button>
            </div>

            {cueHits.length ===
            0 ? (
              <div className="empty-state">
                <p>
                  No hit points
                  yet.
                </p>

                <p>
                  Add at least two
                  hit points to
                  search for a
                  tempo.
                </p>
              </div>
            ) : (
              <div className="input-table-wrapper">
                <table className="input-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>
                        Timecode
                      </th>
                      <th>
                        Alignment
                      </th>
                      <th>
                        Priority
                      </th>
                      <th>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {cueHits.map(
                      (
                        hit,
                        index,
                      ) => {
                        const error =
                          getTimecodeError(
                            hit.timecode,
                            fps,
                          );

                        const beforeStart =
                          cueStartValid &&
                          isValidTimecode(
                            hit.timecode,
                            fps,
                          ) &&
                          timecodeToSeconds(
                            hit.timecode,
                            fps,
                          ) <
                            timecodeToSeconds(
                              cueStartTimecode,
                              fps,
                            );

                        return (
                          <tr
                            key={
                              hit.id
                            }
                          >
                            <td>
                              {index +
                                1}
                            </td>

                            <td>
                              <div className="timecode-field">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={
                                    11
                                  }
                                  placeholder="HH:MM:SS:FF"
                                  value={
                                    hit.timecode
                                  }
                                  className={
                                    error ||
                                    beforeStart
                                      ? 'timecode-input timecode-input--invalid'
                                      : 'timecode-input'
                                  }
                                  onChange={event =>
                                    updateCueHit(
                                      hit.id,

                                      {
                                        timecode:
                                          formatTimecodeInput(
                                            event
                                              .target
                                              .value,
                                          ),
                                      },
                                    )
                                  }
                                  onBlur={() =>
                                    updateCueHit(
                                      hit.id,

                                      {
                                        timecode:
                                          normalizeTimecode(
                                            hit.timecode,
                                          ),
                                      },
                                    )
                                  }
                                />

                                {error && (
                                  <span className="field-error">
                                    {
                                      error
                                    }
                                  </span>
                                )}

                                {!error &&
                                  beforeStart && (
                                    <span className="field-error">
                                      Hit must occur
                                      at or after
                                      Cue Start.
                                    </span>
                                  )}
                              </div>
                            </td>

                            <td>
                              <select
                                value={
                                  hit.snap
                                }
                                onChange={event =>
                                  updateCueHit(
                                    hit.id,

                                    {
                                      snap:
                                        event
                                          .target
                                          .value as HitSnap,
                                    },
                                  )
                                }
                              >
                                <option value="any">
                                  Any Grid
                                  Position
                                </option>

                                <option value="beat">
                                  Full Beat
                                </option>

                                <option value="downbeat">
                                  First Beat
                                  of Bar
                                </option>
                              </select>
                            </td>

                            <td>
                              <select
                                value={
                                  hit.weight
                                }
                                onChange={event =>
                                  updateCueHit(
                                    hit.id,

                                    {
                                      weight:
                                        Number(
                                          event
                                            .target
                                            .value,
                                        ) as HitWeight,
                                    },
                                  )
                                }
                              >
                                <option value={1}>
                                  Normal
                                </option>

                                <option value={2}>
                                  Important
                                </option>

                                <option value={4}>
                                  Critical
                                </option>
                              </select>
                            </td>

                            <td>
                              <button
                                type="button"
                                className="remove-button"
                                onClick={() =>
                                  removeCueHit(
                                    hit.id,
                                  )
                                }
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <div className="results-heading">
              <div>
                <h2>
                  Best Tempos
                </h2>

                <p>
                  Compare the
                  three best BPM
                  matches for this
                  cue.
                </p>
              </div>
            </div>

            {cueHits.length <
            2 ? (
              <p>
                Add at least two
                hit points.
              </p>
            ) : !cueStartValid ? (
              <p>
                Enter a valid Cue
                Start Timecode.
              </p>
            ) : findTempoHasErrors ? (
              <p>
                Complete all hit
                point timecodes.
              </p>
            ) : findTempoHasHitBeforeStart ? (
              <p>
                Hit points cannot
                occur before Cue
                Start.
              </p>
            ) : findTempoResults
                .length <
              3 ? (
              <p>
                Check your tempo
                settings.
              </p>
            ) : (
              <SingleCueResultsTable
                results={
                  findTempoResults
                }
                hits={
                  cueHits
                }
              />
            )}
          </section>
        </>
      )}

      {mode ===
        'project-tempo' && (
        <>
          <section>
            <h2>
              Project Settings
            </h2>

            <p>
              Search for a common
              BPM using both
              picture alignment
              and each scene's
              preferred tempo.
            </p>

            <div className="project-settings-grid project-settings-grid--wide">
              <label>
                <span className="field-label">
                  <Tooltip text="Frames Per Second">
                    FPS
                  </Tooltip>
                </span>

                <select
                  value={fps}
                  onChange={
                    event =>
                      setFps(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                >
                  <option value={24}>
                    24 fps
                  </option>

                  <option value={25}>
                    25 fps
                  </option>

                  <option value={30}>
                    30 fps
                  </option>
                </select>
              </label>

              <label>
                <span className="field-label">
                  Minimum{' '}
                  <Tooltip text="Beats Per Minute">
                    BPM
                  </Tooltip>
                </span>

                <input
                  type="number"
                  min={1}
                  value={
                    projectMinBpm
                  }
                  onChange={
                    event =>
                      setProjectMinBpm(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  Maximum{' '}
                  <Tooltip text="Beats Per Minute">
                    BPM
                  </Tooltip>
                </span>

                <input
                  type="number"
                  min={1}
                  value={
                    projectMaxBpm
                  }
                  onChange={
                    event =>
                      setProjectMaxBpm(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  Search Step
                </span>

                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={
                    projectStep
                  }
                  onChange={
                    event =>
                      setProjectStep(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>

              <label>
                <span className="field-label">
                  <Tooltip text="How strongly each scene's preferred BPM influences the final project tempo. 0 means timing only, 1 is balanced, and higher values favor the entered scene tempos more strongly.">
                    Tempo Influence
                  </Tooltip>
                </span>

                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={
                    tempoInfluence
                  }
                  onChange={
                    event =>
                      setTempoInfluence(
                        Number(
                          event
                            .target
                            .value,
                        ),
                      )
                  }
                />
              </label>
            </div>
          </section>

          <section>
            <div className="section-header">
              <div>
                <h2>
                  Project Scenes
                </h2>

                <p>
                  Each scene has
                  its own preferred
                  tempo and timing
                  constraints.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addScene
                }
              >
                + Add Scene
              </button>
            </div>

            {scenes.length ===
            0 ? (
              <div className="empty-state">
                <p>
                  No scenes yet.
                </p>

                <p>
                  Add scenes with
                  their preferred
                  tempo and picture
                  range.
                </p>
              </div>
            ) : (
              <div className="scene-list">
                {scenes.map(
                  (
                    scene,
                    sceneIndex,
                  ) => {
                    const inError =
                      getTimecodeError(
                        scene.inTimecode,
                        fps,
                      );

                    const outError =
                      getTimecodeError(
                        scene.outTimecode,
                        fps,
                      );

                    const rangeError =
                      getSceneRangeError(
                        scene,
                        fps,
                      );

                    return (
                      <article
                        className="scene-card"
                        key={
                          scene.id
                        }
                      >
                        <div className="scene-card-header">
                          <div className="scene-title">
                            <span className="scene-number">
                              Scene{' '}
                              {sceneIndex +
                                1}
                            </span>

                            <input
                              className="scene-name-input"
                              value={
                                scene.name
                              }
                              onChange={event =>
                                updateScene(
                                  scene.id,

                                  'name',

                                  event
                                    .target
                                    .value,
                                )
                              }
                            />
                          </div>

                          <button
                            type="button"
                            className="remove-button"
                            onClick={() =>
                              removeScene(
                                scene.id,
                              )
                            }
                          >
                            Remove Scene
                          </button>
                        </div>

                        <div className="scene-settings-grid scene-settings-grid--with-tempo">
                          <label>
                            <span className="field-label">
                              Scene In
                            </span>

                            <div className="timecode-field">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={
                                  11
                                }
                                placeholder="HH:MM:SS:FF"
                                value={
                                  scene.inTimecode
                                }
                                className={
                                  inError
                                    ? 'timecode-input timecode-input--invalid'
                                    : 'timecode-input'
                                }
                                onChange={event =>
                                  updateSceneTimecode(
                                    scene.id,

                                    'inTimecode',

                                    event
                                      .target
                                      .value,
                                  )
                                }
                                onBlur={() =>
                                  normalizeSceneTimecode(
                                    scene.id,

                                    'inTimecode',
                                  )
                                }
                              />

                              {inError && (
                                <span className="field-error">
                                  {
                                    inError
                                  }
                                </span>
                              )}
                            </div>
                          </label>

                          <label>
                            <span className="field-label">
                              Scene Out
                            </span>

                            <div className="timecode-field">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={
                                  11
                                }
                                placeholder="HH:MM:SS:FF"
                                value={
                                  scene.outTimecode
                                }
                                className={
                                  outError ||
                                  rangeError
                                    ? 'timecode-input timecode-input--invalid'
                                    : 'timecode-input'
                                }
                                onChange={event =>
                                  updateSceneTimecode(
                                    scene.id,

                                    'outTimecode',

                                    event
                                      .target
                                      .value,
                                  )
                                }
                                onBlur={() =>
                                  normalizeSceneTimecode(
                                    scene.id,

                                    'outTimecode',
                                  )
                                }
                              />

                              {outError && (
                                <span className="field-error">
                                  {
                                    outError
                                  }
                                </span>
                              )}

                              {!outError &&
                                rangeError && (
                                  <span className="field-error">
                                    {
                                      rangeError
                                    }
                                  </span>
                                )}
                            </div>
                          </label>

                          <label>
                            <span className="field-label">
                              Preferred{' '}
                              <Tooltip text="The original or desired tempo for this scene.">
                                BPM
                              </Tooltip>
                            </span>

                            <input
                              type="number"
                              min={1}
                              step={0.1}
                              value={
                                scene.preferredBpm
                              }
                              onChange={event =>
                                updateScene(
                                  scene.id,

                                  'preferredBpm',

                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                            />
                          </label>

                          <label>
                            <span className="field-label">
                              Time Signature
                            </span>

                            <select
                              value={
                                scene.beatsPerBar
                              }
                              onChange={event =>
                                updateScene(
                                  scene.id,

                                  'beatsPerBar',

                                  Number(
                                    event
                                      .target
                                      .value,
                                  ),
                                )
                              }
                            >
                              <option value={2}>
                                2/4
                              </option>

                              <option value={3}>
                                3/4
                              </option>

                              <option value={4}>
                                4/4
                              </option>

                              <option value={5}>
                                5/4
                              </option>

                              <option value={6}>
                                6/4
                              </option>

                              <option value={7}>
                                7/4
                              </option>
                            </select>
                          </label>

                          <label>
                            <span className="field-label">
                              Hit Resolution
                            </span>

                            <select
                              value={
                                scene.subdivision
                              }
                              onChange={event =>
                                updateScene(
                                  scene.id,

                                  'subdivision',

                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) as Subdivision,
                                )
                              }
                            >
                              <option value={1}>
                                Full Beat
                              </option>

                              <option value={2}>
                                Half Beat
                              </option>

                              <option value={4}>
                                Quarter Beat
                              </option>
                            </select>
                          </label>

                          <label>
                            <span className="field-label">
                              Scene Priority
                            </span>

                            <select
                              value={
                                scene.weight
                              }
                              onChange={event =>
                                updateScene(
                                  scene.id,

                                  'weight',

                                  Number(
                                    event
                                      .target
                                      .value,
                                  ) as SceneWeight,
                                )
                              }
                            >
                              <option value={1}>
                                Normal
                              </option>

                              <option value={2}>
                                Important
                              </option>

                              <option value={4}>
                                Critical
                              </option>
                            </select>
                          </label>
                        </div>

                        <div className="scene-hits-header">
                          <div>
                            <h3>
                              Internal Hit
                              Points
                            </h3>

                            <p>
                              Optional
                              picture events
                              inside this
                              scene.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              addSceneHit(
                                scene.id,
                              )
                            }
                          >
                            + Add Hit
                          </button>
                        </div>

                        {scene.hitPoints
                          .length ===
                        0 ? (
                          <p className="muted">
                            No internal
                            hit points.
                          </p>
                        ) : (
                          <div className="scene-hit-list">
                            {scene.hitPoints.map(
                              (
                                hit,
                                hitIndex,
                              ) => {
                                const hitError =
                                  getTimecodeError(
                                    hit.timecode,
                                    fps,
                                  );

                                const rangeHitError =
                                  getHitRangeError(
                                    scene,
                                    hit.timecode,
                                    fps,
                                  );

                                return (
                                  <div
                                    className="scene-hit-row"
                                    key={
                                      hit.id
                                    }
                                  >
                                    <span className="scene-hit-number">
                                      {hitIndex +
                                        1}
                                    </span>

                                    <div className="timecode-field">
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={
                                          11
                                        }
                                        placeholder="HH:MM:SS:FF"
                                        value={
                                          hit.timecode
                                        }
                                        className={
                                          hitError ||
                                          rangeHitError
                                            ? 'timecode-input timecode-input--invalid'
                                            : 'timecode-input'
                                        }
                                        onChange={event =>
                                          updateSceneHit(
                                            scene.id,

                                            hit.id,

                                            {
                                              timecode:
                                                formatTimecodeInput(
                                                  event
                                                    .target
                                                    .value,
                                                ),
                                            },
                                          )
                                        }
                                        onBlur={() =>
                                          updateSceneHit(
                                            scene.id,

                                            hit.id,

                                            {
                                              timecode:
                                                normalizeTimecode(
                                                  hit.timecode,
                                                ),
                                            },
                                          )
                                        }
                                      />

                                      {hitError && (
                                        <span className="field-error">
                                          {
                                            hitError
                                          }
                                        </span>
                                      )}

                                      {!hitError &&
                                        rangeHitError && (
                                          <span className="field-error">
                                            {
                                              rangeHitError
                                            }
                                          </span>
                                        )}
                                    </div>

                                    <select
                                      value={
                                        hit.snap
                                      }
                                      onChange={event =>
                                        updateSceneHit(
                                          scene.id,

                                          hit.id,

                                          {
                                            snap:
                                              event
                                                .target
                                                .value as HitSnap,
                                          },
                                        )
                                      }
                                    >
                                      <option value="any">
                                        Any Grid
                                        Position
                                      </option>

                                      <option value="beat">
                                        Full Beat
                                      </option>

                                      <option value="downbeat">
                                        First Beat
                                        of Bar
                                      </option>
                                    </select>

                                    <select
                                      value={
                                        hit.weight
                                      }
                                      onChange={event =>
                                        updateSceneHit(
                                          scene.id,

                                          hit.id,

                                          {
                                            weight:
                                              Number(
                                                event
                                                  .target
                                                  .value,
                                              ) as HitWeight,
                                          },
                                        )
                                      }
                                    >
                                      <option value={1}>
                                        Normal
                                      </option>

                                      <option value={2}>
                                        Important
                                      </option>

                                      <option value={4}>
                                        Critical
                                      </option>
                                    </select>

                                    <button
                                      type="button"
                                      className="remove-button"
                                      onClick={() =>
                                        removeSceneHit(
                                          scene.id,

                                          hit.id,
                                        )
                                      }
                                    >
                                      Remove
                                    </button>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        )}
                      </article>
                    );
                  },
                )}
              </div>
            )}
          </section>

          <section>
            <div className="results-heading">
              <div>
                <h2>
                  Best Project
                  Tempos
                </h2>

                <p>
                  Ranking considers
                  both picture
                  alignment and the
                  preferred tempo
                  of every scene.
                </p>
              </div>
            </div>

            {scenes.length ===
            0 ? (
              <p>
                Add at least one
                scene.
              </p>
            ) : hasIncompleteScenes ? (
              <p>
                Complete all
                scenes and fix
                validation errors.
              </p>
            ) : projectResults
                .length ===
              0 ? (
              <p>
                Check the project
                tempo settings.
              </p>
            ) : (
              <div className="project-results">
                {projectResults.map(
                  (
                    result,
                    index,
                  ) => (
                    <ProjectTempoCard
                      key={
                        result.bpm
                      }
                      rank={
                        index + 1
                      }
                      result={
                        result
                      }
                      scenes={
                        scenes
                      }
                      fps={
                        fps
                      }
                    />
                  ),
                )}
              </div>
            )}
          </section>
        </>
      )}

      <section className="help-section">
        <div className="help-header">
          <h2>
            Help & Glossary
          </h2>

          <p>
            Quick explanations of
            the terms used in Film
            Tempo Finder.
          </p>
        </div>

        <div className="help-grid">
          <article className="help-item">
            <h3>
              Preferred BPM
            </h3>

            <strong>
              Scene Tempo
            </strong>

            <p>
              The tempo you
              originally want or
              expect for a scene.
              Project Tempo uses
              this together with
              timing alignment
              when ranking common
              BPM candidates.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Tempo Relationship
            </h3>

            <strong>
              Rhythmic Relation
            </strong>

            <p>
              A project tempo may
              match a scene tempo
              directly or through
              half-time or
              double-time
              relationships.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Tempo Influence
            </h3>

            <strong>
              Project Search
              Balance
            </strong>

            <p>
              Controls how much
              scene tempo
              preferences affect
              Project Tempo.
              0 uses picture
              timing only, 1 is
              balanced, and larger
              values favor scene
              tempos more strongly.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Project Score
            </h3>

            <strong>
              Combined Ranking
            </strong>

            <p>
              Combines timing
              alignment and tempo
              compatibility.
              Lower values are
              better.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Find Tempo
            </h3>

            <strong>
              Single Cue Search
            </strong>

            <p>
              Finds BPMs whose
              musical grid best
              fits hit points
              inside a single cue.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Project Tempo
            </h3>

            <strong>
              Multi-scene Search
            </strong>

            <p>
              Finds a common BPM
              across multiple
              scenes while
              considering each
              scene's own
              preferred tempo.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

/*
 * Find Tempo Results
 */

type SingleCueResultsTableProps = {
  results:
    TempoResult[];

  hits:
    CueHitInput[];
};

function SingleCueResultsTable({
  results,
  hits,
}: SingleCueResultsTableProps) {
  return (
    <div className="results-table-wrapper">
      <table className="results-table">
        <thead>
          <tr>
            <th rowSpan={2}>
              Event Timecode
            </th>

            <th colSpan={3}>
              Best Match
            </th>

            <th colSpan={3}>
              Second Best
            </th>

            <th colSpan={3}>
              Third Best
            </th>
          </tr>

          <tr>
            {[
              0,
              1,
              2,
            ].map(
              group => (
                <Fragment
                  key={
                    group
                  }
                >
                  <th>
                    Beat #
                  </th>

                  <th>
                    Bar / Beat
                  </th>

                  <th>
                    Timing Error
                  </th>
                </Fragment>
              ),
            )}
          </tr>
        </thead>

        <tbody>
          {hits.map(
            hit => (
              <tr
                key={
                  hit.id
                }
              >
                <td className="timecode-cell">
                  {
                    hit.timecode
                  }
                </td>

                {results.map(
                  result => (
                    <ResultCells
                      key={`${result.bpm}-${hit.id}`}
                      alignment={getAlignment(
                        result,
                        hit.id,
                      )}
                    />
                  ),
                )}
              </tr>
            ),
          )}
        </tbody>

        <tfoot>
          <tr>
            <th>
              Tempo
            </th>

            {results.map(
              result => (
                <td
                  key={
                    result.bpm
                  }
                  colSpan={3}
                >
                  <div className="tempo-summary">
                    <strong>
                      {result.bpm.toFixed(
                        1,
                      )}{' '}
                      BPM
                    </strong>

                    <span>
                      Overall
                      Error:{' '}
                      {(
                        result.rmse *
                        1000
                      ).toFixed(
                        2,
                      )}{' '}
                      ms
                    </span>
                  </div>
                </td>
              ),
            )}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

type ResultCellsProps = {
  alignment?:
    HitAlignment;
};

function ResultCells({
  alignment,
}: ResultCellsProps) {
  if (!alignment) {
    return (
      <>
        <td>—</td>
        <td>—</td>
        <td>—</td>
      </>
    );
  }

  const errorMs =
    alignment.error *
    1000;

  const beat =
    Number.isInteger(
      alignment.beat,
    )
      ? String(
          alignment.beat,
        )
      : alignment.beat.toFixed(
          2,
        );

  return (
    <>
      <td>
        {beat}
      </td>

      <td>
        {alignment.bar}
        {' / '}
        {
          alignment.beatInBar
        }
      </td>

      <td>
        {formatMilliseconds(
          errorMs,
        )}
      </td>
    </>
  );
}

function getAlignment(
  result:
    TempoResult,

  hitId:
    string,
) {
  return result.alignments.find(
    alignment =>
      alignment.hitId ===
      hitId,
  );
}

/*
 * Project Results
 */

type ProjectTempoCardProps = {
  rank:
    number;

  result:
    ProjectTempoResult;

  scenes:
    SceneInput[];

  fps:
    number;
};

function ProjectTempoCard({
  rank,
  result,
  scenes,
  fps,
}: ProjectTempoCardProps) {
  return (
    <article className="tempo-result-card">
      <div className="tempo-result-main">
        <div>
          <span className="result-rank">
            #{rank}
          </span>

          <strong className="result-bpm">
            {result.bpm.toFixed(
              1,
            )}{' '}
            BPM
          </strong>
        </div>

        <div className="result-metrics">
          <div>
            <span>
              Project Score
            </span>

            <strong>
              {result.score.toFixed(
                4,
              )}
            </strong>
          </div>

          <div>
            <span>
              Timing Error
            </span>

            <strong>
              {(
                result.timingRmse *
                1000
              ).toFixed(
                2,
              )}{' '}
              ms
            </strong>
          </div>

          <div>
            <span>
              Tempo Deviation
            </span>

            <strong>
              {result.tempoDeviationPercent.toFixed(
                2,
              )}
              %
            </strong>
          </div>

          <div>
            <span>
              Maximum Error
            </span>

            <strong>
              {(
                result.maxError *
                1000
              ).toFixed(
                2,
              )}{' '}
              ms
            </strong>
          </div>

          <div>
            <span>
              Timing Fit
            </span>

            <strong>
              {formatQuality(
                result.quality,
              )}
            </strong>
          </div>
        </div>
      </div>

      <div className="tempo-scenes-table-wrapper">
        <table className="tempo-scenes-table tempo-scenes-table--extended">
          <thead>
            <tr>
              <th>
                Scene
              </th>

              <th>
                Preferred Tempo
              </th>

              <th>
                Relationship
              </th>

              <th>
                Tempo Deviation
              </th>

              <th>
                Recommended Cue
                Start
              </th>

              <th>
                Scene In
              </th>

              <th>
                Scene Out
              </th>

              <th>
                Timing Error
              </th>

              <th>
                Fit
              </th>
            </tr>
          </thead>

          <tbody>
            {result.scenes.map(
              sceneFit => {
                const scene =
                  scenes.find(
                    item =>
                      item.id ===
                      sceneFit.sceneId,
                  );

                return (
                  <tr
                    key={
                      sceneFit.sceneId
                    }
                  >
                    <td>
                      {scene?.name ??
                        'Scene'}
                    </td>

                    <td>
                      {sceneFit.preferredBpm.toFixed(
                        1,
                      )}{' '}
                      BPM
                    </td>

                    <td>
                      {formatTempoRelationship(
                        sceneFit.tempoRelationship,
                      )}
                    </td>

                    <td>
                      {sceneFit.tempoDeviationPercent.toFixed(
                        2,
                      )}
                      %
                    </td>

                    <td className="timecode-cell">
                      {secondsToTimecode(
                        sceneFit.recommendedCueStart,
                        fps,
                      )}
                    </td>

                    <td>
                      {sceneFit.sceneIn.bar}
                      {' / '}
                      {
                        sceneFit
                          .sceneIn
                          .beatInBar
                      }
                    </td>

                    <td>
                      {sceneFit.sceneOut.bar}
                      {' / '}
                      {
                        sceneFit
                          .sceneOut
                          .beatInBar
                      }
                    </td>

                    <td>
                      {(
                        sceneFit.rmse *
                        1000
                      ).toFixed(
                        2,
                      )}{' '}
                      ms
                    </td>

                    <td>
                      {formatQuality(
                        sceneFit.quality,
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function formatTempoRelationship(
  relationship:
    TempoRelationship,
): string {
  switch (relationship) {
    case 'quarter-time':
      return '¼×';

    case 'half-time':
      return '½×';

    case 'same':
      return '1×';

    case 'double-time':
      return '2×';

    case 'quadruple-time':
      return '4×';

    case 'related':
      return 'Related';
  }
}

function formatQuality(
  quality:
    TempoQuality,
): string {
  switch (quality) {
    case 'excellent':
      return 'Excellent';

    case 'good':
      return 'Good';

    case 'loose':
      return 'Loose';

    case 'poor':
      return 'Poor';
  }
}

function formatMilliseconds(
  milliseconds:
    number,
): string {
  const prefix =
    milliseconds >= 0
      ? '+'
      : '';

  return `${prefix}${milliseconds.toFixed(
    2,
  )} ms`;
}

function getSceneRangeError(
  scene:
    SceneInput,

  fps:
    number,
): string | null {
  if (
    !isValidTimecode(
      scene.inTimecode,
      fps,
    ) ||
    !isValidTimecode(
      scene.outTimecode,
      fps,
    )
  ) {
    return null;
  }

  const start =
    timecodeToSeconds(
      scene.inTimecode,
      fps,
    );

  const end =
    timecodeToSeconds(
      scene.outTimecode,
      fps,
    );

  if (
    end <= start
  ) {
    return 'Scene Out must be after Scene In.';
  }

  return null;
}

function getHitRangeError(
  scene:
    SceneInput,

  timecode:
    string,

  fps:
    number,
): string | null {
  if (
    !isValidTimecode(
      timecode,
      fps,
    ) ||
    !isValidTimecode(
      scene.inTimecode,
      fps,
    ) ||
    !isValidTimecode(
      scene.outTimecode,
      fps,
    )
  ) {
    return null;
  }

  const hit =
    timecodeToSeconds(
      timecode,
      fps,
    );

  const start =
    timecodeToSeconds(
      scene.inTimecode,
      fps,
    );

  const end =
    timecodeToSeconds(
      scene.outTimecode,
      fps,
    );

  if (
    hit < start ||
    hit > end
  ) {
    return 'Hit must be inside the scene range.';
  }

  return null;
}

export default App;