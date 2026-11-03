import React from 'react';

export interface TongueIconProps {
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number | string;
}

/**
 * Clean, clinical Tongue & Palate SVG icon matching Lucide design standards.
 * Replaces the arbitrary 'Sparkles' stars for the Taste sensory grounding stage.
 */
export const TongueIcon: React.FC<TongueIconProps> = ({
  className = 'w-6 h-6',
  style,
  strokeWidth = 2,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`inline-block ${className}`}
    style={style}
    aria-hidden="true"
  >
    {/* Upper lip / palate soft arch */}
    <path d="M 3 10 C 6 7 8 8 12 8 C 16 8 18 7 21 10" />
    
    {/* Tongue perimeter extending downward in resting presence */}
    <path d="M 5 10 C 5.5 16 8 20 12 20 C 16 20 18.5 16 19 10" />
    
    {/* Median sulcus (tongue center groove) */}
    <path d="M 12 11 L 12 16" />
    
    {/* Tongue tip soft contour */}
    <path d="M 8.5 14 C 9.5 17 10.8 17.5 12 17.5 C 13.2 17.5 14.5 17 15.5 14" />
  </svg>
);
