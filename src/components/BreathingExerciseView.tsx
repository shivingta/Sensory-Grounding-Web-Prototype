import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wind, Pause, Play, RotateCcw, ChevronLeft, Check, Grid, Sliders, Settings } from 'lucide-react';

export interface BreathingExerciseViewProps {
  onBackToLibrary: () => void;
  onOpenSettings: () => void;
}

type BreathingLevel = 'Beginner' | 'Intermediate' | 'Advance';

interface LevelOption {
  level: BreathingLevel;
  rounds: number;
  durationLabel: string;
}

const LEVELS: LevelOption[] = [
  { level: 'Beginner', rounds: 10, durationLabel: '~2 Min' },
  { level: 'Intermediate', rounds: 15, durationLabel: '~3 Min' },
  { level: 'Advance', rounds: 20, durationLabel: '~4 Min' },
];

export const BreathingExerciseView: React.FC<BreathingExerciseViewProps> = ({
  onBackToLibrary,
  onOpenSettings,
}) => {
  const [selectedLevel, setSelectedLevel] = useState<BreathingLevel>('Beginner');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(1);
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);

  const currentLevelConfig = LEVELS.find((l) => l.level === selectedLevel) || LEVELS[0];

  // Active breathing round timer (12s per round = Inhale 4s, Hold 4s, Exhale 4s)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setPhaseSecondsLeft((prev) => {
          if (prev > 1) return prev - 1;

          // Transition phase
          setPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            // Finished round
            setCurrentRound((r) => {
              if (r >= currentLevelConfig.rounds) {
                setIsRunning(false);
                return 1;
              }
              return r + 1;
            });
            return 'Inhale';
          });
          return 4;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentLevelConfig.rounds]);

  const handleStartStop = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setPhase('Inhale');
      setPhaseSecondsLeft(4);
      setCurrentRound(1);
      setIsRunning(true);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-4 space-y-6">
      {/* Clean Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLibrary}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7E9EB8] hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-[#081E2E] border border-[#1A4666]"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Self Care Library</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider block">Box Breathing</span>
          <span className="text-[11px] text-[#2DD4BF] font-medium">Parasympathetic Reset</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-[#081E2E] border border-[#1A4666] text-[#7E9EB8] hover:text-white transition-colors cursor-pointer"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Main 2-Column Responsive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Left Column: Visual Meditation Card with Glassmorphic Rhythm Badge */}
        <div className="relative rounded-3xl overflow-hidden border border-[#1A4666] bg-[#081E2E] shadow-2xl flex flex-col justify-between min-h-[420px] lg:min-h-[460px]">
          {/* Peaceful visual photo backdrop */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061826] via-[#081E2E]/80 to-[#0B253A]/90 z-0">
            {/* Ambient water wave graphic */}
            <svg
              className="absolute inset-0 w-full h-full object-cover opacity-35"
              viewBox="0 0 400 400"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <radialGradient id="ocean-glow" cx="50%" cy="40%" r="50%">
                  <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#081E2E" stopOpacity="0" />
                </radialGradient>
              </defs>
              <circle cx="200" cy="180" r="160" fill="url(#ocean-glow)" />
            </svg>
          </div>

          {/* Central Active Breathing Halo */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              animate={{
                scale: isRunning
                  ? phase === 'Inhale'
                    ? [1, 1.25]
                    : phase === 'Hold'
                    ? 1.25
                    : [1.25, 1]
                  : [1, 1.08, 1],
              }}
              transition={{
                duration: isRunning ? 4 : 4.5,
                repeat: isRunning ? 0 : Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center border-2 border-[#1DBB8E]/50 shadow-[0_0_50px_rgba(29,187,142,0.25)] bg-[#0D2D44]/90"
            >
              <Wind className="w-8 h-8 text-[#2DD4BF] mb-1" />
              <span className="text-sm font-extrabold text-white uppercase tracking-wider">
                {isRunning ? phase : 'Box Breathing'}
              </span>
              <span className="text-2xl font-black text-[#1DBB8E] mt-0.5 font-mono">
                {isRunning ? `${phaseSecondsLeft}s` : '4 · 4 · 4'}
              </span>
              {isRunning && (
                <span className="text-[10px] text-[#7E9EB8] font-semibold mt-1">
                  Round {currentRound} of {currentLevelConfig.rounds}
                </span>
              )}
            </motion.div>
          </div>

          {/* Bottom Glassmorphic Inhale / Hold / Exhale Pill matching Screenshot 2 */}
          <div className="relative z-10 m-4 p-3 rounded-2xl bg-[#081E2E]/80 backdrop-blur-md border border-[#1A4666]/80 flex items-center justify-around text-center">
            <div className={`flex-1 ${isRunning && phase === 'Inhale' ? 'text-[#1DBB8E]' : 'text-slate-300'}`}>
              <span className="block text-[11px] font-bold">Inhale : 4s</span>
            </div>
            <div className="w-px h-6 bg-[#1A4666]" />
            <div className={`flex-1 ${isRunning && phase === 'Hold' ? 'text-[#2DD4BF]' : 'text-slate-300'}`}>
              <span className="block text-[11px] font-bold">Hold : 4s</span>
            </div>
            <div className="w-px h-6 bg-[#1A4666]" />
            <div className={`flex-1 ${isRunning && phase === 'Exhale' ? 'text-[#1DBB8E]' : 'text-slate-300'}`}>
              <span className="block text-[11px] font-bold">Exhale : 4s</span>
            </div>
          </div>
        </div>

        {/* Right Column: Level Selection & Start CTA matching Screenshot 2 */}
        <div className="rounded-3xl border border-[#1A4666] bg-[#0A2436] p-6 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white tracking-tight">Choose a level</h2>

            {/* Table Header */}
            <div className="flex items-center justify-between text-xs text-[#2DD4BF] font-semibold px-3 pb-1 border-b border-[#1A4666]/60">
              <span className="w-1/3">Level</span>
              <span className="w-1/3 text-center">Rounds</span>
              <span className="w-1/3 text-right">~Duration</span>
            </div>

            {/* Radio Selection List */}
            <div className="space-y-2">
              {LEVELS.map((item) => {
                const isSelected = selectedLevel === item.level;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => {
                      if (!isRunning) setSelectedLevel(item.level);
                    }}
                    disabled={isRunning}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#0D2D44] border-[#1DBB8E] text-white shadow-md shadow-[#1DBB8E]/20'
                        : 'bg-[#081E2E] border-[#1A4666] text-[#7E9EB8] hover:border-slate-400 hover:text-white'
                    } ${isRunning ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-1/3 flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-[#1DBB8E] bg-[#1DBB8E]' : 'border-[#7E9EB8]'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#061826]" />}
                      </div>
                      <span className="font-semibold text-white">{item.level}</span>
                    </div>

                    <span className="w-1/3 text-center font-mono font-medium text-slate-200">
                      {item.rounds}
                    </span>

                    <span className="w-1/3 text-right font-medium text-[#7E9EB8]">
                      {item.durationLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 1 Breathing Round info strip matching Screenshot 2 */}
            <div className="p-3 rounded-2xl bg-[#081E2E] border border-[#1A4666] text-center">
              <span className="text-xs font-semibold text-[#2DD4BF]">
                1 breathing round = 12 seconds
              </span>
            </div>
          </div>

          {/* Primary Action Start Button matching Screenshot 2 */}
          <div className="pt-4">
            <button
              type="button"
              onClick={handleStartStop}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isRunning
                  ? 'bg-[#E11D48] hover:bg-[#BE123C] text-white shadow-[#E11D48]/30'
                  : 'bg-[#1DBB8E] hover:bg-[#25BFA0] text-white shadow-[#1DBB8E]/30 active:scale-[0.98]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" />
                  <span>Pause Exercise</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
