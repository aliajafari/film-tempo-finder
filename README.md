# 🎬 Film Tempo Finder

A browser-based tool for composers, film scorers, editors, and filmmakers to find musical tempos that align with important moments in picture.

Film Tempo Finder helps you find tempos where musical beats, bars, and cue starts naturally align with visual events — without manually trying dozens of BPM values.

It can be used for a single cue or to find a common tempo that works across multiple scenes in a project.

Everything runs directly in the browser.

Live demo: **https://aliajafari.github.io/film-tempo-finder/**

---

## ❤️ About the Project

Film scoring sits somewhere between mathematics, storytelling, timing, and instinct.

Synchronizing music to picture can involve a surprising amount of repetitive calculation — especially when trying to find tempos that work around several important moments.

Film Tempo Finder exists to make that part easier.

The goal is not to replace musical judgment. The goal is to handle the repetitive calculations so composers can spend more time composing.

The tool is open source, and contributions, ideas, bug reports, and Pull Requests are always welcome.

---

## ✨ Features

Film Tempo Finder currently provides two main workflows:

* **Find Tempo** — find the best BPM for a single cue.
* **Project Tempo** — find one BPM that works across multiple scenes.

---

## 🎵 Find Tempo

**Find Tempo** is designed for the traditional hit-point workflow.

You define the important picture events inside a cue and Film Tempo Finder searches for tempos whose musical grid aligns with those events.

You can define:

* Cue start timecode
* Frame rate
* Time signature
* Starting bar
* Starting beat
* Tempo search range
* Search step
* Hit resolution
* Hit points
* Hit alignment preference
* Hit priority

The tool searches the requested BPM range and returns the best matching tempos.

For every result you can see:

* BPM
* Beat number
* Bar / Beat position
* Timing error for every hit
* Overall timing error

This is useful when you already know the important moments in picture and want to find a tempo that naturally works around them.

### Example

Imagine your cue starts at:

```text
00:10:00:00
```

and you have three important hit points:

```text
Hit 1
00:10:08:12

Hit 2
00:10:17:04

Hit 3
00:10:24:18
```

You can search a tempo range such as:

```text
Minimum BPM: 60
Maximum BPM: 180
Step: 0.1
```

Film Tempo Finder evaluates the musical grid across that range and returns the best candidates.

You can then compare their BPM, musical positions, and timing errors before choosing the tempo that works best musically.

---

## 🎬 Project Tempo

**Project Tempo** is designed for situations where multiple scenes or sections should share a common musical tempo.

Instead of calculating each cue independently, you define several scenes and Film Tempo Finder searches for a BPM that provides the best overall rhythmic fit across the project.

Each scene can define:

* Scene In
* Scene Out
* Time signature
* Hit resolution
* Scene priority
* Optional internal hit points

The important difference is that scenes share the same BPM, but they do **not** need to share the same musical grid origin.

Film Tempo Finder calculates a recommended cue start for every scene.

For example:

```text
Project Tempo
124 BPM

Scene 1
00:20:00:00 → 00:23:00:00
Recommended Cue Start → 00:19:59:18

Scene 2
00:50:00:00 → 00:52:00:00
Recommended Cue Start → 00:49:59:21

Scene 3
01:04:12:00 → 01:06:40:00
Recommended Cue Start → 01:04:11:20
```

All three scenes use:

```text
124 BPM
```

but the musical grid can be positioned differently for each scene.

This makes it possible to maintain a stronger rhythmic relationship across a film, episode, trailer, commercial, or other picture-based project.

---

## 🎯 Hit Alignment

Not every picture event needs to land on the same type of musical position.

Each hit point can specify how it should align with the musical grid.

### Any Grid Position

The event may align with any available position allowed by the selected Hit Resolution.

This gives the tempo search the most flexibility.

### Full Beat

The event should align with a full musical beat.

For example:

```text
Bar 12 / Beat 1
Bar 12 / Beat 2
Bar 12 / Beat 3
Bar 12 / Beat 4
```

### First Beat of Bar

The event should align with the first beat of a bar.

This is commonly called the **downbeat**.

For example:

```text
Bar 12 / Beat 1
Bar 13 / Beat 1
Bar 14 / Beat 1
```

This can be useful for major structural events such as:

* Scene changes
* Reveals
* Large impacts
* Transitions
* Logo appearances
* Major cuts

---

## 🎚 Hit Resolution

Hit Resolution determines how fine the musical grid can be when matching picture events.

Available resolutions currently include:

```text
Full Beat
Half Beat
Quarter Beat
```

A finer resolution gives the algorithm more possible musical positions to match against.

For example, with a Quarter Beat resolution, a picture event does not necessarily need to land exactly on a full beat.

---

## ⚖️ Priority

Not every hit point or scene has the same importance.

Film Tempo Finder lets you assign different priorities:

```text
Normal
Important
Critical
```

