# Film Tempo Finder

A browser-based tool for finding musical tempos that align with important hit points in film, animation, trailers, commercials, and other picture-based media.

Film Tempo Finder searches through a BPM range and finds tempos whose musical grid best matches the timecodes you provide.

No installation, backend, or account is required.

## Live Demo

https://aliajafari.github.io/film-tempo-finder/

## What is a Hit Point?

A hit point is a specific moment in a film where something important happens visually or dramatically.

Examples include:

- A cut
- An impact
- A door closing
- A character entering the frame
- A title appearing
- A camera movement
- An explosion
- An emotional or dramatic moment

When composing music to picture, it can be useful to find a tempo where several of these events naturally align with musical beats.

Film Tempo Finder helps calculate those tempos.

## Features

- SMPTE-style timecode input
- Multiple frame rates
- Configurable BPM search range
- Adjustable BPM search step
- Multiple time signatures
- Custom starting bar and beat
- Beat, half-beat, and quarter-beat resolution
- Per-hit snap rules
- Downbeat constraints
- Hit importance weighting
- Weighted RMSE ranking
- Maximum timing error
- Bar and beat position for each hit
- Timing error in milliseconds
- Built-in glossary and help
- Runs entirely in the browser

## Timecode Format

Hit points use the following format:

```text
HH:MM:SS:FF
```

Where:

```text
HH = Hours
MM = Minutes
SS = Seconds
FF = Frames
```

For example:

```text
00:01:23:12
```

means:

```text
1 minute
23 seconds
12 frames
```

The frame component depends on the selected FPS.

## How It Works

For every tempo in the selected BPM range, Film Tempo Finder creates a musical beat grid.

Each hit point is aligned with the nearest valid musical position according to its Snap setting.

The timing difference between the original film event and the musical position is calculated.

The candidate tempos are then ranked using a weighted Root Mean Square Error.

Lower timing error means better overall synchronization between the music and picture.

## Snap Modes

### Any

The hit may align with any position allowed by the selected Hit Resolution.

For example, with quarter-beat resolution:

```text
Beat 1
Beat 1 + 1/4
Beat 1 + 2/4
Beat 1 + 3/4
Beat 2
```

### Beat

The hit must align with a full musical beat.

### Downbeat

The hit must align with the first beat of a bar.

This can be useful for important structural or dramatic events.

## Hit Importance

Each hit point can have a different influence on the tempo search.

### Normal

Weight: `1`

Use for regular visual events.

### Important

Weight: `2`

Use for events that should have stronger musical alignment.

### Critical

Weight: `4`

Use for major cuts, impacts, transitions, or dramatic moments.

Critical hits influence the tempo ranking more strongly.

## Result Metrics

### BPM

**Beats Per Minute**

The tempo of the music.

### RMSE

**Root Mean Square Error**

RMSE represents the overall timing difference between your hit points and the musical grid.

Lower values are better.

### Max Error

The largest timing error among all hit points for a tempo result.

A tempo may have a good overall RMSE while still having one poorly aligned hit. Max Error makes that easier to identify.

### ms

**Milliseconds**

Timing differences are displayed in milliseconds for easier comparison.

## Time Signature

The Time Signature determines how many beats are grouped into each bar.

For example:

```text
4/4 = 4 beats per bar
3/4 = 3 beats per bar
5/4 = 5 beats per bar
```

## Hit Resolution

Hit Resolution determines the precision of the musical grid available to hits using the `Any` snap mode.

### Beat

Only full beats are available.

```text
1
2
3
4
```

### 1/2 Beat

Half-beat positions are also available.

```text
1
1 + 1/2
2
2 + 1/2
```

### 1/4 Beat

Quarter-beat positions are available.

```text
1
1 + 1/4
1 + 2/4
1 + 3/4
2
```

## Example

Imagine you have these film hit points:

```text
00:00:03:12
00:00:07:08
00:00:11:19
00:00:16:02
```

You can search a tempo range such as:

```text
60 BPM → 180 BPM
```

Film Tempo Finder tests tempos throughout the range and returns the best matches.

For each result it shows:

```text
BPM
RMSE
Maximum Error
Bar
Beat
Snap Type
Hit Importance
Timing Error
```

## Tech Stack

- React
- TypeScript
- Vite
- CSS
- GitHub Actions
- GitHub Pages

All calculations run entirely in the browser.

No data is sent to a server.

## Development

Clone the repository:

```bash
git clone https://github.com/aliajafari/film-tempo-finder.git
```

Enter the project directory:

```bash
cd film-tempo-finder
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Why This Exists

Finding tempos that naturally synchronize with visual events is a common problem when composing music to picture.

Existing hit-point and tempo calculators can be difficult to use or rely on older interfaces.

Film Tempo Finder aims to provide a small, modern, open-source alternative that runs directly in the browser.

## Roadmap

Possible future improvements:

- Automatic timecode formatting
- 23.976 FPS support
- 29.97 FPS support
- Drop-frame timecode
- Import and export hit points
- Shareable URLs
- Timeline visualization
- CSV export
- Local project saving
- Additional subdivisions
- Tempo map generation

## Contributing

Contributions are welcome.

If you find a bug, have an idea for improving the tempo-matching algorithm, or want to improve the user experience, feel free to open an issue or submit a pull request.

## License

MIT