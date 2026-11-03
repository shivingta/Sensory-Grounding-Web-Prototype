import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SomaticCore, GroundingSense, SENSE_CONFIG } from './components/SomaticCore';
import { BreathingExerciseView } from './components/BreathingExerciseView';
import { SenseMotionVisual } from './components/SenseMotionVisual';
import { CenteringBreathPacer } from './components/CenteringBreathPacer';
import { GroundingTreeIcon } from './components/GroundingTreeIcon';
import { stageAudio, getCueIdForStep } from './logic/audioEngine';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Clock,
  Waves,
  CloudRain,
  Vibrate,
  Mic,
  Bell,
  Sparkle,
  Activity,
  ShieldCheck,
  Play,
  Grid,
  Sliders,
  Settings,
  Wind,
  Brain,
  MessageCircle,
  HelpCircle,
  Check,
  Menu,
} from 'lucide-react';
import {
  GROUNDING_STEPS,
  formatDuration,
  createStartedEvent,
  createStepCompletedEvent,
  createAudioPlayedEvent,
  createToolCompletedEvent,
  calculateSummaryMetrics,
  calculateSomaticShift,
  getDistressLabel,
  triggerHaptic,
  HapticType,
  DistressRating,
  PostFeeling,
  StepRecord,
  AnchorActivation,
  SomaticShiftDelta,
  PostHogEvent,
} from './logic/groundingMachine';
import { ambientSound, AmbientSoundType } from './logic/ambientAudio';
import { somaticNarrator, VoiceTone, VOICE_TONES } from './logic/somaticNarrator';

// Harmonic chime synthesizer
function playSoftChime(freq = 528, isMuted = false) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.75);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.75);
  } catch {
    // Autoplay fallback
  }
}

