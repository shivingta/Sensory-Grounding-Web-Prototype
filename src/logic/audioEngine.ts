/**
 * Grounding Audio Engine & Stage Audio Controller
 * Specializing in Clinical Mental Health & Somatic Grounding Applications
 * 
 * Features:
 * 1. Pluggable Human-Quality Voiceover Map (ElevenLabs mp3/wav CDN/public assets)
 * 2. Automatic, graceful fallback to warm Web Speech API TTS if audio asset fails or is not yet uploaded
 * 3. Single-Track Singleton pattern eliminating race conditions, double mounts, and duplicate "Anchor 1" calls
 * 4. Comprehensive audio cleanup on navigation between Web View and Mobile View
 */

import { somaticNarrator } from './somaticNarrator';

export type GroundingAudioCueId =
  | 'intro_checkin'
  | 'anchor_5_see'
  | 'anchor_4_touch'
  | 'anchor_3_hear'
  | 'anchor_2_smell'
  | 'anchor_1_taste'
  | 'session_complete';

export interface GroundingAudioTrackConfig {
  id: GroundingAudioCueId;
  stageId: number; // 0: intro, 5: sight, 4: touch, 3: sound, 2: smell, 1: taste, 6: complete
  title: string;
  transcript: string;
  audioUrl: string; // Target path for ElevenLabs studio recordings
}

/**
 * High-Fidelity Grounding Audio Map
 * Clinical voiceover transcripts designed for calm, unhurried vagal regulation.
 */
export const GROUNDING_AUDIO_MAP: Record<GroundingAudioCueId, GroundingAudioTrackConfig> = {
  intro_checkin: {
    id: 'intro_checkin',
    stageId: 0,
    title: 'Check-In Introduction',
    transcript: "How intense is your distress right now? Rate your baseline, then we will step through your five senses.",
    audioUrl: '/audio/voiceover/intro_checkin.mp3',
  },
  anchor_5_see: {
    id: 'anchor_5_see',
    stageId: 5,
    title: 'Sight Awareness (Step 1)',
    transcript: "Gently look around you. Notice 5 things you can see.",
    audioUrl: '/audio/voiceover/anchor_5_see.mp3',
  },
  anchor_4_touch: {
    id: 'anchor_4_touch',
    stageId: 4,
    title: 'Physical Touch (Step 2)',
    transcript: "Feel your body support, Notice things you can physically feel.",
    audioUrl: '/audio/voiceover/anchor_4_touch.mp3',
  },
  anchor_3_hear: {
    id: 'anchor_3_hear',
    stageId: 3,
    title: 'Ambient Sound (Step 3)',
    transcript: "Listen in to your space,. Notice 3 sounds around you.",
    audioUrl: '/audio/voiceover/anchor_3_hear.mp3',
  },
  anchor_2_smell: {
    id: 'anchor_2_smell',
    stageId: 2,
    title: 'Subtle Scent (Step 4)',
    transcript: "Take a calm breath in. Notice 2 scents in the air.",
    audioUrl: '/audio/voiceover/anchor_2_smell.mp3',
  },
  anchor_1_taste: {
    id: 'anchor_1_taste',
    stageId: 1,
    title: 'Presence & Taste (Step 5)',
    transcript: "Notice one sensation or taste resting in your mouth",
    audioUrl: '/audio/voiceover/anchor_1_taste.mp3',
  },
  session_complete: {
    id: 'session_complete',
    stageId: 6,
    title: 'Equilibrium Restored',
    transcript: "Take one final deep breath. Your mind and body have reconnected with the room around you. Your grounding practice is complete.",
    audioUrl: '/audio/voiceover/session_complete.mp3',
  },
};

export function getCueIdForStep(stepNumber: number): GroundingAudioCueId {
  switch (stepNumber) {
    case 5:
      return 'anchor_5_see';
    case 4:
      return 'anchor_4_touch';
    case 3:
      return 'anchor_3_hear';
    case 2:
      return 'anchor_2_smell';
    case 1:
      return 'anchor_1_taste';
    default:
      return 'intro_checkin';
  }
}

class StageAudioController {
  private currentAudio: HTMLAudioElement | null = null;
  private lastPlayedStageId: number | null = null;
  private lastPlayedCueId: GroundingAudioCueId | null = null;
  private lastPlayedTimestamp: number = 0;
  private playToken: number = 0;
  private isEnabled: boolean = true;
  private isPlaying: boolean = false;
  private speakingListeners: Set<(isPlaying: boolean) => void> = new Set();

  private lastSpokenItem: string = '';
  private lastSpokenItemTime: number = 0;

