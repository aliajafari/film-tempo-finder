export function timecodeToSeconds(
  timecode: string,
  fps: number,
): number {
  const parts = timecode.split(':').map(Number);

  if (parts.length !== 4) {
    throw new Error(
      'Timecode must use HH:MM:SS:FF format',
    );
  }

  const [hours, minutes, seconds, frames] = parts;

  if (
    [hours, minutes, seconds, frames].some(
      value => Number.isNaN(value) || value < 0,
    )
  ) {
    throw new Error('Invalid timecode');
  }

  if (minutes >= 60 || seconds >= 60) {
    throw new Error('Invalid timecode');
  }

  if (frames >= fps) {
    throw new Error(
      `Frame must be smaller than ${fps}`,
    );
  }

  return (
    hours * 3600 +
    minutes * 60 +
    seconds +
    frames / fps
  );
}