Higher-priority events have more influence on the final tempo ranking.

For example:

```text
Small camera movement
Normal

Character entrance
Important

Major reveal
Critical
```

A tempo that aligns the major reveal closely may rank higher even if the small camera movement has slightly more timing error.

This allows the search to better reflect actual scoring decisions instead of treating every picture event equally.

---

## ⏱ Timecode

Film Tempo Finder uses standard picture timecode:

```text
HH:MM:SS:FF
```

where:

```text
HH = Hours
MM = Minutes
SS = Seconds
FF = Frames
```

Example:

```text
00:12:34:18
```

means:

```text
00 hours
12 minutes
34 seconds
18 frames
```

### Frame Rate

The currently supported frame rates are:

```text
24 fps
25 fps
30 fps
```

where **FPS** means **Frames Per Second**.

Timecode validation takes the selected frame rate into account.

For example, at 24 FPS:

```text
00:00:10:23
```

is valid, while:

```text
00:00:10:24
```

is not.

---

## 🧮 How It Works

At a given tempo, the duration of one musical beat is:

```text
Beat Duration = 60 / BPM
```

For example:

```text
120 BPM

60 / 120 = 0.5 seconds per beat
```

Film Tempo Finder uses this duration to construct a musical grid.

Each picture event is then compared against valid musical positions on that grid.

The valid positions depend on:

* BPM
* Cue start
* Time signature
* Hit resolution
* Alignment rules

The distance between the picture event and the selected musical position becomes the timing error.

The process is repeated across the requested BPM range.

The candidates are then ranked according to their weighted timing errors.

---

## 📊 Understanding the Results

### BPM

**BPM** means **Beats Per Minute**.

It represents the tempo of the musical grid.

For example:

```text
60 BPM
```

means one beat every second.

```text
120 BPM
```

means two beats every second.

### Beat

Beat # represents the continuous beat position relative to the selected musical starting point.

It can be useful for understanding where an event lands in the overall musical grid.

### Bar / Beat

This represents the musical position of an event.

For example:

```text
12 / 3
```

means:

```text
Bar 12
Beat 3
```

### Timing Error

Timing Error represents the difference between the picture event and the musical position it was matched to.

For example:

```text
+8.20 ms
```

means the musical position differs from the picture event by approximately 8.2 milliseconds.

Smaller values indicate tighter synchronization.

### Overall Error

Overall Error represents the combined timing error across the relevant picture events.

The calculation also takes event priority into account.

Lower values generally indicate a better rhythmic fit.

However, the mathematically best result is not necessarily the musically best result.

The results should be used as candidates rather than absolute answers.

---

## 🎼 Why Use Film Tempo Finder?

When composing music to picture, important visual events often need to feel connected to the musical pulse.

These events may include:

* Scene changes
* Cuts
* Character entrances
* Reveals
* Impacts
* Transitions
* Camera movements
* Dialogue moments
* Action beats
* Logo animations
* End points
* Important gestures

Finding an appropriate tempo manually often involves repeatedly changing the BPM and checking whether these events land close to useful beats or bars.

Film Tempo Finder automates that search.

Instead of asking:

> Which BPM should I try?

you can define the picture events and let the tool find useful tempo candidates.

---

## 🎥 Typical Workflow

A common scoring workflow might look like this:

```text
1. Spot the scene.
2. Identify important picture events.
3. Enter those events as hit points.
4. Define which hits are structurally important.
5. Choose a reasonable BPM search range.
6. Run the tempo search.
7. Compare the best candidates.
8. Choose the tempo that works best musically.
9. Fine-tune the cue inside your DAW.
```

Film Tempo Finder handles the mathematical search.

The composer still makes the musical decision.

---

## 🎬 Find Tempo vs Project Tempo

Use **Find Tempo** when:

* You are working on one cue.
* You know the important hit points.
* You want to discover which BPM fits those events best.
* You want control over where the musical grid starts.

Use **Project Tempo** when:

* You have multiple scenes.
* You want them to share a common BPM.
* Each scene may have a different musical starting point.
* You want to maintain rhythmic consistency across the project.

---

## 🛠 Tech Stack

Film Tempo Finder is built with:

* React
* TypeScript
* Vite
* CSS

There is currently no backend.

All calculations happen locally in the browser.

No project data needs to be sent to a server.

---

## 🚀 Running Locally

Clone the repository using SSH:

```bash
git clone git@github.com:aliajafari/film-tempo-finder.git
```

Or using HTTPS:

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

Vite will display the local development URL in your terminal.

Usually:

```text
http://localhost:5173
```

---

## 🏗 Building

Create a production build with:

```bash
npm run build
```

You can preview the production build locally with:

```bash
npm run preview
```

---

## 📁 Project Structure

The calculation logic is intentionally separated from the UI.

A simplified structure looks like:

