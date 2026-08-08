export function formatTimecodeInput(
  value: string,
): string {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8);

  if (!digits) {
    return '';
  }

  const parts: string[] = [];

  for (
    let index = 0;
    index < digits.length;
    index += 2
  ) {
    parts.push(
      digits.slice(
        index,
        index + 2,
      ),
    );
  }

  return parts.join(':');
}

export function normalizeTimecode(
  value: string,
): string {
  const digits = value
    .replace(/\D/g, '')
    .slice(0, 8);

  if (!digits) {
    return '';
  }

  const padded =
    digits.padStart(8, '0');

  return [
    padded.slice(0, 2),
    padded.slice(2, 4),
    padded.slice(4, 6),
    padded.slice(6, 8),
  ].join(':');
}

export function isValidTimecode(
  timecode: string,
  fps: number,
): boolean {
  const match =
    /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/.exec(
      timecode,
    );

  if (!match) {
    return false;
  }

  const [
    ,
    ,
    minutes,
    seconds,
    frames,
  ] = match;

  return (
    Number(minutes) < 60 &&
    Number(seconds) < 60 &&
    Number(frames) < fps
  );
}

export function getTimecodeError(
  timecode: string,
  fps: number,
): string | null {
  if (!timecode) {
    return null;
  }

  const match =
    /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/.exec(
      timecode,
    );

  if (!match) {
    return null;
  }

  const [
    ,
    ,
    minutes,
    seconds,
    frames,
  ] = match;

  if (Number(minutes) >= 60) {
    return 'Minutes must be between 00 and 59.';
  }

  if (Number(seconds) >= 60) {
    return 'Seconds must be between 00 and 59.';
  }

  if (Number(frames) >= fps) {
    return `Frames must be between 00 and ${
      fps - 1
    } for ${fps} FPS.`;
  }

  return null;
}

export function timecodeToSeconds(
  timecode: string,
  fps: number,
): number {
  if (
    !isValidTimecode(
      timecode,
      fps,
    )
  ) {
    throw new Error(
      'Invalid timecode',
    );
  }

  const [
    hours,
    minutes,
    seconds,
    frames,
  ] = timecode
    .split(':')
    .map(Number);

  return (
    hours * 3600 +
    minutes * 60 +
    seconds +
    frames / fps
  );
}

export function secondsToTimecode(
  seconds: number,
  fps: number,
): string {
  const safeSeconds =
    Math.max(0, seconds);

  const totalFrames =
    Math.round(
      safeSeconds * fps,
    );

  const frames =
    totalFrames % fps;

  const totalSeconds =
    Math.floor(
      totalFrames / fps,
    );

  const secondsPart =
    totalSeconds % 60;

  const totalMinutes =
    Math.floor(
      totalSeconds / 60,
    );

  const minutes =
    totalMinutes % 60;

  const hours =
    Math.floor(
      totalMinutes / 60,
    );

  return [
    hours,
    minutes,
    secondsPart,
    frames,
  ]
    .map(value =>
      String(value).padStart(
        2,
        '0',
      ),
    )
    .join(':');
}