  constructor() {
    // Subscribe to fallback TTS speaking events as well
    somaticNarrator.subscribeSpeaking((isSpeaking) => {
      if (this.currentAudio === null) {
        this.notifyState(isSpeaking);
      }
    });
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  public subscribeSpeaking(cb: (isPlaying: boolean) => void): () => void {
    this.speakingListeners.add(cb);
    cb(this.isPlaying);
    return () => this.speakingListeners.delete(cb);
  }

  private notifyState(playing: boolean) {
    this.isPlaying = playing;
    this.speakingListeners.forEach((cb) => {
      try {
        cb(playing);
      } catch {
        // Safe listener execution
      }
    });
  }

  /**
   * Primary Stage Audio Player
   * Enforces singleton pattern, halting any playing audio and preventing duplicate re-triggers.
   * Seamlessly voices firstAnchorCue following stage guidance after a calm breath pause.
   */
  public async playStageAudio(
    cueId: GroundingAudioCueId,
    options?: {
      force?: boolean;
      onEnd?: () => void;
      debounceMs?: number;
      firstAnchorCue?: string;
    }
  ): Promise<void> {
    if (!this.isEnabled) {
      options?.onEnd?.();
      return;
    }

    const track = GROUNDING_AUDIO_MAP[cueId];
    if (!track) return;

    const now = Date.now();
    const debounceWindow = options?.debounceMs ?? 2500;

    // RACE CONDITION & RE-MOUNT GUARD:
    // If this cue was already initiated within the debounce window and not forced, suppress duplicate
    if (!options?.force && this.lastPlayedCueId === cueId && now - this.lastPlayedTimestamp < debounceWindow) {
      console.log(`[AudioEngine] Suppressed duplicate trigger for cue: ${cueId}`);
      return;
    }

    // Stop all current audio immediately
    this.stopAll();

    this.lastPlayedCueId = cueId;
    this.lastPlayedStageId = track.stageId;
    this.lastPlayedTimestamp = now;
    const token = ++this.playToken;

    const handleTrackEnd = () => {
      if (token !== this.playToken || !this.isEnabled) return;
      options?.onEnd?.();

      if (options?.firstAnchorCue) {
        // Natural soothing breath pause between stage introduction and first sensory anchor cue
        setTimeout(() => {
          if (token === this.playToken && this.isEnabled) {
            this.speakAnchorCue(options.firstAnchorCue!, true);
          }
        }, 550);
      }
    };

    // Try playing high-fidelity asset first
    const playedAsset = await this.tryPlayAudioAsset(track.audioUrl, token, handleTrackEnd);

    // If asset was not found or failed, smoothly fallback to high-fidelity TTS narration
    if (!playedAsset && token === this.playToken) {
      console.log(`[AudioEngine] Falling back to clinical TTS for ${cueId}`);
      await somaticNarrator.speak(track.transcript, {
        onEnd: handleTrackEnd,
        rateModifier: 0.92,
      });
    }
  }

  /**
   * Attempts to play a static audio asset (e.g. ElevenLabs .mp3)
   * Resolves false if asset fails or is not present, triggering instant fallback.
   */
  private tryPlayAudioAsset(
    url: string,
    token: number,
    onEnd?: () => void
  ): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);

    return new Promise((resolve) => {
      try {
        const audio = new Audio(url);
        this.currentAudio = audio;

        let resolved = false;

        audio.onplay = () => {
          if (token === this.playToken) {
            this.notifyState(true);
          }
        };

        audio.onended = () => {
          if (token === this.playToken) {
            this.notifyState(false);
            this.currentAudio = null;
            onEnd?.();
          }
          if (!resolved) {
            resolved = true;
            resolve(true);
          }
        };

        audio.onerror = () => {
          // Audio asset not present or failed to decode -> trigger fallback
          if (token === this.playToken && this.currentAudio === audio) {
            this.currentAudio = null;
            this.notifyState(false);
          }
          if (!resolved) {
            resolved = true;
            resolve(false);
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              if (token !== this.playToken) {
                audio.pause();
                audio.currentTime = 0;
                resolve(false);
              } else {
                resolve(true);
              }
            })
            .catch(() => {
              // Autoplay policy or 404 error
              if (!resolved) {
                resolved = true;
                resolve(false);
              }
            });
        }
      } catch {
        resolve(false);
      }
    });
  }

  /**
   * Speaks individual anchor item cues (e.g. "A color that catches your eye")
   * Strips mechanical "Anchor X:" prefixes and debounces consecutive rapid clicks.
   */
  public speakAnchorCue(rawCue: string, force = false): Promise<void> {
    if (!this.isEnabled || !rawCue) return Promise.resolve();

    const cleanCue = rawCue.replace(/^Anchor\s*\d+\s*[:\-–]\s*/i, '').trim();
    if (!cleanCue) return Promise.resolve();

    const now = Date.now();
    if (!force && this.lastSpokenItem === cleanCue && now - this.lastSpokenItemTime < 1200) {
      return Promise.resolve();
    }

    this.lastSpokenItem = cleanCue;
    this.lastSpokenItemTime = now;

    // Halt any playing background track for the specific cue
    this.stopAll();

    return somaticNarrator.speakAnchorCue(cleanCue, true);
  }

  /**
   * Stop all ongoing speech and audio tracks immediately.
   * Called during view transitions, modal exits, and mode switching.
   */
  public stopAll() {
    this.playToken++;

    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
      } catch {
        // ignore
      }
      this.currentAudio = null;
    }

    somaticNarrator.cancel();
    this.notifyState(false);
  }

  /**
   * Reset tracking cache on session restart
   */
  public resetSession() {
    this.stopAll();
    this.lastPlayedCueId = null;
    this.lastPlayedStageId = null;
    this.lastPlayedTimestamp = 0;
    this.lastSpokenItem = '';
    this.lastSpokenItemTime = 0;
  }
}

export const stageAudio = new StageAudioController();
