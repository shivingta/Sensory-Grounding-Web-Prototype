# Mannkaa 5-4-3-2-1 Somatic Grounding Tool
## Technical Architecture & Developer Specification

**Product**: Mannkaa Self Care — 5-4-3-2-1 Sensory Grounding Tool  
**Document Version**: 1.0.0  
**Target Audience**: Frontend Engineers, Mobile Engineers, Clinical UX Designers  
**Repository Runtime**: React 19 + TypeScript + Vite + Tailwind CSS v4  

---

## 1. Executive Summary & Flow

The **Mannkaa 5-4-3-2-1 Sensory Grounding Tool** is a mobile-first, clinical somatic application designed to down-regulate acute nervous system distress through bilateral sensory orienting.

### 7-Stage Somatic Flow:
1. **Stage 1 (Baseline Distress Check-in)**: User rates current distress on a 1–5 scale with tactile feedback and sound cue.
2. **Stage 2 (Step 5 · Sight Awareness)**: 5 orbital visual anchors with optical glow.
3. **Stage 3 (Step 4 · Physical Touch)**: 4 tactile contact points with responsive haptics.
4. **Stage 4 (Step 3 · Ambient Sound)**: 3 ambient auditory layers.
5. **Stage 5 (Step 2 · Subtle Scent)**: 2 olfactory respiratory cues.
6. **Stage 6 (Step 1 · Presence & Taste)**: 1 centered focal point.
7. **Stage 7 (Somatic Shift Summary)**: 3 post-session feeling states, Vagal Status badge, calculated % distress down-regulation, mindful dwell metrics, and PostHog analytics.

---

## 2. Technical Stack & Dependencies

| Layer | Package / Technology | Version | Architectural Responsibility |
|:---|:---|:---|:---|
| **Core Framework** | `react` / `react-dom` | `^19.0.1` | Concurrent root, functional hooks, reactive state machine |
| **Build Tooling** | `vite` | `^8.3.0` | Hot Module Replacement (HMR), ESM bundler, dev server (`:3000`) |
| **Language** | `typescript` | `^7.0.2` | Strict mode typing across states, metrics, and DOM Web APIs |
| **CSS Framework** | `tailwindcss` | `^4.3.3` | Tailwind v4 engine via `@tailwindcss/vite` |
| **Motion Physics** | `motion` (`framer-motion`) | `^12.23.24` | Spring physics (`stiffness: 120, damping: 25`), SVG ring animations |
| **Iconography** | `lucide-react` | `^0.546.0` | Crisp SVG symbols (Microphone, Waves, Volume, Bell, Sparkle) |
| **Chimes & Ambience**| Native Web Audio API | Standard | Zero external asset lag: Procedural sound synthesis |
| **Spoken Guide** | Native Web Speech API | Standard | SpeechSynthesis with promise-based non-blocking queue |
| **Tactile Engine** | Navigator Vibration API| Standard | Clinical micro-haptic patterns (`navigator.vibrate`) |

---

## 3. Directory Layout & Key Modules

```text
/
├── index.html                  # Entry HTML (viewport, meta tags, Plus Jakarta Sans)
├── package.json                # Dependencies, scripts: dev, build, lint
├── tsconfig.json               # Strict TypeScript config
├── vite.config.ts              # Vite 8 config with Tailwind v4 & React plugins
└── src/
    ├── main.tsx                # React 19 createRoot mount
    ├── index.css               # Global theme tokens, scrollbar utilities, reset
    ├── App.tsx                 # Master state machine, 7-stage flow controller, settings modal
    ├── components/
    │   └── SomaticCore.tsx     # Orbital anchor nodes, breathing orb, hold-vs-tap deduplicator
    └── logic/
        ├── somaticNarrator.ts  # Promise speech sequencer & 3-tone vocal pacing profiles
        ├── ambientAudio.ts     # Procedural Web Audio API synthesizer (Ocean Waves & Gentle Rain)
        └── groundingMachine.ts # Clinical state types, dwell time calculator, PostHog telemetry
```

---

## 4. Deep-Dive: Core Technical Implementations

