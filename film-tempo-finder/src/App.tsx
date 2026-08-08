import {
  type ReactNode,
  useMemo,
  useState,
} from 'react';

import { findBestTempos } from './lib/findBestTempos';
import { timecodeToSeconds } from './lib/timecode';

import type {
  HitSnap,
  HitWeight,
  Subdivision,
  TempoQuality,
} from './types';

type HitPointInput = {
  id: string;
  timecode: string;
  snap: HitSnap;
  weight: HitWeight;
};

type TooltipProps = {
  children: ReactNode;
  text: string;
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

function App() {
  const [fps, setFps] = useState(24);

  const [minBpm, setMinBpm] =
    useState(60);

  const [maxBpm, setMaxBpm] =
    useState(180);

  const [step, setStep] =
    useState(0.1);

  const [
    beatsPerBar,
    setBeatsPerBar,
  ] = useState(4);

  const [
    startBar,
    setStartBar,
  ] = useState(1);

  const [
    startBeat,
    setStartBeat,
  ] = useState(1);

  const [
    subdivision,
    setSubdivision,
  ] = useState<Subdivision>(1);

  const [
    hitPoints,
    setHitPoints,
  ] = useState<HitPointInput[]>([]);

  const results = useMemo(() => {
    if (
      hitPoints.length < 2 ||
      minBpm <= 0 ||
      maxBpm <= minBpm ||
      step <= 0 ||
      beatsPerBar <= 0 ||
      startBar <= 0 ||
      startBeat <= 0 ||
      startBeat > beatsPerBar
    ) {
      return [];
    }

    try {
      const parsedHitPoints =
        hitPoints.map(hit => ({
          id: hit.id,

          time: timecodeToSeconds(
            hit.timecode,
            fps,
          ),

          snap: hit.snap,
          weight: hit.weight,
        }));

      return findBestTempos(
        parsedHitPoints,
        {
          minBpm,
          maxBpm,
          step,
          beatsPerBar,
          startBar,
          startBeat,
          subdivision,
        },
        5,
      );
    } catch {
      return [];
    }
  }, [
    hitPoints,
    fps,
    minBpm,
    maxBpm,
    step,
    beatsPerBar,
    startBar,
    startBeat,
    subdivision,
  ]);

  const updateHitTimecode = (
    id: string,
    timecode: string,
  ) => {
    setHitPoints(current =>
      current.map(hit =>
        hit.id === id
          ? {
              ...hit,
              timecode,
            }
          : hit,
      ),
    );
  };

  const updateHitSnap = (
    id: string,
    snap: HitSnap,
  ) => {
    setHitPoints(current =>
      current.map(hit =>
        hit.id === id
          ? {
              ...hit,
              snap,
            }
          : hit,
      ),
    );
  };

  const updateHitWeight = (
    id: string,
    weight: HitWeight,
  ) => {
    setHitPoints(current =>
      current.map(hit =>
        hit.id === id
          ? {
              ...hit,
              weight,
            }
          : hit,
      ),
    );
  };

  const addHitPoint = () => {
    setHitPoints(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        timecode: '',
        snap: 'any',
        weight: 1,
      },
    ]);
  };

  const removeHitPoint = (
    id: string,
  ) => {
    setHitPoints(current =>
      current.filter(
        hit => hit.id !== id,
      ),
    );
  };

  const formatPosition = (
    beat: number,
    subdivisionIndex: number,
  ) => {
    if (
      subdivision === 1 ||
      subdivisionIndex === 0
    ) {
      return String(beat);
    }

    return `${beat} + ${subdivisionIndex}/${subdivision}`;
  };

  const formatSnap = (
    snap: HitSnap,
  ) => {
    switch (snap) {
      case 'downbeat':
        return 'Downbeat';

      case 'beat':
        return 'Beat';

      default:
        return 'Any';
    }
  };

  const formatWeight = (
    weight: HitWeight,
  ) => {
    switch (weight) {
      case 4:
        return 'Critical';

      case 2:
        return 'Important';

      default:
        return 'Normal';
    }
  };

  const formatQuality = (
    quality: TempoQuality,
  ) => {
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
  };

  return (
    <main className="app">
      <header>
        <h1>
          Film Tempo Finder
        </h1>

        <p>
          Find musical tempos that align
          with film hit points.
        </p>
      </header>

      <section>
        <h2>Frame Rate</h2>

        <div className="settings-grid settings-grid--small">
          <label>
            <span className="field-label">
              <Tooltip text="Frames Per Second">
                FPS
              </Tooltip>
            </span>

            <select
              value={fps}
              onChange={event =>
                setFps(
                  Number(
                    event.target.value,
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
        </div>
      </section>

      <section>
        <h2>
          Tempo Settings
        </h2>

        <div className="settings-grid">
          <label>
            <span className="field-label">
              Minimum&nbsp;
              <Tooltip text="Beats Per Minute">
                BPM
              </Tooltip>
            </span>

            <input
              type="number"
              min={1}
              value={minBpm}
              onChange={event =>
                setMinBpm(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />
          </label>

          <label>
            <span className="field-label">
              Maximum&nbsp;
              <Tooltip text="Beats Per Minute">
                BPM
              </Tooltip>
            </span>

            <input
              type="number"
              min={1}
              value={maxBpm}
              onChange={event =>
                setMaxBpm(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />
          </label>

          <label>
            <span className="field-label">
              <Tooltip text="Beats Per Minute">
                BPM
              </Tooltip>
              &nbsp;Step
            </span>

            <input
              type="number"
              min={0.01}
              step={0.01}
              value={step}
              onChange={event =>
                setStep(
                  Number(
                    event.target.value,
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
              value={beatsPerBar}
              onChange={event => {
                const value =
                  Number(
                    event.target.value,
                  );

                setBeatsPerBar(value);

                if (
                  startBeat > value
                ) {
                  setStartBeat(value);
                }
              }}
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
              value={subdivision}
              onChange={event =>
                setSubdivision(
                  Number(
                    event.target.value,
                  ) as Subdivision,
                )
              }
            >
              <option value={1}>
                Beat
              </option>

              <option value={2}>
                1/2 Beat
              </option>

              <option value={4}>
                1/4 Beat
              </option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2>
          Start Position
        </h2>

        <p>
          Choose the musical position
          of the first hit point.
        </p>

        <div className="settings-grid settings-grid--small">
          <label>
            <span className="field-label">
              Start Bar
            </span>

            <input
              type="number"
              min={1}
              step={1}
              value={startBar}
              onChange={event =>
                setStartBar(
                  Number(
                    event.target.value,
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
              max={beatsPerBar}
              step={1}
              value={startBeat}
              onChange={event =>
                setStartBeat(
                  Number(
                    event.target.value,
                  ),
                )
              }
            />
          </label>
        </div>
      </section>

      <section>
        <div className="section-header">
          <h2>
            Hit Points
          </h2>

          <button
            type="button"
            onClick={addHitPoint}
          >
            + Add Hit Point
          </button>
        </div>

        {hitPoints.length === 0 ? (
          <div className="empty-state">
            <p>
              No hit points yet.
            </p>

            <p>
              Add at least two
              timecodes to calculate
              tempo matches.
            </p>
          </div>
        ) : (
          hitPoints.map(
            (hit, index) => (
              <div
                key={hit.id}
                className="hit-row"
              >
                <span>
                  {index + 1}
                </span>

                <input
                  value={
                    hit.timecode
                  }
                  placeholder="HH:MM:SS:FF"
                  aria-label={`Hit point ${index + 1} timecode`}
                  onChange={event =>
                    updateHitTimecode(
                      hit.id,
                      event.target.value,
                    )
                  }
                />

                <select
                  value={hit.snap}
                  aria-label={`Hit point ${index + 1} snap`}
                  onChange={event =>
                    updateHitSnap(
                      hit.id,
                      event.target
                        .value as HitSnap,
                    )
                  }
                >
                  <option value="any">
                    Any
                  </option>

                  <option value="beat">
                    Beat
                  </option>

                  <option value="downbeat">
                    Downbeat
                  </option>
                </select>

                <select
                  value={hit.weight}
                  aria-label={`Hit point ${index + 1} importance`}
                  onChange={event =>
                    updateHitWeight(
                      hit.id,
                      Number(
                        event.target
                          .value,
                      ) as HitWeight,
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
                  onClick={() =>
                    removeHitPoint(
                      hit.id,
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ),
          )
        )}
      </section>

      <section>
        <h2>
          Best Tempos
        </h2>

        {hitPoints.length < 2 ? (
          <p>
            Add at least two hit points
            to calculate tempo matches.
          </p>
        ) : results.length === 0 ? (
          <p>
            Check the timecodes and
            tempo settings.
          </p>
        ) : (
          results.map(
            (
              result,
              index,
            ) => (
              <article
                key={result.bpm}
              >
                <div className="result-header">
                  <div>
                    <strong>
                      #{index + 1}
                      {' — '}
                      {result.bpm}{' '}

                      <Tooltip text="Beats Per Minute">
                        BPM
                      </Tooltip>
                    </strong>

                    <div className="quality">
                      {formatQuality(
                        result.quality,
                      )}
                    </div>
                  </div>

                  <div className="result-metrics">
                    <span>
                      <Tooltip text="Root Mean Square Error">
                        RMSE
                      </Tooltip>
                      :{' '}
                      {(
                        result.rmse *
                        1000
                      ).toFixed(2)}{' '}

                      <Tooltip text="Milliseconds">
                        ms
                      </Tooltip>
                    </span>

                    <span>
                      Max Error:{' '}
                      {(
                        result.maxError *
                        1000
                      ).toFixed(2)}{' '}

                      <Tooltip text="Milliseconds">
                        ms
                      </Tooltip>
                    </span>
                  </div>
                </div>

                <div className="alignment-table">
                  <div className="alignment-row alignment-head">
                    <span>Hit</span>
                    <span>Position</span>
                    <span>Snap</span>
                    <span>Importance</span>
                    <span>Error</span>
                  </div>

                  {result.alignments.map(
                    (
                      alignment,
                      alignmentIndex,
                    ) => (
                      <div
                        className="alignment-row"
                        key={
                          alignment.hitId
                        }
                      >
                        <span>
                          #{alignmentIndex + 1}
                        </span>

                        <span>
                          Bar{' '}
                          {alignment.bar}
                          {' · '}
                          Beat{' '}
                          {formatPosition(
                            alignment.beatInBar,
                            alignment.subdivisionIndex,
                          )}
                        </span>

                        <span>
                          {formatSnap(
                            alignment.snap,
                          )}
                        </span>

                        <span>
                          {formatWeight(
                            alignment.weight,
                          )}
                        </span>

                        <span>
                          {alignment.error >= 0
                            ? '+'
                            : ''}

                          {(
                            alignment.error *
                            1000
                          ).toFixed(2)}{' '}

                          <Tooltip text="Milliseconds">
                            ms
                          </Tooltip>
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </article>
            ),
          )
        )}
      </section>

      <section className="help-section">
        <div className="help-header">
          <div>
            <h2>
              Help & Glossary
            </h2>

            <p>
              A quick explanation of
              the terms used in Film
              Tempo Finder.
            </p>
          </div>
        </div>

        <div className="help-grid">
          <article className="help-item">
            <h3>
              <Tooltip text="Beats Per Minute">
                BPM
              </Tooltip>
            </h3>

            <strong>
              Beats Per Minute
            </strong>

            <p>
              The tempo of the music.
              A higher BPM means beats
              happen more frequently.
              For example, 120 BPM
              means 120 beats every
              minute.
            </p>
          </article>

          <article className="help-item">
            <h3>
              <Tooltip text="Frames Per Second">
                FPS
              </Tooltip>
            </h3>

            <strong>
              Frames Per Second
            </strong>

            <p>
              The number of video
              frames displayed every
              second. It is used to
              convert film timecodes
              into precise times.
            </p>
          </article>

          <article className="help-item">
            <h3>
              <Tooltip text="Root Mean Square Error">
                RMSE
              </Tooltip>
            </h3>

            <strong>
              Root Mean Square Error
            </strong>

            <p>
              Measures the overall
              timing error between
              your hit points and the
              musical grid. Lower
              values are better.
            </p>
          </article>

          <article className="help-item">
            <h3>
              <Tooltip text="Milliseconds">
                ms
              </Tooltip>
            </h3>

            <strong>
              Milliseconds
            </strong>

            <p>
              One thousandth of a
              second. Timing errors
              are displayed in
              milliseconds.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Timecode
            </h3>

            <strong>
              <Tooltip text="Hours : Minutes : Seconds : Frames">
                HH:MM:SS:FF
              </Tooltip>
            </strong>

            <p>
              The timecode format used
              for each hit point.
            </p>

            <div className="timecode-example">
              <span>
                <b>HH</b>
                Hours
              </span>

              <span>
                <b>MM</b>
                Minutes
              </span>

              <span>
                <b>SS</b>
                Seconds
              </span>

              <span>
                <b>FF</b>
                Frames
              </span>
            </div>

            <p>
              For example,{' '}
              <code>
                00:01:23:12
              </code>{' '}
              means 1 minute,
              23 seconds and 12 frames.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Hit Resolution
            </h3>

            <strong>
              Musical grid precision
            </strong>

            <p>
              Beat allows only full
              beats. 1/2 Beat adds
              half-beats. 1/4 Beat
              adds quarter-beat
              positions.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Snap
            </h3>

            <strong>
              Hit alignment rule
            </strong>

            <p>
              Any uses the selected
              resolution. Beat forces
              the hit onto a full beat.
              Downbeat forces it onto
              the first beat of a bar.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Importance
            </h3>

            <strong>
              Hit point priority
            </strong>

            <p>
              Important and Critical
              hit points influence the
              tempo ranking more than
              Normal hit points.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Max Error
            </h3>

            <strong>
              Largest timing error
            </strong>

            <p>
              Shows the largest timing
              difference among all
              hit points for a tempo
              result.
            </p>
          </article>

          <article className="help-item">
            <h3>
              Time Signature
            </h3>

            <strong>
              Beats per bar
            </strong>

            <p>
              Defines the musical
              meter. 4/4 contains four
              beats per bar, while 3/4
              contains three.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;