export default function App() {
  const [whatsappToast, setWhatsappToast] = useState<boolean>(false);

  // Portal View Routing: 'grounding' (5-4-3-2-1 Reset) | 'library' (Self Care Library) | 'breathing'
  const [portalView, setPortalView] = useState<'grounding' | 'library' | 'breathing'>('grounding');

  // Grounding Flow: 'pre_checkin' (First Page Baseline) -> 'stepper' (Steps 1 to 5) -> 'post_summary' (Shift Summary)
  const [screen, setScreen] = useState<'pre_checkin' | 'stepper' | 'post_summary'>('pre_checkin');

  // Baseline Distress (1 to 5)
  const [distressRating, setDistressRating] = useState<DistressRating>(3);

  // Stepper index: 0 = Sight (5 things), 1 = Touch (4 things), 2 = Sound (3 things), 3 = Smell (2 things), 4 = Taste (1 thing)
  const [stepIndex, setStepIndex] = useState<number>(0);
  const currentStep = GROUNDING_STEPS[stepIndex] || GROUNDING_STEPS[0];

  // Somatic tracking
  const [anchorActivations, setAnchorActivations] = useState<AnchorActivation[]>([]);
  const [stepRecords, setStepRecords] = useState<StepRecord[]>([]);
  const [postFeeling, setPostFeeling] = useState<PostFeeling | null>(null);

  // Settings & Preferences
  const [isGuidedVoiceEnabled, setIsGuidedVoiceEnabled] = useState<boolean>(true);
  const [selectedVoiceTone, setSelectedVoiceTone] = useState<VoiceTone>('soft_meditative');
  const [isBackgroundSoundEnabled, setIsBackgroundSoundEnabled] = useState<boolean>(true);
  const [ambientType, setAmbientType] = useState<AmbientSoundType>('water_waves');
  const [isVibrationEnabled, setIsVibrationEnabled] = useState<boolean>(true);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);

  // Modals
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  // Narrator state
  const [isNarratorSpeaking, setIsNarratorSpeaking] = useState<boolean>(false);

  // Session timer
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [sessionDurationSeconds, setSessionDurationSeconds] = useState<number>(0);
  const stepStartTimeRef = useRef<number>(Date.now());

  // PostHog event logging
  const [eventLogs, setEventLogs] = useState<PostHogEvent[]>([]);

  // Subscribe to audio engine speaking state
  useEffect(() => {
    const unsubscribe = stageAudio.subscribeSpeaking((speaking) => {
      setIsNarratorSpeaking(speaking);
    });
    return unsubscribe;
  }, []);

  // Sync settings with audio engines
  useEffect(() => {
    stageAudio.setEnabled(isGuidedVoiceEnabled);
    somaticNarrator.setEnabled(isGuidedVoiceEnabled);
  }, [isGuidedVoiceEnabled]);

  useEffect(() => {
    somaticNarrator.setTone(selectedVoiceTone);
  }, [selectedVoiceTone]);

  // Subtle haptic trigger
  const triggerAppHaptic = useCallback(
    (type: HapticType) => {
      if (!isVibrationEnabled) return;
      triggerHaptic(type, true);
    },
    [isVibrationEnabled]
  );

  // PostHog logger
  const trackEvent = (event: PostHogEvent) => {
    console.log(`[PostHog Event: ${event.event}]`, JSON.stringify(event, null, 2));
    setEventLogs((prev) => [event, ...prev]);
  };

  // Background Ambient Sound Engine (starts on "Take a breath. Let's ground together.")
  useEffect(() => {
    const isGroundingActive =
      portalView === 'grounding' && (screen === 'pre_checkin' || screen === 'stepper');
    if (isBackgroundSoundEnabled && isGroundingActive && !isSoundMuted) {
      ambientSound.start(ambientType);
    } else {
      ambientSound.stop();
    }
    return () => {
      ambientSound.stop();
    };
  }, [isBackgroundSoundEnabled, portalView, screen, ambientType, isSoundMuted]);

  // Single-track stage audio controller with double-mount & StrictMode guard
  const lastPlayedStageRef = useRef<number | null>(null);

  useEffect(() => {
    if (portalView === 'grounding' && screen === 'stepper' && isGuidedVoiceEnabled) {
      const stageNumber = currentStep.stepNumber;

      // Prevent replaying identical track if already triggered for this stage
      if (lastPlayedStageRef.current === stageNumber) {
        return;
      }
      lastPlayedStageRef.current = stageNumber;

      const cueId = getCueIdForStep(stageNumber);
      const firstCue = currentStep.defaultSuggestions[0];

      const timer = setTimeout(() => {
        stageAudio.playStageAudio(cueId, { firstAnchorCue: firstCue });
        trackEvent(createAudioPlayedEvent(stageNumber, currentStep.senseName));
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    } else {
      lastPlayedStageRef.current = null;
      stageAudio.stopAll();
    }
  }, [stepIndex, screen, isGuidedVoiceEnabled, portalView]);

  // Session Stopwatch
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (portalView === 'grounding' && screen === 'stepper' && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDurationSeconds((Date.now() - sessionStartTime) / 1000);
      }, 500);
    }
    return () => clearInterval(interval);
  }, [portalView, screen, sessionStartTime]);

  // Stage 1: Begin Reset from Baseline
  const handleBeginReset = () => {
    stageAudio.stopAll();
    triggerAppHaptic('buttonPress');
    trackEvent(createStartedEvent(distressRating, isGuidedVoiceEnabled, isVibrationEnabled));

    const now = Date.now();
    setSessionStartTime(now);
    setSessionDurationSeconds(0);
    stepStartTimeRef.current = now;
    setStepIndex(0);
    setAnchorActivations([]);
    setStepRecords([]);
    setPostFeeling(null);
    lastPlayedStageRef.current = null;
    setScreen('stepper');
    playSoftChime(440, isSoundMuted);
  };

  // Advance Stage (5 -> 4 -> 3 -> 2 -> 1 -> Summary)
  const advanceStep = (skipped = false) => {
    stageAudio.stopAll();
    triggerAppHaptic('stepComplete');

    const now = Date.now();
    const duration = Math.max(1, Math.round((now - stepStartTimeRef.current) / 1000));
    stepStartTimeRef.current = now;

    const recordedItems = currentStep.defaultSuggestions.slice(0, currentStep.targetCount);

    const record: StepRecord = {
      stepNumber: currentStep.stepNumber,
      senseKey: currentStep.senseKey,
      senseName: currentStep.senseName,
      targetCount: currentStep.targetCount,
      itemsNoticed: skipped ? [] : recordedItems,
      skipped,
      durationSeconds: duration,
      guidedAudioPlayed: isGuidedVoiceEnabled,
    };

    const updatedRecords = [...stepRecords, record];
    setStepRecords(updatedRecords);
    trackEvent(createStepCompletedEvent(record));

    if (stepIndex < GROUNDING_STEPS.length - 1) {
      lastPlayedStageRef.current = null;
      setStepIndex((prev) => prev + 1);
      playSoftChime(480, isSoundMuted);
    } else {
      // Completed all 5 senses -> Transition directly to Summary
      const finalDuration = sessionStartTime ? (now - sessionStartTime) / 1000 : duration;
      setSessionDurationSeconds(finalDuration);
      setScreen('post_summary');
      stageAudio.playStageAudio('session_complete');
      playSoftChime(784, isSoundMuted);
    }
  };

  // Replay current step audio cleanly with first anchor cue
  const handleReplayCurrentStep = () => {
    triggerAppHaptic('tap');
    const cueId = getCueIdForStep(currentStep.stepNumber);
    const firstCue = currentStep.defaultSuggestions[0];
    stageAudio.playStageAudio(cueId, { force: true, firstAnchorCue: firstCue });
  };

  // Register anchor by index (for clicking anchor suggestion cards or orbital nodes)
  const handleRegisterAnchorByIndex = useCallback(
    (index: number, cueText: string) => {
      const alreadyDone = anchorActivations.some(
        (a) => a.stepNumber === currentStep.stepNumber && a.nodeIndex === index
      );
      if (alreadyDone) return;

      triggerAppHaptic('buttonPress');
      playSoftChime(528, isSoundMuted);

      setAnchorActivations((prev) => {
        const nextList = [
          ...prev,
          {
            stepNumber: currentStep.stepNumber,
            nodeIndex: index,
            timestamp: Date.now(),
            dwellSeconds: 4.5,
            note: cueText,
          },
        ];

        const stepActivations = nextList.filter((a) => a.stepNumber === currentStep.stepNumber);

        if (stepActivations.length === currentStep.targetCount) {
          if (isGuidedVoiceEnabled) {
            stageAudio.speakAnchorCue(`${currentStep.senseName} complete.`, true);
          }
        } else {
          // Automatically speak the next sensory anchor cue
          const nextIdx = currentStep.defaultSuggestions.findIndex(
            (_, i) => !stepActivations.some((a) => a.nodeIndex === i)
          );
          if (nextIdx !== -1 && isGuidedVoiceEnabled) {
            stageAudio.speakAnchorCue(currentStep.defaultSuggestions[nextIdx], true);
          }
        }

        return nextList;
      });
    },
    [anchorActivations, currentStep, isSoundMuted, triggerAppHaptic, isGuidedVoiceEnabled]
  );

  // Register next uncompleted anchor (for Spacebar or clicking the center motion visual)
  const handleRegisterNextAnchor = useCallback(() => {
    const completedIndices = anchorActivations
      .filter((a) => a.stepNumber === currentStep.stepNumber)
      .map((a) => a.nodeIndex);

    for (let i = 0; i < currentStep.targetCount; i++) {
      if (!completedIndices.includes(i)) {
        const cue = currentStep.defaultSuggestions[i] || `Anchor ${i + 1}`;
        handleRegisterAnchorByIndex(i, cue);
        break;
      }
    }
  }, [anchorActivations, currentStep, handleRegisterAnchorByIndex]);

  // Spacebar Keyboard Listener on Desktop Web
  useEffect(() => {
    if (portalView !== 'grounding' || screen !== 'stepper') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        handleRegisterNextAnchor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [portalView, screen, handleRegisterNextAnchor]);

  // Select Post Feeling & compute Somatic Shift Delta
  const handleSelectPostFeeling = (feeling: PostFeeling) => {
    triggerAppHaptic('sessionComplete');
    setPostFeeling(feeling);

    const shiftDelta = calculateSomaticShift(
      distressRating,
      feeling,
      anchorActivations,
      sessionDurationSeconds,
      summaryMetrics.totalItems
    );

    const audioUsed = stepRecords.some((r) => r.guidedAudioPlayed) || isGuidedVoiceEnabled;
    trackEvent(
      createToolCompletedEvent(
        distressRating,
        feeling,
        sessionDurationSeconds,
        stepRecords,
        shiftDelta,
        audioUsed
      )
    );
    playSoftChime(587, isSoundMuted);
  };

  // Reset to Self Care Library
  const handleResetToSelfCare = () => {
    stageAudio.resetSession();
    ambientSound.stop();
    triggerAppHaptic('buttonPress');
    setPortalView('library');
    setScreen('pre_checkin');
    setStepIndex(0);
    setPostFeeling(null);
    setAnchorActivations([]);
    setStepRecords([]);
    lastPlayedStageRef.current = null;
  };

  const summaryMetrics = useMemo(() => calculateSummaryMetrics(stepRecords), [stepRecords]);

  // Derived Somatic Shift Delta for Summary
  const somaticShiftDelta: SomaticShiftDelta | null = useMemo(() => {
    if (!postFeeling) return null;
    return calculateSomaticShift(
      distressRating,
      postFeeling,
      anchorActivations,
      sessionDurationSeconds,
      summaryMetrics.totalItems
    );
  }, [postFeeling, distressRating, anchorActivations, sessionDurationSeconds, summaryMetrics.totalItems]);

  return (
    <div className="min-h-screen bg-[#041B2D] text-white flex flex-col justify-between antialiased font-sans select-none">
      {/* 1. TOP NAVIGATION BAR (Matching Screenshots 1 & 2) */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between text-slate-700 shadow-xs">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToSelfCare}
            className="flex items-center gap-2 cursor-pointer focus:outline-none"
          >
            {/* Mannkaa Logo Mark */}
            <div className="w-8 h-8 rounded-lg bg-[#00A884]/15 border border-[#00A884]/40 flex items-center justify-center text-[#00A884]">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F2942]">Mannkaa</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            type="button"
            onClick={handleResetToSelfCare}
            className="text-slate-600 hover:text-[#0F2942] transition-colors cursor-pointer"
          >
            Dashboard
          </button>
          <button
            type="button"
            className="text-slate-600 hover:text-[#0F2942] transition-colors cursor-pointer"
          >
            My Appointments
          </button>
          <button
            type="button"
            onClick={() => setPortalView('library')}
            className={`font-semibold cursor-pointer relative pb-1 ${
              portalView === 'library' || portalView === 'grounding' || portalView === 'breathing'
                ? 'text-[#00A884]'
                : 'text-slate-600'
            }`}
          >
            Self Care
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00A884] rounded-full" />
          </button>
          <button
            type="button"
            className="text-slate-600 hover:text-[#0F2942] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Clinical Information</span>
            <span className="text-xs">▾</span>
          </button>
          <button
            type="button"
            className="text-slate-600 hover:text-[#0F2942] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Other Information</span>
            <span className="text-xs">▾</span>
          </button>
        </nav>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              triggerAppHaptic('tap');
              setWhatsappToast(true);
              setTimeout(() => setWhatsappToast(false), 3500);
            }}
            className="w-8 h-8 rounded-full bg-[#00A884]/15 text-[#00A884] flex items-center justify-center hover:bg-[#00A884]/25 transition-colors cursor-pointer"
            title="Chat support"
            aria-label="Chat support"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
          </button>
          {/* User Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-slate-300 overflow-hidden ring-2 ring-[#00A884]/30">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="User profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-6 lg:p-8">
        <AnimatePresence mode="wait">
          {/* VIEW A: SELF CARE LIBRARY (Screenshot 1) */}
          {portalView === 'library' && (
            <motion.div
              key="view-library"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-xl mx-auto space-y-6 text-center my-auto py-8"
            >
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Self Care Library
              </h1>

              <div className="space-y-4 text-left">
                {/* 1. Breathing Exercises Card */}
                <button
                  type="button"
                  onClick={() => {
                    triggerAppHaptic('buttonPress');
                    setPortalView('breathing');
                  }}
                  className="w-full p-5 sm:p-6 rounded-3xl bg-[#85D7D1] hover:bg-[#72CFC9] active:scale-[0.99] transition-all flex items-center justify-between shadow-xl cursor-pointer text-[#061826]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/40 flex items-center justify-center text-[#0F2942] shrink-0">
                      <Wind className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#0F2942]">Breathing Exercises</h2>
                      <p className="text-xs sm:text-sm text-[#0F2942]/80 font-medium">
                        Free tools for calm &amp; better breathing
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center text-[#0F2942] shrink-0 shadow-xs">
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </button>

                {/* 2. 5-4-3-2-1 Sensory Grounding Card */}
                <button
                  type="button"
                  onClick={() => {
                    triggerAppHaptic('buttonPress');
                    setPortalView('grounding');
                    setScreen('pre_checkin');
                  }}
                  className="w-full p-5 sm:p-6 rounded-3xl bg-[#85D7D1] hover:bg-[#72CFC9] active:scale-[0.99] transition-all flex items-center justify-between shadow-xl cursor-pointer text-[#0F2942]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/40 flex items-center justify-center shrink-0 shadow-xs p-1">
                      <GroundingTreeIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#0F2942]">
                        5-4-3-2-1 Sensory Grounding
                      </h2>
                      <p className="text-xs sm:text-sm text-[#0F2942]/80 font-medium">
                        Anchor your mind to your surroundings
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center text-[#0F2942] shrink-0 shadow-xs">
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </button>

                {/* 3. Assess Your Wellbeing Card */}
                <button
                  type="button"
                  className="w-full p-5 sm:p-6 rounded-3xl bg-[#93C5FD] hover:bg-[#7FB7F7] active:scale-[0.99] transition-all flex items-center justify-between shadow-xl cursor-pointer text-[#0F2942]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/40 flex items-center justify-center text-[#0F2942] shrink-0">
                      <Brain className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-[#0F2942]">Assess Your Wellbeing</h2>
                      <p className="text-xs sm:text-sm text-[#0F2942]/80 font-medium">
                        Check in on your mental health
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 rounded-full bg-white/50 flex items-center justify-center text-[#0F2942] shrink-0 shadow-xs">
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* VIEW B: COMPANION BOX BREATHING (Screenshot 2) */}
          {portalView === 'breathing' && (
            <motion.div
              key="view-breathing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
            >
              <BreathingExerciseView
                onBackToLibrary={() => setPortalView('library')}
                onOpenSettings={() => setShowSettingsModal(true)}
              />
            </motion.div>
          )}

          {/* VIEW C: 5-4-3-2-1 SENSORY GROUNDING TOOL (2-Card Desktop Workspace) */}
          {portalView === 'grounding' && (
            <motion.div
              key="view-grounding"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full max-w-5xl mx-auto space-y-4"
            >
              {/* Sub-nav navigation bar */}
              <div className="flex items-center justify-between px-2">
                <button
                  type="button"
                  onClick={() => {
                    if (screen === 'stepper') {
                      setShowExitModal(true);
                    } else {
                      setPortalView('library');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7E9EB8] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-[#081E2E] border border-[#1A4666]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{screen === 'stepper' ? 'Pause Reset' : 'Self Care Library'}</span>
                </button>

                {/* Center Sense Progress */}
                <div className="text-center">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    {screen === 'pre_checkin'
                      ? '5-4-3-2-1 Sensory Grounding'
                      : screen === 'stepper'
                      ? `Step ${stepIndex + 1} of 5 · ${currentStep.senseName}`
                      : 'Somatic Grounding Complete'}
                  </span>
                  <span className="text-[11px] text-[#2DD4BF] font-medium">
                    {screen === 'pre_checkin'
                      ? 'Baseline Assessment · 5 Senses'
                      : screen === 'stepper'
                      ? `${currentStep.targetCount} Anchors to Notice`
                      : 'Equilibrium Restored'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Replay Spoken Prompt */}
                  {screen === 'stepper' && isGuidedVoiceEnabled && (
                    <button
                      type="button"
                      onClick={handleReplayCurrentStep}
                      className={`p-2 rounded-xl border border-[#1A4666] transition-colors cursor-pointer ${
                        isNarratorSpeaking
                          ? 'bg-[#1DBB8E] text-[#061826]'
                          : 'bg-[#081E2E] text-[#2DD4BF] hover:text-white'
                      }`}
                      title="Replay Voice Guidance"
                    >
                      <Mic className="w-4 h-4" />
                    </button>
                  )}

                  {/* Ambient sound toggle */}
                  {(screen === 'stepper' || screen === 'pre_checkin') && isBackgroundSoundEnabled && (
                    <button
                      type="button"
                      onClick={() => setIsSoundMuted((prev) => !prev)}
                      className="p-2 rounded-xl bg-[#081E2E] border border-[#1A4666] text-[#2DD4BF] hover:text-white transition-colors cursor-pointer"
                      title={isSoundMuted ? 'Unmute Ambient Audio' : 'Mute Ambient Audio'}
                    >
                      {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  )}

                  {/* Settings gear */}
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="p-2 rounded-xl bg-[#081E2E] border border-[#1A4666] text-[#7E9EB8] hover:text-white transition-colors cursor-pointer"
                    title="Grounding Settings"
                    aria-label="Grounding Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2-Column Responsive Somatic Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* LEFT COLUMN: 5-Senses Motion Graphic Stage */}
                <div className="rounded-3xl border border-[#1A4666] bg-[#081E2E] shadow-2xl p-6 flex flex-col justify-between min-h-[460px] lg:min-h-[520px]">
                  {screen === 'pre_checkin' ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-2 text-center space-y-4 my-auto">
                      {/* Organic Multi-Layered CSS/SVG Breathing Pacer */}
                      <CenteringBreathPacer
                        size="md"
                        state="active"
                        interactive={false}
                      />

                      {/* How Somatic Anchoring Works inside Left Card */}
                      <div className="space-y-2.5 max-w-sm">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#061826] border border-[#1A4666] text-[#2DD4BF] text-xs font-bold uppercase tracking-wider">
                          <Sparkle className="w-3.5 h-3.5 fill-[#2DD4BF]" />
                          <span>How Somatic Anchoring Works</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          During this reset, <strong className="text-white font-semibold">turn your physical gaze away from the glass screen</strong>. The gentle voice guide reads each anchor, and you can hold or press the center orb or Spacebar without looking down.
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                          <div className="p-2.5 rounded-xl bg-[#061826] border border-[#1A4666] text-slate-300 flex items-center justify-center gap-1.5 text-[11px]">
                            <span className="text-[#2DD4BF] font-bold">1.</span>
                            <span>Look outward &amp; listen</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-[#061826] border border-[#1A4666] text-slate-300 flex items-center justify-center gap-1.5 text-[11px]">
                            <span className="text-[#2DD4BF] font-bold">2.</span>
                            <span>Tap orb or Spacebar</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : screen === 'stepper' ? (
                    <SenseMotionVisual
                      senseKey={currentStep.senseKey}
                      stepNumber={currentStep.stepNumber}
                      senseName={currentStep.senseName}
                      targetCount={currentStep.targetCount}
                      completedCount={
                        anchorActivations.filter((a) => a.stepNumber === currentStep.stepNumber).length
                      }
                      onRegisterAnchor={handleRegisterNextAnchor}
                      isNarratorSpeaking={isNarratorSpeaking}
                    />
                  ) : (
                    /* Summary Stage Visual */
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                      <div className="w-32 h-32 rounded-full bg-[#1DBB8E]/20 border-2 border-[#1DBB8E] flex items-center justify-center shadow-xl">
                        <Check className="w-14 h-14 text-[#1DBB8E] stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">Equilibrium Restored</h3>
                        <p className="text-xs text-[#7E9EB8] mt-1 max-w-xs">
                          Your autonomic nervous system has engaged its natural calming response.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Ambient Status Pill at Bottom of Left Column */}
                  <div className="p-3 rounded-2xl bg-[#061826]/80 border border-[#1A4666] flex items-center justify-between text-xs text-[#7E9EB8]">
                    <div className="flex items-center gap-2">
                      <Waves className="w-3.5 h-3.5 text-[#2DD4BF]" />
                      <span>{ambientType === 'water_waves' ? 'Ocean Waves 🌊' : 'Gentle Rain 🌧️'}</span>
                    </div>
                    <span className="text-[11px] font-semibold text-[#1DBB8E]">
                      {screen === 'stepper' ? `Step ${stepIndex + 1} of 5` : screen === 'pre_checkin' ? '5 Sensory Stages' : 'Practice Complete'}
                    </span>
                  </div>
                </div>

                {/* RIGHT COLUMN: Interactive Control & Guidance Card */}
                <div className="rounded-3xl border border-[#1A4666] bg-[#0A2436] p-6 shadow-2xl flex flex-col justify-between min-h-[460px] lg:min-h-[520px]">
                  <AnimatePresence mode="wait">
                    {/* SCREEN 1: STREAMLINED BASELINE CHECK-IN */}
                    {screen === 'pre_checkin' && (
                      <motion.div
                        key="control-pre-checkin"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex-1 flex flex-col justify-between space-y-6"
                      >
                        <div className="space-y-4">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0D2D44] border border-[#1A4666] text-[#2DD4BF] text-xs font-bold uppercase tracking-wider">
                            <Sparkle className="w-3 h-3 fill-[#2DD4BF]" />
                            <span>Somatic Grounding Reset</span>
                          </div>

                          {/* Friendly, accessible layperson headline */}
                          <h2 className="text-2xl font-extrabold text-white tracking-tight">
                            Anchor to Here &amp; Now
                          </h2>

                          {/* Reassuring note */}
                          <div className="space-y-1 text-slate-300 text-sm leading-relaxed">
                            <p>Grounding brings your attention gently back into the room around you.</p>
                            <p>
                              Rate how intense your distress feels right now, then we'll step through your five
                              senses.
                            </p>
                          </div>

                          {/* 1-5 Distress Scale */}
                          <div className="pt-1 space-y-2.5">
                            <label className="block text-xs font-bold text-[#2DD4BF] uppercase tracking-wider">
                              How intense is your distress right now?
                            </label>

                            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Distress rating">
                              {([1, 2, 3, 4, 5] as DistressRating[]).map((val) => {
                                const isSelected = distressRating === val;
                                return (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => {
                                      triggerAppHaptic('buttonPress');
                                      setDistressRating(val);
                                      playSoftChime(360 + val * 55, isSoundMuted);
                                    }}
                                    role="radio"
                                    aria-checked={isSelected}
                                    className={`py-3 px-2 rounded-xl border text-sm font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                                      isSelected
                                        ? 'bg-[#09354E] border-[#1DBB8E] text-white shadow-md shadow-[#1DBB8E]/30 ring-2 ring-[#1DBB8E]/40'
                                        : 'bg-[#081E2E] border-[#1A4666] text-[#7E9EB8] hover:border-slate-400 hover:text-white'
                                    }`}
                                  >
                                    <span className="text-base font-extrabold">{val}</span>
                                    <span className="text-[9px] mt-0.5 opacity-80 font-normal">
                                      {val === 1 ? 'Mild' : val === 5 ? 'High' : ''}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="px-3.5 py-2.5 rounded-xl bg-[#081E2E] border border-[#1A4666] flex items-center gap-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#1dbb8e] ring-4 ring-[#1dbb8e]/20 shrink-0" />
                              <span className="text-xs text-slate-200 font-medium">
                                Baseline: <strong className="text-white">{getDistressLabel(distressRating)}</strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Primary CTA */}
                        <div>
                          <button
                            type="button"
                            onClick={handleBeginReset}
                            className="w-full py-4 px-6 rounded-2xl bg-[#1DBB8E] hover:bg-[#25BFA0] active:scale-[0.98] text-white font-bold text-base shadow-lg shadow-[#1DBB8E]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Begin Grounding Reset</span>
                            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 2: 5-4-3-2-1 SENSORY GROUNDING STEPS */}
                    {screen === 'stepper' && (
                      <motion.div
                        key={`control-stepper-${currentStep.stepNumber}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex-1 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-4">
                          {/* Progress Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-[#1A4666]/60">
                            <div>
                              <span className="text-xs font-bold text-[#2DD4BF] uppercase tracking-wider block">
                                Step {stepIndex + 1} of 5
                              </span>
                              <h3 className="text-xl font-extrabold text-white">
                                {currentStep.senseName}
                              </h3>
                            </div>
                            <span className="text-xs font-mono text-[#7E9EB8]">
                              {formatDuration(sessionDurationSeconds)}
                            </span>
                          </div>

                          {/* Two-Line Sensory Spacing (Therapist recommendation) */}
                          <div className="p-3.5 rounded-2xl bg-[#081E2E] border border-[#1A4666] space-y-1">
                            <p className="text-xs font-medium text-slate-300">
                              {currentStep.instructionLine1}
                            </p>
                            <p className="text-sm font-bold text-white tracking-wide">
                              {currentStep.instructionLine2}
                            </p>
                          </div>

                          {/* Relatable Layperson Anchors List: Clickable cards on Web */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-[#7E9EB8] block uppercase tracking-wider">
                                Sensory Anchor Cues
                              </span>
                              <span className="text-[11px] text-[#2DD4BF] font-mono font-semibold">
                                {
                                  anchorActivations.filter(
                                    (a) => a.stepNumber === currentStep.stepNumber
                                  ).length
                                } of {currentStep.targetCount} Noticed
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              {currentStep.defaultSuggestions.map((suggestion, idx) => {
                                const isNoticed = anchorActivations.some(
                                  (a) =>
                                    a.stepNumber === currentStep.stepNumber &&
                                    a.nodeIndex === idx
                                );

                                return (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => handleRegisterAnchorByIndex(idx, suggestion)}
                                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
                                      isNoticed
                                        ? 'bg-[#1DBB8E]/15 border-[#1DBB8E] text-white shadow-xs'
                                        : 'bg-[#081E2E]/80 border-[#1A4666]/70 text-slate-200 hover:border-[#2DD4BF] hover:bg-[#0D2D44]'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 transition-colors ${
                                          isNoticed
                                            ? 'bg-[#1DBB8E] text-[#061826]'
                                            : 'bg-[#0D2D44] border border-[#1A4666] text-[#2DD4BF]'
                                        }`}
                                      >
                                        {isNoticed ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                                      </span>
                                      <span className={`text-xs truncate ${isNoticed ? 'text-white font-semibold' : 'text-slate-200'}`}>
                                        {suggestion}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-semibold shrink-0 ml-2 px-2 py-0.5 rounded-md transition-colors ${
                                        isNoticed
                                          ? 'text-[#1DBB8E] bg-[#1DBB8E]/20'
                                          : 'text-[#7E9EB8] group-hover:text-white'
                                      }`}
                                    >
                                      {isNoticed ? 'Noticed ✓' : 'Click to Notice'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Keyboard & Eyes-free Hint for Web */}
                            <p className="text-[11px] text-[#7E9EB8] flex items-center gap-1.5 pt-0.5">
                              <span className="px-1.5 py-0.5 rounded bg-[#0D2D44] border border-[#1A4666] text-white font-mono text-[10px]">
                                Space
                              </span>
                              <span>Press Spacebar or click any card to anchor while looking around your room</span>
                            </p>
                          </div>
                        </div>

                        {/* Navigation Actions */}
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => advanceStep(true)}
                            className="flex-1 py-3 px-4 rounded-xl border border-[#1A4666] bg-[#081E2E] hover:bg-[#0D2D44] text-[#7E9EB8] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            Skip this sense
                          </button>
                          <button
                            type="button"
                            onClick={() => advanceStep(false)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              anchorActivations.filter(
                                (a) => a.stepNumber === currentStep.stepNumber
                              ).length >= currentStep.targetCount
                                ? 'bg-[#1DBB8E] hover:bg-[#25BFA0] text-white ring-2 ring-[#1DBB8E]/50 animate-pulse'
                                : 'bg-[#1DBB8E] hover:bg-[#25BFA0] text-white'
                            }`}
                          >
                            <span>
                              {stepIndex < GROUNDING_STEPS.length - 1 ? 'Next Step' : 'Finish Grounding'}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {/* SCREEN 3: SOMATIC SHIFT SUMMARY (With clear metric explanation) */}
                    {screen === 'post_summary' && (
                      <motion.div
                        key="control-summary"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex-1 flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-4">
                          <div>
                            <span className="text-[11px] font-bold text-[#1DBB8E] uppercase tracking-wider block">
                              Practice Complete · 5 Senses Grounded
                            </span>
                            <h2 className="text-xl font-bold text-white tracking-tight">
                              Somatic Shift Summary
                            </h2>
                          </div>

                          {/* How are you feeling now pills */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-white block">
                              How are you feeling right now?
                            </label>
                            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Post feeling">
                              {(['Calmer 🌿', 'Same ⚖️', 'Still Overwhelmed 🌊'] as PostFeeling[]).map(
                                (feeling) => {
                                  const isSelected = postFeeling === feeling;
                                  return (
                                    <button
                                      key={feeling}
                                      type="button"
                                      onClick={() => handleSelectPostFeeling(feeling)}
                                      role="radio"
                                      aria-checked={isSelected}
                                      className={`py-3 px-2 rounded-xl border font-bold text-xs transition-all text-center cursor-pointer ${
                                        isSelected
                                          ? 'bg-[#09354E] border-[#1DBB8E] text-white shadow-md ring-2 ring-[#1DBB8E]/40'
                                          : 'bg-[#081E2E] border-[#1A4666] text-[#7E9EB8] hover:border-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {feeling}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>

                          {/* Somatic Shift Delta Card with Clear Explanation */}
                          {somaticShiftDelta && (
                            <div className="bg-[#081E2E] rounded-2xl border border-[#1DBB8E]/50 p-4 space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-[#1A4666]/60">
                                <div className="flex items-center gap-1.5">
                                  <Activity className="w-4 h-4 text-[#1DBB8E]" />
                                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                                    Distress Shift Delta
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-[#061826] bg-[#1DBB8E] px-2.5 py-0.5 rounded-full">
                                  {somaticShiftDelta.vagalStatusBadge}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-[#061826] border border-[#1A4666]">
                                  <span className="text-[#7E9EB8] text-[10px] block">Distress Shift</span>
                                  <span className="text-base font-bold text-[#1DBB8E]">
                                    {somaticShiftDelta.initialDistress}/5 → {somaticShiftDelta.estimatedPostScore}/5
                                  </span>
                                  <span className="text-[10px] text-[#2DD4BF] block">
                                    {somaticShiftDelta.percentShift}% downregulation
                                  </span>
                                </div>

                                <div className="p-2.5 rounded-xl bg-[#061826] border border-[#1A4666]">
                                  <span className="text-[#7E9EB8] text-[10px] block">Mindful Dwell</span>
                                  <span className="text-base font-bold text-white">
                                    {somaticShiftDelta.averageDwellSeconds}s
                                  </span>
                                  <span className="text-[10px] text-[#1DBB8E] block">
                                    {somaticShiftDelta.dwellPacingLabel}
                                  </span>
                                </div>
                              </div>

                              <p className="text-[11px] text-[#7E9EB8] leading-relaxed">
                                {somaticShiftDelta.isPacingOptimal
                                  ? 'Taking steady time with each anchor engages the parasympathetic vagal brake to calm racing thoughts.'
                                  : 'Mindful sensory exercise complete. Grounding reconnects your attention with your immediate physical environment.'}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Back to Self Care Library CTA */}
                        <div>
                          <button
                            type="button"
                            onClick={handleResetToSelfCare}
                            className="w-full py-3.5 px-6 rounded-2xl bg-[#1DBB8E] hover:bg-[#25BFA0] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Back to Self Care Library</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* WhatsApp Toast */}
      <AnimatePresence>
        {whatsappToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-22 right-6 z-50 bg-[#0A2436] border border-[#25D366] text-white px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs"
          >
            <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            <span>Connecting to Mannkaa Care WhatsApp Support...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. FLOATING WHATSAPP BUTTON (Matching Screenshots 1 & 2) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => {
            triggerAppHaptic('tap');
            setWhatsappToast(true);
            setTimeout(() => setWhatsappToast(false), 3500);
          }}
          className="w-13 h-13 rounded-full bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 shadow-2xl flex items-center justify-center text-white transition-all cursor-pointer"
          title="Chat with Mannkaa on WhatsApp"
          aria-label="Chat with Mannkaa on WhatsApp"
        >
          <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.41a8.167 8.167 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.14-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.87.85-.87 2.08 0 1.22.89 2.41 1.02 2.58.13.17 1.75 2.67 4.24 3.75.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.59.21-1.09.15-1.18-.07-.09-.23-.15-.48-.27" />
          </svg>
        </button>
      </div>

      {/* 4. MODAL: SETTINGS */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[380px] max-h-[90vh] overflow-y-auto bg-[#0A2436] border border-[#1A4666] rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#1A4666]">
                <h3 className="text-base font-bold text-white">Settings</h3>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-7 h-7 rounded-full bg-[#081E2E] border border-[#1A4666] flex items-center justify-center text-[#7E9EB8] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Daily Reminder */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D2D44] border border-[#1A4666]">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-[#2DD4BF]" />
                    <span className="text-sm font-semibold text-white">Daily Reminder</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#7E9EB8]" />
                </div>

                {/* Guided Voice Toggle & Voice Tone Selection */}
                <div className="p-3 rounded-2xl bg-[#0D2D44] border border-[#1A4666] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mic className="w-5 h-5 text-[#2DD4BF]" />
                      <div>
                        <span className="text-sm font-semibold text-white block">Guided Voice</span>
                        <span className="text-[10px] text-[#7E9EB8]">Soft unhurried narration</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerAppHaptic('tap');
                        setIsGuidedVoiceEnabled((prev) => !prev);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isGuidedVoiceEnabled ? 'bg-[#1DBB8E]' : 'bg-[#081E2E] border border-[#1A4666]'
                      }`}
                      aria-label="Toggle Guided Voice"
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          isGuidedVoiceEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {isGuidedVoiceEnabled && (
                    <div className="pt-2 border-t border-[#1A4666]/60 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-[#2DD4BF] uppercase tracking-wider">
                          Voice Tone &amp; Pacing
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            triggerAppHaptic('tap');
                            somaticNarrator.previewVoice();
                          }}
                          className="flex items-center gap-1 text-[11px] font-semibold text-[#1DBB8E] hover:underline cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test Voice</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-1.5">
                        {(Object.keys(VOICE_TONES) as VoiceTone[]).map((toneKey) => {
                          const config = VOICE_TONES[toneKey];
                          const isSelected = selectedVoiceTone === toneKey;
                          return (
                            <button
                              key={toneKey}
                              type="button"
                              onClick={() => {
                                triggerAppHaptic('tap');
                                setSelectedVoiceTone(toneKey);
                                somaticNarrator.setTone(toneKey);
                                somaticNarrator.previewVoice();
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                                isSelected
                                  ? 'bg-[#09354E] border-[#1DBB8E] text-white shadow-sm'
                                  : 'bg-[#081E2E] border-[#1A4666] text-[#7E9EB8] hover:border-slate-400 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{config.name}</span>
                                {isSelected && <span className="w-2 h-2 rounded-full bg-[#1DBB8E]" />}
                              </div>
                              <span className="text-[10px] text-[#7E9EB8] leading-tight">
                                {config.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Background Sound Configuration */}
                <div className="p-3 rounded-2xl bg-[#0D2D44] border border-[#1A4666] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Waves className="w-5 h-5 text-[#2DD4BF]" />
                      <div>
                        <span className="text-sm font-semibold text-white block">Background Sound</span>
                        <span className="text-[10px] text-[#7E9EB8]">Calming ambient audio</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        triggerAppHaptic('tap');
                        setIsBackgroundSoundEnabled((prev) => !prev);
                      }}
                      className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                        isBackgroundSoundEnabled ? 'bg-[#1DBB8E]' : 'bg-[#081E2E] border border-[#1A4666]'
                      }`}
                      aria-label="Toggle Background Sound"
                    >
                      <span
                        className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                          isBackgroundSoundEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {isBackgroundSoundEnabled && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAmbientType('water_waves');
                          triggerAppHaptic('tap');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          ambientType === 'water_waves'
                            ? 'bg-[#09354E] border-[#1DBB8E] text-white shadow-sm'
                            : 'bg-[#081E2E] border-[#1A4666] text-[#7E9EB8]'
                        }`}
                      >
                        <Waves className="w-3.5 h-3.5 text-[#2DD4BF]" />
                        <span>Ocean Waves</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setAmbientType('gentle_rain');
                          triggerAppHaptic('tap');
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 cursor-pointer ${
                          ambientType === 'gentle_rain'
                            ? 'bg-[#09354E] border-[#1DBB8E] text-white shadow-sm'
                            : 'bg-[#081E2E] border-[#1A4666] text-[#7E9EB8]'
                        }`}
                      >
                        <CloudRain className="w-3.5 h-3.5 text-[#38BDF8]" />
                        <span>Gentle Rain</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Tactile Haptics */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0D2D44] border border-[#1A4666]">
                  <div className="flex items-center gap-3">
                    <Vibrate className="w-5 h-5 text-[#2DD4BF]" />
                    <div>
                      <span className="text-sm font-semibold text-white block">Somatic Haptics</span>
                      <span className="text-[10px] text-[#7E9EB8]">Gentle tactile feedback</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsVibrationEnabled((prev) => {
                        const next = !prev;
                        if (next) triggerHaptic('tap', true);
                        return next;
                      });
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      isVibrationEnabled ? 'bg-[#1DBB8E]' : 'bg-[#081E2E] border border-[#1A4666]'
                    }`}
                    aria-label="Toggle Haptics"
                  >
                    <span
                      className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                        isVibrationEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-3 rounded-full bg-[#1DBB8E] hover:bg-[#25BFA0] text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Save &amp; Return
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: EXIT CONFIRMATION */}
      <AnimatePresence>
        {showExitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[340px] bg-[#0A2436] border border-[#1A4666] rounded-3xl p-5 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-bold text-white">Pause Grounding Reset?</h3>
              <p className="text-xs text-[#7E9EB8] leading-relaxed">
                You can step away at any time. Your body is always safe to pause and return when ready.
              </p>
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 py-3 rounded-full bg-[#081E2E] border border-[#1A4666] text-[#7E9EB8] hover:text-white font-semibold text-xs cursor-pointer"
                >
                  Continue Reset
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitModal(false);
                    handleResetToSelfCare();
                  }}
                  className="flex-1 py-3 rounded-full bg-[#1DBB8E] hover:bg-[#25BFA0] text-white font-bold text-xs cursor-pointer"
                >
                  Exit Safely
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}