```text
src/
├── lib/
│   ├── analyzeScene.ts
│   ├── findBestTempos.ts
│   ├── findProjectTempos.ts
│   ├── tempoGrid.ts
│   └── timecode.ts
│
├── App.tsx
├── types.ts
└── index.css
```

### `findBestTempos.ts`

Handles the single-cue **Find Tempo** workflow.

### `findProjectTempos.ts`

Searches for a common tempo across multiple scenes.

### `analyzeScene.ts`

Analyzes how a scene fits a particular tempo.

### `tempoGrid.ts`

Contains shared musical-grid calculations.

### `timecode.ts`

Handles timecode parsing, formatting, validation, and conversion.

---

## 🤝 Contributing

Contributions are very welcome.

Film Tempo Finder is intended to be an open-source tool that can improve through feedback from composers, developers, editors, filmmakers, and other people working with music and picture.

You can contribute by:

* Fixing bugs
* Improving UI / UX
* Improving tempo calculations
* Improving hit-point calculations
* Improving Project Tempo
* Adding frame rates
* Adding time signatures
* Improving timecode handling
* Improving accessibility
* Adding tests
* Improving documentation
* Adding new scoring workflows
* Adding synchronization tools
* Improving performance
* Refactoring calculation logic

### 🔀 Pull Requests Are Welcome

If you see something that can be improved, feel free to fork the project, make your changes, and open a Pull Request.

The main repository is:

https://github.com/aliajafari/film-tempo-finder

First, fork the repository on GitHub.

Then clone your fork:

```bash
git clone git@github.com:YOUR_USERNAME/film-tempo-finder.git
```

Enter the project:

```bash
cd film-tempo-finder
```

Create a branch:

```bash
git checkout -b feature/my-improvement
```

Make your changes and stage them:

```bash
git add .
```

Commit your changes:

```bash
git commit -m "feat: add my improvement"
```

Push your branch:

```bash
git push origin feature/my-improvement
```

Then open a Pull Request against:

```text
aliajafari/film-tempo-finder
```

Some example commit messages:

```text
feat: add 23.976 fps support

fix: correct timecode validation

docs: improve project tempo explanation

refactor: simplify tempo grid calculation
```

If you're planning a large feature or a significant change to the calculation engine, opening an Issue first is recommended so the approach can be discussed before implementation.

---

## 💡 Feature Requests

Have an idea that could make Film Tempo Finder more useful?

Open an Issue:

https://github.com/aliajafari/film-tempo-finder/issues

Ideas around these areas are especially welcome:

* Film scoring workflows
* Tempo mapping
* Hit-point calculations
* Cue placement
* Project-level tempo analysis
* Timecode
* Musical grids
* DAW workflows
* Import / export
* MIDI
* Marker import
* Marker export
* Additional frame rates
* Additional time signatures
* Tempo maps
* Variable tempo
* Synchronization workflows

---

## 🐛 Bug Reports

If something doesn't look right, please open an Issue.

When possible, include:

* FPS
* BPM range
* Search step
* Cue start
* Hit points
* Time signature
* Hit resolution
* Expected result
* Actual result

If the issue is related to Project Tempo, also include:

* Scene In
* Scene Out
* Scene Priority
* Internal Hit Points

Reproducible examples make debugging much easier.

---

## 🗺 Possible Future Improvements

Some ideas for future versions include:

* 23.976 FPS support
* 29.97 FPS support
* Drop-frame timecode
* More time signatures
* Triplet subdivisions
* Custom subdivisions
* Tempo maps
* Variable-tempo calculations
* Scene groups
* Cue markers
* MIDI export
* CSV import / export
* DAW marker export
* Marker import from editing software
* Better project visualization
* Timeline visualization
* Musical grid visualization
* Save / load projects
* Shareable project files
* More advanced weighting
* Better result comparison
* Automated tests for tempo calculations

These are ideas rather than a fixed roadmap.

---

## ⚠️ Project Status

Film Tempo Finder is currently an experimental open-source project.

The calculations can be useful during spotting, composition, and synchronization, but the results should be treated as musical suggestions rather than strict rules.

A mathematically perfect synchronization point may not produce the best musical result.

Likewise, a tempo with slightly more timing error may feel considerably better for the scene.

Film Tempo Finder helps narrow the search.

The final decision belongs to the composer.

---

## 🔒 Privacy

Film Tempo Finder currently runs entirely in the browser.

Your:

* Timecodes
* Hit points
* Scene information
* Tempo searches

are processed locally.

There is currently no backend required for tempo calculations.

---

## ⭐ Support the Project

If Film Tempo Finder is useful to you:

* ⭐ Star the repository
* Share it with composers and filmmakers
* Report bugs
* Suggest new features
* Improve the documentation
* Open a Pull Request

Repository:

https://github.com/aliajafari/film-tempo-finder

---

## 📄 License

This project is open source.

See the `LICENSE` file for licensing details.

---

**Film Tempo Finder**

*Find the pulse behind the picture.*
