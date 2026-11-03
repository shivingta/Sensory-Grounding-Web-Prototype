# Mannkaa 5-4-3-2-1 Sensory Grounding Tool
## Web Frontend Developer Requirements & Implementation Specification

**Product**: Mannkaa Self Care — 5-4-3-2-1 Sensory Grounding Tool  
**Platform**: Web Desktop & Responsive Web (Tailwind CSS v4 + React 19 + TypeScript + Motion)  
**Document Version**: 2.0.0  
**Target Audience**: Frontend Engineers, Full-Stack Developers, UX/UI Designers  

---

## 1. Executive Summary & Design System

The **Mannkaa 5-4-3-2-1 Sensory Grounding Tool** is a clinically grounded, responsive web application designed to help patients down-regulate sympathetic nervous system activation through bilateral orienting across the 5 senses.

### 1.1 Color Tokens & Visual Identity
| Token Name | Hex Code | Tailwind / RGBA Equivalent | Usage |
|:---|:---|:---|:---|
| **Deep Void Canvas** | `#061826` | `bg-[#061826]` | Global page background |
| **Card Surface** | `#0A2436` | `bg-[#0A2436]` | Interactive cards, modals, container boxes |
| **Inner Stage / Well**| `#081E2E` | `bg-[#081E2E]` | Motion graphic canvas, anchor node background |
| **Subtle Border** | `#1A4666` | `border-[#1A4666]` | Standard borders and dividers |
| **Primary Clinical Teal**| `#1DBB8E` | `text-[#1DBB8E]`, `bg-[#1DBB8E]`| Primary CTA buttons, checkmarks, completion states |
| **Somatic Cyan Accent**| `#2DD4BF` | `text-[#2DD4BF]`, `border-[#2DD4BF]`| Active halos, breathing indicators, active badges |
| **Library Card Teal** | `#85D7D1` | `bg-[#85D7D1]`, `hover:bg-[#72CFC9]`| Self Care Library card background |
| **Library Dark Text** | `#0F2942` | `text-[#0F2942]` | Typography on Library card buttons |
| **Muted Slate Body** | `#7E9EB8` | `text-[#7E9EB8]` | Secondary copy, timers, sensory captions |

### 1.2 Sensory Stage Themes
Each of the 5 senses has a unique semantic color, icon, and dynamic anchor label:
- **Step 5 · Sight (5 things)**: `#2DD4BF` (Cyan/Teal), Icon: `Eye`, Label: `"Sight Anchor"`
- **Step 4 · Touch (4 things)**: `#38BDF8` (Sky Blue), Icon: `Hand`, Label: `"Touch Anchor"`
- **Step 3 · Sound (3 things)**: `#818CF8` (Soft Indigo), Icon: `Ear`, Label: `"Sound Anchor"`
- **Step 2 · Smell (2 things)**: `#34D399` (Emerald), Icon: `Wind`, Label: `"Scent Anchor"`
- **Step 1 · Taste (1 thing)**: `#FB7185` (Coral Rose), Icon: `TongueIcon`, Label: `"Taste Anchor"`

---

## 2. Web Layout Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  Top Navigation Bar (Mannkaa Logo, Dashboard, Appointments, Self Care, Profile)         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Breadcrumb & Header Controls: "Self Care Library" → Grounding, Audio Mute, Settings   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│   DESKTOP 2-COLUMN SOMATIC WORKSPACE (grid grid-cols-1 lg:grid-cols-2 gap-6)           │
│                                                                                        │
│   ┌───────────────────────────────────┐    ┌───────────────────────────────────┐       │
│   │  LEFT COLUMN (Motion Canvas)      │    │  RIGHT COLUMN (Interactive Flow)  │       │
│   │                                   │    │                                   │       │
│   │  SCREEN 1: Pre-Checkin            │    │  SCREEN 1: Distress Check-in      │       │
│   │  • Auto-active 4-4-4-2 breathing  │    │  • 2 Conversational sentences     │       │
│   │    pacer (no manual click needed) │    │  • 1–5 Intensity Rating buttons   │       │
│   │  • Ready When You Are guidance    │    │  • Ocean Waves audio starts       │       │
│   │                                   │    │  • "Begin Grounding" CTA          │       │
│   │  ───────────────────────────────  │    │  ───────────────────────────────  │       │
│   │  SCREEN 2: Stepper Stages         │    │  SCREEN 2: Anchor Checklist       │       │
│   │  • Centered Step X of 5 Header    │    │  • Instruction Line 1 & Line 2    │       │
│   │  • Clean 200px SVG Progress Arc   │    │  • Clickable Anchor cards (1..N)  │       │
│   │  • Central Sensory Graphic Canvas │    │  • Auto-advances voice cues       │       │
│   │    (Iris, Touch, Sound, Mist,     │    │  • Replay Voice / Skip / Next CTA │       │
│   │     Tongue/Palate Waves)          │    │                                   │       │
│   │  • Spacebar hotkey support        │    │                                   │       │
│   │  • Subtle bottom breathing pill   │    │                                   │       │
│   │                                   │    │                                   │       │
│   │  ───────────────────────────────  │    │  ───────────────────────────────  │       │
│   │  SCREEN 3: Session Complete       │    │  SCREEN 3: Somatic Shift Delta    │       │
│   │  • Equilibrium Restored icon      │    │  • Feeling selection              │       │
│   │  • Autonomic calming metrics      │    │  • Calculated % distress relief   │       │
│   └───────────────────────────────────┘    └───────────────────────────────────┘       │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Screen Specifications

