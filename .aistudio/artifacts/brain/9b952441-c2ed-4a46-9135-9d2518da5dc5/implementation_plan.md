# Implementation Plan: Web UX & Sense Motion Graphics Overhaul

## 1. Executive Summary & Clinical Context
Therapist feedback and user testing identified three key desktop web UX friction points:
1. **Unused Tabs**: The sub-nav tabs (*Default*, *Custom*, *Setting*) on web do not perform real operations and clutter the workspace.
2. **Jargon & Visual Engagement ("Somatic Core")**: The generic "Somatic Core" text and static spark graphic create clinical distance. Replacing this with rich, sense-specific motion graphics (expanding iris for sight, tactile ripples for touch, harmonic audio waves for sound, ethereal mist for smell, centering droplet for taste) paired with relatable terminology (*"Sight Awareness"*, *"5 Visual Anchors"*) significantly improves grounding immersion.
3. **Desktop Interaction Ergonomics**: Forcing desktop users to hold down a mouse button creates physical strain and breaks eye contact with their environment. On desktop web, users need to look around their physical space and register what they notice with minimal friction:
   - **Clickable Anchor Suggestion Cards** on the right guidance panel with instant check-off.
   - **Keyboard Spacebar Shortcut** (`Space` to log an anchor) allowing users to keep their gaze focused on their room while tapping a single key to register anchors.
   - **1-Click Orbital Nodes** for visual interaction without requiring a 1.2s sustained mouse drag.

---

## 2. Architecture & Component Changes

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Mannkaa Web Header                              │
│  [Logo] Dashboard  Appointments  Self Care  Info   [Web/Mobile Toggle] │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 2-Column Desktop Grounding Workspace                   │
│                                                                        │
│  Sub-Nav: [← Self Care Library]  ·  Step 1 of 5  ·  [Settings Gear]   │
│                                                                        │
│  ┌───────────────────────────────┐  ┌───────────────────────────────┐  │
│  │ LEFT: 5-Senses Motion Graphic │  │ RIGHT: Interactive Control    │  │
│  │                               │  │                               │  │
│  │  • Sight: Concentric Iris     │  │  • Two-Line Spaced Guidance   │  │
│  │  • Touch: Tactile Ripple Wave │  │  • Clickable Anchor Cards     │  │
│  │  • Sound: Harmonic Equalizer  │  │    [ 1. Color contrast  ✓ ]   │  │
│  │  • Smell: Ethereal Mist       │  │    [ 2. Light texture   ✓ ]   │  │
│  │  • Taste: Centering Droplet   │  │  • Spacebar to Log Prompt     │  │
│  │  • Gentle Inhale/Exhale Halo  │  │  • Replay Audio Guidance      │  │
│  │  • Replaces "Somatic Core"    │  │  • Next Sense / Complete CTA  │  │
│  └───────────────────────────────┘  └───────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Specification of Enhancements

### A. Web Sub-Navigation Clean-up
* **Remove Non-Functional Tabs**: Eliminate the `Default`, `Custom`, and `Setting` segmented button cluster from `src/App.tsx` and `src/components/BreathingExerciseView.tsx`.
* **Clean Breadcrumb & Controls**:
  * Left: `← Self Care Library` breadcrumb.
  * Center: Clean progress badge (`Step 1 of 5 · Sight Awareness`).
  * Right: Ambient sound toggle (`Volume2`/`VolumeX`), Guided Voice replay (`Mic`), and Settings icon button (`Settings`).

### B. Sense-Specific Motion Graphics (Replacing "Somatic Core")
* **Remove Jargon**: Completely remove all references to `"Somatic Core"` in the UI.
* **Integrate Dynamic Visuals**:
  * **Step 5 (Sight)**: Concentric expanding iris geometry with calm chromatic teal tones.
  * **Step 4 (Touch)**: Soft tactile radial ripple wave pulsating in rhythm.
  * **Step 3 (Sound)**: Calming multi-frequency equalizer bars fluctuating smoothly.
  * **Step 2 (Smell)**: Floating upward mist particles simulating fresh air intake.
  * **Step 1 (Taste)**: Centered grounding dewdrop with expanding calmness ring.
* **Rhythmic Breath Halo**: Ambient background pulse pacing inhalation (4s) and exhalation (4s) to regulate the vagal nerve while watching the graphic.
* **Anchor Completion Ring**: Visual counter ring surrounding the graphic reflecting active anchors captured (e.g. 3 of 5 noticed).

### C. Desktop Web Ergonomics (Clickable Cards & Spacebar)
* **Clickable Anchor Suggestion Cards**:
  * Each suggestion chip in the right panel becomes an interactive card.
  * Clicking an anchor card instantly logs it, speaks the natural audio cue (without repeating "Anchor 1"), plays a gentle 528Hz chime, and triggers haptic/visual confirmation.
* **Keyboard Accessibility (`Space` Key)**:
  * Pressing `Space` registers the next available anchor immediately.
  * Tooltip hint on web: *"Tip: Look around your space and press Spacebar or click an anchor to record."*
* **1-Click Node Support**:
  * Orbital nodes also trigger on a simple single mouse click on desktop web, eliminating clumsy mouse drag-and-hold gestures.
* **Clear Completion State**:
  * When all anchors for the current sense are captured (e.g. 5/5 for sight), the card highlights with a calming green border and auto-enables the *"Next Sense"* button.

---

## 4. Verification Plan
1. **Desktop Web Inspection**:
   * Verify removal of `Default`, `Custom`, `Setting` tabs in both grounding and breathing views.
   * Verify sense motion graphics render smoothly for Sight, Touch, Sound, Smell, and Taste.
   * Verify clicking suggestion cards logs anchors and triggers non-repeating voice cue.
   * Verify pressing `Spacebar` while looking away successfully registers anchors.
2. **Mobile App Prototype Compatibility**:
   * Verify mobile mode remains intact with its touch/hold phone interactions.
   * Verify view switcher continues to toggle smoothly between web and mobile app.
3. **Build & Lint Verification**:
   * Run `lint_applet` (`tsc --noEmit`) to verify 0 TypeScript errors.
   * Run `compile_applet` (`npm run build`) to ensure successful compilation.
