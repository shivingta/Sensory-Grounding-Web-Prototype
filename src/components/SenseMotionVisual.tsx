import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, Hand, Ear, Wind, Check, Sparkle } from 'lucide-react';
import { TongueIcon } from './TongueIcon';
import { SenseKey } from '../logic/groundingMachine';

interface SenseMotionVisualProps {
  senseKey: SenseKey;
  stepNumber: number;
  senseName: string;
  targetCount: number;
  completedCount: number;
  currentCue?: string;
  onRegisterAnchor?: () => void;
  isNarratorSpeaking?: boolean;
}

const SENSE_THEMES: Record<
  SenseKey,
  {
    title: string;
    anchorLabel: string;
    description: string;
    accentColor: string;
    glowColor: string;
    icon: React.ElementType;
  }
> = {
  sight: {
    title: 'Sight Awareness',
    anchorLabel: 'Sight Anchor',
    description: 'Look around your room & notice physical details',
    accentColor: '#2DD4BF',
    glowColor: 'rgba(45, 212, 191, 0.35)',
    icon: Eye,
  },
  touch: {
    title: 'Physical Touch',
    anchorLabel: 'Touch Anchor',
    description: 'Feel textures & contact points supporting you',
    accentColor: '#38BDF8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    icon: Hand,
  },
  sound: {
    title: 'Auditory Awareness',
    anchorLabel: 'Sound Anchor',
    description: 'Listen past obvious sounds into quiet room tones',
    accentColor: '#818CF8',
    glowColor: 'rgba(129, 140, 248, 0.35)',
    icon: Ear,
  },
  smell: {
    title: 'Subtle Scent',
    anchorLabel: 'Scent Anchor',
    description: 'Breathe softly through your nose & notice the air',
    accentColor: '#34D399',
    glowColor: 'rgba(52, 211, 153, 0.35)',
    icon: Wind,
  },
  taste: {
    title: 'Presence & Taste',
    anchorLabel: 'Taste Anchor',
    description: 'Rest your tongue softly and ground in 1 physical sensation',
    accentColor: '#FB7185',
    glowColor: 'rgba(251, 113, 133, 0.35)',
    icon: TongueIcon,
  },
};