### 3.1 Self Care Library (`screen === 'library'`)
- **Card Styling**: 
  ```tsx
  className="w-full text-left p-6 sm:p-7 rounded-3xl bg-[#85D7D1] hover:bg-[#72CFC9] transition-all duration-300 shadow-xl hover:shadow-2xl cursor-pointer"
  ```
- **Card Icon**: Displays `<GroundingTreeIcon className="w-14 h-14 md:w-16 md:h-16" />`.
- **Card Title**: `"5-4-3-2-1 Sensory Grounding"`.
- **Card Description**: `"Somatic nervous system reset using your five senses"`.
- **Trailing Action**: Circular chevron button (`bg-[#0F2942]/10 p-3 rounded-2xl`).
- **No Pill Badges**: To keep visual consistency with "Breathing Exercises", do not display pill tags or clinical somatic badges on this card.

### 3.2 Stage 1: Baseline Check-in (`screen === 'pre_checkin'`)
- **Immediate Ambient Audio**: Ocean waves procedural sound starts automatically upon entering this screen.
- **Left Column**:
  - Contains `<CenteringBreathPacer size="md" state="active" interactive={false} />`.
  - Starts automatically without requiring any user click.
  - Smooth 4-4-4-2 cycle: Inhale (4s) $\rightarrow$ Hold (4s) $\rightarrow$ Exhale (4s) $\rightarrow$ Rest (2s).
  - Displays `"Ready When You Are"`, `"Follow the calming breathing rhythm as you prepare to anchor with your five senses."`
- **Right Column**:
  - Conversational Therapist Guidance:
    1. `"Take a breath. Let's ground together."`
    2. `"Grounding brings your attention gently back into the room around you."`
    3. `"Rate how intense your distress feels right now, then we'll step through your five senses."`
  - 1–5 Distress Scale Buttons (`Mild` = 1, `Medium` = 3, `Severe` = 5).
  - Primary Action Button: `"Begin 5-4-3-2-1 Grounding"`.

### 3.3 Stage 2 to 6: 5 Senses Stepper (`screen === 'stepper'`)
- **Header**:
  - Keeps `"Step X of 5"` centered with no icon next to it to avoid clutter.
  - Right tools: Ambient sound volume toggle (`Volume2` / `VolumeX`), Settings gear modal trigger.
- **Left Column (`SenseMotionVisual.tsx`)**:
  - **Ambient Halo**: Soft breathing glow ring (`blur-3xl`, opacity 0.15–0.35, scale 1.0–1.25) behind the orb.
  - **Circular Progress Arc**: 200x200 SVG with radius 92 and strokeDasharray `578`. Fills dynamically based on `completedCount / targetCount`.
  - **Sensory Motion Graphics inside Central Orb**:
    1. **Sight**: 3 concentric expanding iris circles rotating over 5–7s.
    2. **Touch**: 3 tactile rounded rectangles with morphing `borderRadius` (30% to 48%).
    3. **Sound**: 7 equalizer audio bars with staggered height animations (14px to 58px).
    4. **Smell**: 3 upward floating mist bubbles drifting with oscillating x-axis offsets.
    5. **Taste**: 3 palate resting waves with the custom `<TongueIcon />` centered in `#FB7185`.
  - **Spacebar Shortcut**: Pressing `Space` registers the next incomplete anchor node.
  - **Dynamic Anchor Label**: Displays `theme.anchorLabel` ("Sight Anchor", "Touch Anchor", "Sound Anchor", "Scent Anchor", "Taste Anchor") instead of hardcoded breath anchor.
  - **Bottom Breath Guidance**: A subtle, non-distracting pill: `Breathing Pace: Inhale (4s)` / `Exhale (4s)`.
