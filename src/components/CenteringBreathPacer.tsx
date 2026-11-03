import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkle, Wind } from 'lucide-react';

export type BreathState = 'idle' | 'active';
export type BreathPhase = 'Inhale' | 'Hold' | 'Exhale' | 'Rest';

interface CenteringBreathPacerProps {
  state?: BreathState;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  sublabel?: string;
  onPhaseChange?: (phase: BreathPhase) => void;
  className?: string;
}

export const CenteringBreathPacer: React.FC<CenteringBreathPacerProps> = ({
  state = 'active',
  interactive = true,
  size = 'md',
  label = 'BREATHE',
  sublabel = '4-4-4 Rhythm',
  onPhaseChange,
  className = '',
}) => {
  const [internalState, setInternalState] = useState<BreathState>(state);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('Inhale');
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);

  // Sync prop state if controlled
  useEffect(() => {
    setInternalState(state);
  }, [state]);

  // Active 4-4-4-2 Breath Engine (Inhale 4s -> Hold 4s -> Exhale 4s -> Rest 2s)
  useEffect(() => {
    if (internalState !== 'active') {
      setCurrentPhase('Inhale');
      setPhaseSecondsLeft(4);
      return;
    }

    onPhaseChange?.('Inhale');

    const interval = setInterval(() => {
      setPhaseSecondsLeft((prev) => {
        if (prev > 1) return prev - 1;

        // Transition phase
        let nextDuration = 4;
        setCurrentPhase((prevPhase) => {
          let nextPhase: BreathPhase = 'Inhale';
          if (prevPhase === 'Inhale') {
            nextPhase = 'Hold';
            nextDuration = 4;
          } else if (prevPhase === 'Hold') {
            nextPhase = 'Exhale';
            nextDuration = 4;
          } else if (prevPhase === 'Exhale') {
            nextPhase = 'Rest';
            nextDuration = 2;
          } else {
            nextPhase = 'Inhale';
            nextDuration = 4;
          }

          onPhaseChange?.(nextPhase);
          return nextPhase;
        });

        return nextDuration;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [internalState, onPhaseChange]);

  // Responsive scale dimensions
  const dimensions = {
    sm: {
      box: 'w-48 h-48',
      coreBadge: 'w-24 h-24',
      iconSize: 'w-6 h-6',
      labelSize: 'text-[9px]',
      sublabelSize: 'text-[8px]',
    },
    md: {
      box: 'w-64 h-64 sm:w-72 sm:h-72',
      coreBadge: 'w-32 h-32 sm:w-36 sm:h-36',
      iconSize: 'w-8 h-8',
      labelSize: 'text-[11px]',
      sublabelSize: 'text-[9px]',
    },
    lg: {
      box: 'w-80 h-80 sm:w-96 sm:h-96',
      coreBadge: 'w-40 h-40 sm:w-44 sm:h-44',
      iconSize: 'w-10 h-10',
      labelSize: 'text-xs',
      sublabelSize: 'text-[10px]',
    },
  }[size];

  // Visual animation variants based on state and phase
  const isIdle = internalState === 'idle';

  return (
    <div
      className={`relative flex flex-col items-center justify-center select-none ${dimensions.box} ${className}`}
      onClick={() => {
        if (interactive) {
          setInternalState((prev) => (prev === 'idle' ? 'active' : 'idle'));
        }
      }}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={interactive ? 'Click to toggle 4-4-4 rhythmic breathing' : undefined}
    >
      {/* 1. OUTER GLOW RING (Smooth organic expansion on Inhale, dimming on Exhale) */}
      <motion.div
        animate={
          isIdle
            ? {
                scale: [1, 1.15, 1],
                opacity: [0.18, 0.38, 0.18],
              }
            : currentPhase === 'Inhale'
            ? {
                scale: 1.35,
                opacity: 0.5,
              }
            : currentPhase === 'Hold'
            ? {
                scale: [1.35, 1.37, 1.35],
                opacity: [0.5, 0.6, 0.5],
              }
            : currentPhase === 'Exhale'
            ? {
                scale: 1.0,
                opacity: 0.15,
              }
            : {
                scale: 1.0,
                opacity: 0.18,
              }
        }
        transition={
          isIdle
            ? {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : currentPhase === 'Hold'
            ? {
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {
                duration: currentPhase === 'Rest' ? 2 : 4,
                ease: [0.4, 0, 0.2, 1], // cubic-bezier(0.4, 0, 0.2, 1)
              }
        }
        className="absolute inset-0 rounded-full blur-2xl pointer-events-none bg-gradient-to-tr from-[#1FB99D]/40 to-[#2DD4BF]/50"
      />

      {/* 2. MIDDLE FLUID RIPPLE RING (Staggered cubic-bezier fluid motion in SVG) */}
      <motion.div
        animate={
          isIdle
            ? {
                scale: [0.95, 1.12, 0.95],
                rotate: [0, 45, 90],
                opacity: [0.35, 0.7, 0.35],
              }
            : currentPhase === 'Inhale'
            ? {
                scale: 1.25,
                rotate: 90,
                opacity: 0.85,
              }
            : currentPhase === 'Hold'
            ? {
                scale: [1.25, 1.28, 1.25],
                rotate: [90, 95, 90],
                opacity: [0.85, 1, 0.85],
              }
            : currentPhase === 'Exhale'
            ? {
                scale: 0.92,
                rotate: 180,
                opacity: 0.35,
              }
            : {
                scale: 0.95,
                rotate: 200,
                opacity: 0.4,
              }
        }
        transition={
          isIdle
            ? {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : currentPhase === 'Hold'
            ? {
                duration: 0.8,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : {
                duration: currentPhase === 'Rest' ? 2 : 4,
                ease: [0.4, 0, 0.2, 1], // cubic-bezier(0.4, 0, 0.2, 1)
              }
        }
        className="absolute inset-4 rounded-full border-2 border-dashed border-[#2DD4BF]/50 pointer-events-none"
        style={{
          boxShadow: '0 0 25px rgba(45, 212, 191, 0.25)',
        }}
      />

      {/* Second Ripple Ring for Layered Depth */}
      <motion.div
        animate={
          isIdle
            ? {
                scale: [1.08, 0.92, 1.08],
                opacity: [0.2, 0.5, 0.2],
              }
            : currentPhase === 'Inhale'
            ? {
                scale: 1.15,
                opacity: 0.7,
              }
            : currentPhase === 'Hold'
            ? {
                scale: [1.15, 1.18, 1.15],
                opacity: [0.7, 0.85, 0.7],
              }
            : {
                scale: 0.98,
                opacity: 0.25,
              }
        }
        transition={
          isIdle
            ? {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 0.4,
              }
            : {
                duration: currentPhase === 'Rest' ? 2 : 4,
                ease: [0.4, 0, 0.2, 1],
              }
        }
        className="absolute inset-8 rounded-full border border-[#1FB99D]/40 pointer-events-none"
      />

      {/* 3. CORE BADGE HOUSING SPARKLE ICON & LABELS */}
      <motion.div
        animate={
          isIdle
            ? {
                scale: [1, 1.04, 1],
              }
            : currentPhase === 'Inhale'
            ? {
                scale: 1.12,
              }
            : currentPhase === 'Hold'
            ? {
                scale: [1.12, 1.14, 1.12],
                x: [0, -1, 1, 0], // Gentle somatic vibration on hold
              }
            : {
                scale: 1.0,
              }
        }
        transition={
          isIdle
            ? {
                duration: 6,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : currentPhase === 'Hold'
            ? {
                duration: 0.25,
                repeat: Infinity,
              }
            : {
                duration: currentPhase === 'Rest' ? 2 : 4,
                ease: [0.4, 0, 0.2, 1],
              }
        }
        className={`relative z-20 rounded-full bg-gradient-to-br from-[#0D2D44] via-[#071521] to-[#041B2D] border-2 border-[#2DD4BF]/70 flex flex-col items-center justify-center shadow-2xl p-3 text-center transition-colors ${dimensions.coreBadge} ${
          interactive ? 'cursor-pointer hover:border-[#1FB99D] hover:shadow-[0_0_30px_rgba(45,212,191,0.4)]' : ''
        }`}
      >
        {/* Subtle radial inner glow */}
        <div className="absolute inset-0 rounded-full bg-radial from-[#2DD4BF]/15 to-transparent pointer-events-none" />

        {/* 4-pointed Sparkle Icon */}
        <div className="relative">
          <Sparkle className={`${dimensions.iconSize} text-[#2DD4BF] animate-pulse drop-shadow-[0_0_8px_rgba(45,212,191,0.8)]`} />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            className="absolute -inset-1 rounded-full border border-[#2DD4BF]/20 pointer-events-none"
          />
        </div>

        {/* Primary Badge Label */}
        <span className={`font-extrabold text-white tracking-widest uppercase mt-1.5 drop-shadow-sm ${dimensions.labelSize}`}>
          {isIdle ? label : currentPhase}
        </span>

        {/* Sublabel / Phase Countdown */}
        <span className={`font-semibold text-[#1FB99D] tracking-wider uppercase ${dimensions.sublabelSize}`}>
          {isIdle ? sublabel : `${phaseSecondsLeft}s`}
        </span>

        {/* Active Breathing Indicator Dot */}
        <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF] mt-1 shadow-[0_0_6px_#2DD4BF]" />
      </motion.div>
    </div>
  );
};