export function SenseMotionVisual({
  senseKey,
  stepNumber,
  senseName,
  targetCount,
  completedCount,
  currentCue,
  onRegisterAnchor,
  isNarratorSpeaking = false,
}: SenseMotionVisualProps) {
  const theme = SENSE_THEMES[senseKey] || SENSE_THEMES.sight;
  const isComplete = completedCount >= targetCount;

  // Gentle breath pacing rhythm (Inhale 4s, Exhale 4s) for subtle bottom guidance
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Exhale'>('Inhale');

  useEffect(() => {
    const timer = setInterval(() => {
      setBreathPhase((prev) => (prev === 'Inhale' ? 'Exhale' : 'Inhale'));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const progressPercent = Math.min(100, Math.round((completedCount / targetCount) * 100));

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full p-4 select-none">
      {/* Top Header Pill with Clear Layperson Title */}
      <div className="text-center space-y-1 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#061826]/90 border border-[#1A4666] text-xs font-semibold">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accentColor }} />
          <span className="text-slate-200">
            Step {5 - stepNumber + 1} of 5 · {theme.title}
          </span>
          <span className="text-[#7E9EB8]">·</span>
          <span className="text-[#2DD4BF] font-mono">
            {completedCount}/{targetCount} Noticed
          </span>
        </div>
      </div>

      {/* Central Interactive Motion Graphic Canvas (Clean, Focused Sensory Stage) */}
      <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72 my-auto">
        {/* Calm Ambient Breathing Halo */}
        <motion.div
          animate={{
            scale: breathPhase === 'Inhale' ? [1, 1.25] : [1.25, 1],
            opacity: breathPhase === 'Inhale' ? [0.15, 0.35] : [0.35, 0.15],
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: theme.glowColor }}
        />

        {/* Circular Progress Arc */}
        <svg className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] -rotate-90 pointer-events-none z-10" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="#1A4666"
            strokeWidth="3"
            opacity="0.6"
          />
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke={isComplete ? '#1DBB8E' : theme.accentColor}
            strokeWidth="4.5"
            strokeDasharray="578"
            strokeDashoffset={578 - (578 * progressPercent) / 100}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Clickable Motion Graphic Orb */}
        <button
          type="button"
          onClick={onRegisterAnchor}
          disabled={isComplete}
          className={`relative z-20 w-44 h-44 sm:w-48 sm:h-48 rounded-full flex flex-col items-center justify-center p-4 transition-all duration-300 focus:outline-none cursor-pointer group ${
            isComplete
              ? 'bg-[#081E2E] border-2 border-[#1DBB8E] text-[#1DBB8E] shadow-[0_0_35px_rgba(29,187,142,0.35)] cursor-default'
              : 'bg-gradient-to-br from-[#0D2D44] to-[#061826] border-2 border-[#1A4666] hover:border-[#2DD4BF] text-white hover:scale-[1.02] active:scale-95 shadow-2xl'
          }`}
          style={{
            boxShadow: !isComplete ? `0 0 30px ${theme.glowColor}` : undefined,
          }}
          aria-label={isComplete ? `${senseName} anchors complete` : `Register next anchor for ${senseName}`}
        >
          {/* SENSE 5: SIGHT (Concentric Expanding Iris Motion Graphic) */}
          {senseKey === 'sight' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
              {[1, 2, 3].map((idx) => (
                <motion.div
                  key={idx}
                  className="absolute rounded-full border border-[#2DD4BF]/25"
                  style={{ width: `${idx * 48}px`, height: `${idx * 48}px` }}
                  animate={{
                    scale: [0.95, 1.15, 0.95],
                    opacity: [0.2, 0.6, 0.2],
                    rotate: [0, 90, 180],
                  }}
                  transition={{
                    duration: 5 + idx,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.3,
                  }}
                />
              ))}
            </div>
          )}

          {/* SENSE 4: TOUCH (Tactile Radial Ripple Motion Graphic) */}
          {senseKey === 'touch' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
              {[1, 2, 3].map((idx) => (
                <motion.div
                  key={idx}
                  className="absolute rounded-3xl border border-[#38BDF8]/30"
                  style={{ width: `${idx * 52}px`, height: `${idx * 52}px` }}
                  animate={{
                    scale: [0.9, 1.2, 0.9],
                    opacity: [0.2, 0.7, 0.2],
                    borderRadius: ['30%', '48%', '30%'],
                  }}
                  transition={{
                    duration: 4.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.4,
                  }}
                />
              ))}
            </div>
          )}

          {/* SENSE 3: SOUND (Harmonious Equalizer Wave Motion Graphic) */}
          {senseKey === 'sound' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-1.5 opacity-60">
                {[14, 26, 42, 58, 42, 26, 14].map((h, i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-[#818CF8] to-[#2DD4BF] rounded-full"
                    animate={{
                      height: [h * 0.4, h, h * 0.4],
                      opacity: [0.3, 0.9, 0.3],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.12,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SENSE 2: SMELL (Ethereal Upward Scent Mist Motion Graphic) */}
          {senseKey === 'smell' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
              {[0, 1, 2].map((idx) => (
                <motion.div
                  key={idx}
                  className="absolute w-20 h-20 rounded-full border border-[#34D399]/30 bg-[#34D399]/5"
                  animate={{
                    y: [15, -35],
                    scale: [0.7, 1.25],
                    opacity: [0, 0.5, 0],
                    x: [idx % 2 === 0 ? -10 : 10, idx % 2 === 0 ? 10 : -10],
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.7,
                  }}
                />
              ))}
            </div>
          )}

          {/* SENSE 1: TASTE (Centering Palate & Tongue Resting Waves Motion Graphic) */}
          {senseKey === 'taste' && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden rounded-full">
              {[1, 2, 3].map((idx) => (
                <motion.div
                  key={idx}
                  className="absolute rounded-full border border-[#FB7185]/30 bg-[#FB7185]/5"
                  style={{ width: `${idx * 50}px`, height: `${idx * 50}px` }}
                  animate={{
                    scale: [0.9, 1.18, 0.9],
                    opacity: [0.2, 0.55, 0.2],
                    borderRadius: ['44%', '50%', '44%'],
                  }}
                  transition={{
                    duration: 3.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.45,
                  }}
                />
              ))}
              <motion.div
                animate={{ scale: [0.85, 1.25], opacity: [0.45, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                className="w-20 h-20 rounded-full border border-[#FB7185]/40"
              />
            </div>
          )}

          {/* Center Icon & Understandable Status Text */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-1">
            {isComplete ? (
              <>
                <div className="w-12 h-12 rounded-full bg-[#1DBB8E]/20 flex items-center justify-center">
                  <Check className="w-7 h-7 text-[#1DBB8E] stroke-[3]" />
                </div>
                <span className="text-xs font-bold text-[#1DBB8E] tracking-wider uppercase mt-1">
                  All Noticed
                </span>
                <span className="text-[10px] text-slate-300">Ready for next sense</span>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-full bg-[#061826]/80 border border-[#1A4666] group-hover:border-[#2DD4BF] transition-colors">
                  <theme.icon className="w-6 h-6 stroke-[2.2]" style={{ color: theme.accentColor }} />
                </div>
                <span className="text-xs font-bold text-white tracking-wide block">
                  {theme.anchorLabel}
                </span>
                <span className="text-[10px] text-[#2DD4BF] font-semibold block">
                  Click or Press Space
                </span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Bottom Pacing & Breath Guidance Callout */}
      <div className="w-full max-w-sm text-center space-y-1.5 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#061826]/80 border border-[#1A4666] text-xs">
          <span className="text-[#7E9EB8]">Breathing Pace:</span>
          <span className="font-bold text-white uppercase tracking-wider text-[11px]">
            {breathPhase} (4s)
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#1DBB8E] animate-ping" />
        </div>

        <p className="text-[11px] text-[#7E9EB8] leading-tight">
          Click the card or press <kbd className="px-1.5 py-0.5 rounded bg-[#0D2D44] border border-[#1A4666] text-white font-mono text-[10px]">Space</kbd> as you notice each anchor.
        </p>
      </div>
    </div>
  );
}