- **Right Column (Interactive Checklist & Guidance)**:
  - Dynamic Two-line instruction header:
    - Sight: `"Look around your physical space"` / `"Notice 5 things you can see"`
    - Touch: `"Feel your body supported where you are"` / `"Notice 4 things you can physically feel"`
    - Sound: `"Close your eyes or soften your gaze"` / `"Notice 3 sounds around you"`
    - Smell: `"Take an unhurried breath in"` / `"Notice 2 scents in the air"`
    - Taste: `"Rest your tongue on the floor of your mouth"` / `"Notice 1 taste or sensation"`
  - Interactive anchor cards: Clicking marks item complete, triggers harmonic chime, and advances to the next incomplete anchor.
  - **Auto-Voiced Guidance**: When arriving at a step, the step prompt is voiced automatically, followed by the first anchor cue (`firstAnchorCue`).

### 3.4 Stage 7: Post-Session Summary (`screen === 'post_summary'`)
- **Left Column**: Green checkmark circle with `"Equilibrium Restored"` and calming autonomic response text.
- **Right Column**:
  - Post-feeling prompt: `"How do you feel in your body right now?"` (Options: Grounded & Present, Calmer / Lighter, More Focused, Still Settling).
  - Somatic Shift Delta: Shows initial distress (e.g., 4/5) $\rightarrow$ final estimated distress (e.g., 2/5) with percentage improvement.
  - Vagal Downregulation Status badge (`"Optimal Vagal Regulation"`).
  - Session dwell time and anchors recorded summary.
  - CTA: `"Complete Session & Return to Library"`.

---

## 4. Key React TypeScript Components for Web

### 4.1 GroundingTreeIcon Component (`src/components/GroundingTreeIcon.tsx`)
Responsive SVG wrapping the clinical 5-stage sensory tree with interactive node scaling:

```tsx
import React from 'react';

export interface GroundingTreeIconProps {
  className?: string;
  activeStageId?: 'sight' | 'touch' | 'sound' | 'smell' | 'taste' | null;
}

export const GroundingTreeIcon: React.FC<GroundingTreeIconProps> = ({
  className = 'w-12 h-12 md:w-16 md:h-16',
  activeStageId = null,
}) => {
  const getBadgeStyle = (stage: string) => {
    if (activeStageId === stage) {
      return {
        transform: 'scale(1.18)',
        transformOrigin: 'center',
        filter: 'drop-shadow(0 0 10px rgba(45, 212, 191, 0.9))',
        transition: 'all 0.3s ease-in-out',
      };
    }
    return {
      transition: 'all 0.3s ease-in-out',
    };
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="100%"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain overflow-visible"
      >
        {/* Grounding Tree Trunk & Canopy Paths */}
        <g id="tree-structure">
          <path
            d="M250 420 C250 330, 240 280, 210 230 C190 195, 170 170, 150 140"
            stroke="#1DBB8E"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M250 420 C250 330, 260 280, 290 230 C310 195, 330 170, 350 140"
            stroke="#1DBB8E"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d="M250 310 L250 120"
            stroke="#2DD4BF"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M220 250 C180 230, 150 240, 110 260"
            stroke="#38BDF8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            d="M280 250 C320 230, 350 240, 390 260"
            stroke="#818CF8"
            strokeWidth="6"
            strokeLinecap="round"
          />
        </g>

        {/* Sensory Badges with Dynamic Stage Highlighting */}
        {/* 1. SIGHT - EYE */}
        <g id="badge-sight-eye" style={getBadgeStyle('sight')}>
          <circle cx="150" cy="140" r="32" fill="#061826" stroke="#2DD4BF" strokeWidth="4" />
          <path d="M136 140 Q150 128 164 140 Q150 152 136 140 Z" stroke="#2DD4BF" strokeWidth="3" fill="none" />
          <circle cx="150" cy="140" r="4" fill="#2DD4BF" />
        </g>

        {/* 2. TOUCH - HAND */}
        <g id="badge-touch-hand" style={getBadgeStyle('touch')}>
          <circle cx="110" cy="260" r="30" fill="#061826" stroke="#38BDF8" strokeWidth="4" />
          <path d="M102 268 V255 M107 268 V250 M112 268 V252 M117 268 V257" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
        </g>

        {/* 3. AUDITORY - EAR */}
        <g id="badge-auditory-ear" style={getBadgeStyle('sound')}>
          <circle cx="390" cy="260" r="30" fill="#061826" stroke="#818CF8" strokeWidth="4" />
          <path d="M384 254 C384 246, 396 246, 396 256 C396 264, 388 266, 388 272" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {/* 4. SMELL - NOSE */}
        <g id="badge-smell-nose" style={getBadgeStyle('smell')}>
          <circle cx="350" cy="140" r="32" fill="#061826" stroke="#34D399" strokeWidth="4" />
          <path d="M346 132 C354 132, 356 144, 356 148 C353 152, 344 152, 344 148" stroke="#34D399" strokeWidth="3" strokeLinecap="round" fill="none" />
        </g>

        {/* 5. TASTE - TONGUE / PALATE */}
        <g id="badge-taste-tongue" style={getBadgeStyle('taste')}>
          <circle cx="250" cy="110" r="34" fill="#061826" stroke="#FB7185" strokeWidth="4" />
          <path d="M242 108 C242 102, 258 102, 258 108 C258 120, 242 120, 242 108 Z" stroke="#FB7185" strokeWidth="3" fill="#FB7185" fillOpacity="0.3" />
        </g>
      </svg>
    </div>
  );
};
```