### 4.1 Speech Sequencing & Audio Cutoff Prevention (`somaticNarrator.ts`)
Standard browser `window.speechSynthesis` can cancel in-flight audio when new speech calls trigger. To prevent anchor prompts from interrupting step introductions:
- **`speakSequence(phrases)`**: A chained Promise sequencer. The step description plays completely $\rightarrow$ catches `utterance.onend` $\rightarrow$ waits for a 650ms somatic breath pause $\rightarrow$ speaks `Anchor 1`.
- **Tone Calibration (`VoiceTone`)**:
  - `soft_meditative`: `rate: 0.80`, `pitch: 0.92`, `volume: 0.85` (Warm whispered cadence).
  - `gentle_calm`: `rate: 0.84`, `pitch: 0.96`, `volume: 0.90` (Unhurried grounding).
  - `clear_grounded`: `rate: 0.88`, `pitch: 1.00`, `volume: 0.95` (Steady presence).
- **Completion Safety**: On completing the final anchor of a stage, `somaticNarrator.speak(`${config.title} grounded and complete`, { onEnd })` ensures the affirmation is fully heard before transitioning the screen.

### 4.2 Central Somatic Core & Event Deduplication (`SomaticCore.tsx`)
- **Orbital Spatial Math**: Nodes are projected dynamically on a 124px radial orbit:
  $$x = \cos\left(\frac{i}{\text{total}} \cdot 2\pi - \frac{\pi}{2}\right) \cdot r, \quad y = \sin\left(\frac{i}{\text{total}} \cdot 2\pi - \frac{\pi}{2}\right) \cdot r$$
- **Hold vs. Tap Architecture**:
  - `onPointerDown`: Starts hold timer and animates an SVG `strokeDashoffset` circular ring over 1200ms.
  - If held to 1200ms: Marks `holdTriggeredRef.current = true` and completes anchor via `'hold'`.
  - `onPointerUp`: Cancels timer and resets visual ring without triggering an extra tap.
  - `onClick`: Checks if `holdTriggeredRef.current` was already satisfied. If not, completes anchor via `'tap'`. This eliminates double-counting race conditions across mouse and touch inputs.

### 4.3 Procedural Audio Synthesis (`ambientAudio.ts` & `App.tsx`)
- **Zero MP3/WAV Dependencies**: No external audio files to fetch or buffer over mobile networks.
- **Ocean Waves**: Dynamically generates an `AudioBufferSourceNode` with pink noise, modulated by a 0.12Hz `OscillatorNode` (LFO) through a low-pass `BiquadFilterNode` to simulate rolling tidal surges.
- **Harmonic Chimes**: Synthesizes pure sine tones (`261.63Hz` to `523.25Hz`) with exponential gain decay (`0.0001` over `1.8s`) for anchor completion feedback.

### 4.4 Clinical Metrics & Telemetry (`groundingMachine.ts`)
- **Somatic Shift Delta**: Calculates initial distress vs. post-checkin rating, producing an estimated post-score and vagal downregulation percentage.
- **Pacing Evaluation**: Evaluates average dwell time per anchor ($>3.5\text{s}$ indicates optimal vagal braking).
- **PostHog Telemetry**: Formats structured event payloads (`grounding_session_started`, `grounding_step_completed`, `somatic_anchor_activated`, `grounding_tool_completed`) logged in JSON format.

---

## 5. Local Setup & Execution Guide

### Prerequisites
- Node.js 18.0.0 or higher (v20+ LTS recommended)
- npm, yarn, or pnpm

### Quickstart Commands
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Type check & lint
npm run lint

# 4. Production build
npm run build

# 5. Preview production build
npm run preview
```

Server binds to `http://localhost:3000`.

---

## 6. Design System Tokens

- **Canvas Background**: Deep Slate / Midnight (`#061826`)
- **Card Surfaces**: `#081E2E`, `#0D2D44`
- **Border Accents**: `#1A4666`, `#24324D`
- **Primary Action (Emerald)**: `#1DBB8E`
- **Secondary Accent (Cyan)**: `#2DD4BF`
- **Touch Viewport**: Centered mobile viewport emulation (`max-w-[390px]`, `min-h-[844px]`) matching modern iPhone dimensions.