### 4.2 Tongue & Palate Icon Component (`src/components/TongueIcon.tsx`)
```tsx
import React from 'react';

export function TongueIcon({ className = 'w-6 h-6', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      {/* Upper Lip / Palate arch */}
      <path d="M4 10 Q12 6 20 10" />
      {/* Gentle open mouth line */}
      <path d="M5 11 Q12 18 19 11" />
      {/* Relaxed tongue resting on floor */}
      <path d="M8 12 C8 17, 16 17, 16 12" fill="currentColor" fillOpacity="0.2" />
      {/* Tongue center median groove */}
      <path d="M12 12 V15" />
    </svg>
  );
}
```

### 4.3 Centering Breath Pacer (`src/components/CenteringBreathPacer.tsx`)
Starts automatically with smooth 4-4-4-2 rhythm:

```tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkle } from 'lucide-react';

export type BreathPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Rest';

export const CenteringBreathPacer: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('Inhale');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;
        let nextDuration = 4;
        setCurrentPhase((p) => {
          if (p === 'Inhale') { nextDuration = 4; return 'Hold'; }
          if (p === 'Hold') { nextDuration = 4; return 'Exhale'; }
          if (p === 'Exhale') { nextDuration = 2; return 'Rest'; }
          nextDuration = 4; return 'Inhale';
        });
        return nextDuration;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
      {/* Outer Glow Ring */}
      <motion.div
        animate={
          currentPhase === 'Inhale'
            ? { scale: 1.35, opacity: 0.5 }
            : currentPhase === 'Hold'
            ? { scale: [1.35, 1.37, 1.35], opacity: [0.5, 0.6, 0.5] }
            : { scale: 1.0, opacity: 0.18 }
        }
        transition={{ duration: currentPhase === 'Rest' ? 2 : 4, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none bg-gradient-to-tr from-[#1FB99D]/40 to-[#2DD4BF]/50"
      />

      {/* Middle Fluid Dashed Ring */}
      <motion.div
        animate={
          currentPhase === 'Inhale'
            ? { scale: 1.25, rotate: 90, opacity: 0.85 }
            : currentPhase === 'Hold'
            ? { scale: [1.25, 1.28, 1.25], opacity: [0.85, 1, 0.85] }
            : { scale: 0.92, rotate: 180, opacity: 0.35 }
        }
        transition={{ duration: currentPhase === 'Rest' ? 2 : 4, ease: [0.4, 0, 0.2, 1] }}
        className="absolute inset-4 rounded-full border-2 border-dashed border-[#2DD4BF]/50 pointer-events-none"
      />

      {/* Core Badge */}
      <div className="relative z-20 w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-[#0D2D44] via-[#071521] to-[#041B2D] border-2 border-[#2DD4BF]/70 flex flex-col items-center justify-center p-3 text-center shadow-2xl">
        <Sparkle className="w-8 h-8 text-[#2DD4BF] animate-pulse" />
        <span className="font-extrabold text-white tracking-widest uppercase mt-1.5 text-[11px]">
          {currentPhase}
        </span>
        <span className="font-semibold text-[#1FB99D] tracking-wider uppercase text-[9px]">
          {secondsLeft}s
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] mt-1 shadow-[0_0_6px_#2DD4BF]" />
      </div>
    </div>
  );
};
```

---

## 5. ElevenLabs Audio & Narration Specifications

### 5.1 Voice Generation Settings
- **Voice Name**: Nicole / Rachel (Warm, maternal, unhurried British or Mid-Atlantic clinician)
- **Model**: Eleven Multilingual v2
- **Stability**: `0.65` (Natural variation without emotional volatility)
- **Clarity / Similarity Boost**: `0.85` (Crisp articulation for patients with auditory distress)
- **Style Exaggeration**: `0.00` (Calm, grounding, steady)
- **Output Format**: MP3, 44.1kHz, 128kbps

### 5.2 Voice Script Matrix & Triggers
| Audio ID | Stage / Step | Script Text | Trigger Moment |
|:---|:---|:---|:---|
| `pre_checkin` | Stage 1 (Check-in) | *"Take a breath. Let's ground together. Rate how intense your distress feels right now, then we'll step through your five senses."* | Plays when Pre-checkin screen loads (with ocean waves) |
| `step_5` | Sight (Step 1/5) | *"Look around your physical space. Notice five things you can see."* | Step loads $\rightarrow$ immediately followed by Cue 1 |
| `step_4` | Touch (Step 2/5) | *"Feel your body supported where you are. Notice four things you can physically feel."* | Step loads $\rightarrow$ immediately followed by Cue 1 |
| `step_3` | Sound (Step 3/5) | *"Close your eyes or soften your gaze. Notice three sounds around you."* | Step loads $\rightarrow$ immediately followed by Cue 1 |
| `step_2` | Smell (Step 4/5) | *"Take an unhurried breath in. Notice two scents in the air."* | Step loads $\rightarrow$ immediately followed by Cue 1 |
| `step_1` | Taste (Step 5/5) | *"Rest your tongue on the floor of your mouth. Notice one taste or sensation."* | Step loads $\rightarrow$ immediately followed by Cue 1 |
| `session_complete`| Stage 7 (Summary) | *"Well done. Your nervous system has settled into safety and presence. Notice how your body feels right now."* | Summary screen mounts |

---

## 6. Procedural Ambient Web Audio API (`ambientAudio.ts`)

To ensure zero buffering latency and 100% offline reliability, ambient sound is synthesized procedurally using native Web Audio:

```typescript
// Ocean Waves Synthesizer using Pink Noise & Low Frequency Oscillator (LFO)
export class ProceduralWaveSynthesizer {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioBufferSourceNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private lfo: OscillatorNode | null = null;
  private masterGain: GainNode | null = null;

  start() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create 5-second pink noise buffer
    const bufferSize = this.ctx.sampleRate * 5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.11;
    }

    this.noiseNode = this.ctx.createBufferSource();
    this.noiseNode.buffer = buffer;
    this.noiseNode.loop = true;

    // Resonant lowpass filter modulated by slow wave oscillator
    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 350;

    // 0.12Hz slow rolling swell LFO
    this.lfo = this.ctx.createOscillator();
    this.lfo.frequency.value = 0.12;

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 260; // mod depth
    this.lfo.connect(lfoGain);
    lfoGain.connect(this.filter.frequency);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 2);

    this.noiseNode.connect(this.filter);
    this.filter.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    this.noiseNode.start();
    this.lfo.start();
  }

  stop() {
    if (!this.ctx) return;
    this.masterGain?.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
    setTimeout(() => {
      this.ctx?.close();
      this.ctx = null;
    }, 1100);
  }
}
```

---

## 7. Keyboard & Accessibility Requirements
1. **Spacebar Hotkey**: Pressing `Space` registers the next incomplete anchor node on the current step without requiring mouse coordination.
2. **Tab Navigation**: All interactive anchor cards and primary CTAs must have distinct `:focus-visible` styling (`ring-2 ring-[#2DD4BF] ring-offset-2 ring-offset-[#061826]`).
3. **Screen Reader Live Regions**:
   - `aria-live="polite"` on the anchor count pill (`{completedCount}/{targetCount} Noticed`).
   - Dynamic `aria-label` on central orb describing stage status.
4. **Motion Reduction**: Respects `prefers-reduced-motion: reduce` by replacing scale animations with gentle crossfades.
