import React from 'react';

export interface GroundingTreeIconProps {
  className?: string;
  stageId?: number | string | null;
  /**
   * Optional custom interactive hover or click
   */
  interactive?: boolean;
  onNodeClick?: (nodeKey: string, stepNumber: number) => void;
}

export const GroundingTreeIcon: React.FC<GroundingTreeIconProps> = ({
  className = 'w-12 h-12 md:w-16 md:h-16',
  stageId = null,
  interactive = false,
  onNodeClick,
}) => {
  // Normalize stageId to stepNumber (5 = Sight, 4 = Touch, 3 = Sound, 2 = Smell, 1 = Taste)
  const activeStep: number | null = (() => {
    if (typeof stageId === 'number') return stageId;
    if (typeof stageId === 'string') {
      const lower = stageId.toLowerCase();
      if (lower.includes('sight') || lower.includes('5')) return 5;
      if (lower.includes('touch') || lower.includes('4')) return 4;
      if (lower.includes('sound') || lower.includes('ear') || lower.includes('hear') || lower.includes('3')) return 3;
      if (lower.includes('smell') || lower.includes('scent') || lower.includes('nose') || lower.includes('2')) return 2;
      if (lower.includes('taste') || lower.includes('mouth') || lower.includes('tongue') || lower.includes('1')) return 1;
    }
    return null;
  })();

  const isSightActive = activeStep === 5;
  const isTouchActive = activeStep === 4;
  const isAuditoryActive = activeStep === 3;
  const isSmellActive = activeStep === 2;
  const isTasteActive = activeStep === 1;

  const activeGlowFilter = 'drop-shadow(0 0 10px rgba(45, 212, 191, 0.95)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.9))';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width="100%"
      height="100%"
      className={`shrink-0 transition-transform ${className}`}
      aria-hidden="true"
    >
      <defs>
        <style>{`
          .tree-bg-circle { fill: #65b1c8; }
          .tree-outer-ring { fill: none; stroke: #94d0de; stroke-width: 9; }
          .tree-orbit-dash { fill: none; stroke: #aae0ea; stroke-width: 4.5; stroke-dasharray: 8 10; stroke-linecap: round; }
          
          .tree-canopy { fill: #66a578; stroke: #193630; stroke-width: 4.5; stroke-linejoin: round; }
          .tree-trunk { fill: #9e7350; stroke: #193630; stroke-width: 4.5; stroke-linejoin: round; }
          .tree-branch { fill: none; stroke: #193630; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
          .tree-root-branch { fill: none; stroke: #193630; stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; }
          
          .tree-node-circle { fill: #b8e6ea; stroke: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
          .tree-sense-line { fill: none; stroke: #193630; stroke-width: 3.5; stroke-linecap: round; stroke-linejoin: round; }
          .tree-sense-fill { fill: #193630; }

          .tree-node-active .tree-node-circle {
            fill: #ffffff;
            stroke: #2DD4BF;
            stroke-width: 3;
          }
          .tree-node-group {
            transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), filter 0.35s ease;
          }
        `}</style>
      </defs>

      {/* Background Base & Outer Ring */}
      <circle cx="250" cy="250" r="236" className="tree-bg-circle" />
      <circle cx="250" cy="250" r="236" className="tree-outer-ring" />

      {/* Dotted Orbit Track */}
      <path d="M 103 325 A 165 165 0 0 1 90 230" className="tree-orbit-dash" />
      <path d="M 97 205 A 165 165 0 0 1 140 148" className="tree-orbit-dash" />
      <path d="M 160 130 A 165 165 0 0 1 224 97" className="tree-orbit-dash" />
      <path d="M 276 97 A 165 165 0 0 1 340 130" className="tree-orbit-dash" />
      <path d="M 360 148 A 165 165 0 0 1 403 205" className="tree-orbit-dash" />
      <path d="M 410 230 A 165 165 0 0 1 397 325" className="tree-orbit-dash" />

      {/* Grounding Tree & Roots */}
      <g id="grounding-tree">
        {/* Roots */}
        <g className="tree-root-branch">
          <path d="M 244 330 C 242 360 238 385 220 410 M 234 375 C 220 395 200 410 180 415" />
          <path d="M 256 330 C 258 360 262 385 280 410 M 266 375 C 280 395 300 410 320 415" />
          <path d="M 250 335 L 250 422" />
          <path d="M 235 320 C 205 345 175 365 145 372 M 190 350 C 170 370 150 390 130 395" />
          <path d="M 225 325 C 190 355 160 375 135 380 M 205 335 C 180 355 160 365 140 368" />
          <path d="M 215 340 C 195 365 175 388 158 408" />
          <path d="M 265 320 C 295 345 325 365 355 372 M 310 350 C 330 370 350 390 370 395" />
          <path d="M 275 325 C 310 355 340 375 365 380 M 295 335 C 320 355 340 365 360 368" />
          <path d="M 285 340 C 305 365 325 388 342 408" />
        </g>

        {/* Trunk */}
        <path
          d="M 232 332 C 238 290 234 250 220 225 L 280 225 C 266 250 262 290 268 332 C 256 335 244 335 232 332 Z"
          className="tree-trunk"
        />

        {/* Canopy */}
        <path
          d="M 198 282 
             C 170 285 155 260 162 235 
             C 140 225 142 192 166 180 
             C 158 152 185 130 214 140 
             C 230 122 270 122 286 140 
             C 315 130 342 152 334 180 
             C 358 192 360 225 338 235 
             C 345 260 330 285 302 282 
             C 285 295 215 295 198 282 Z"
          className="tree-canopy"
        />

        {/* Branches */}
        <g className="tree-branch">
          <path d="M 234 230 C 228 205 210 188 185 178" />
          <path d="M 205 195 C 185 192 168 202 160 215" />
          <path d="M 215 198 C 210 178 195 165 180 160" />
          <path d="M 195 186 C 198 170 208 158 218 152" />
          <path d="M 250 230 L 250 155" />
          <path d="M 250 190 C 238 175 228 162 225 150" />
          <path d="M 250 190 C 262 175 272 162 275 150" />
          <path d="M 266 230 C 272 205 290 188 315 178" />
          <path d="M 295 195 C 315 192 332 202 340 215" />
          <path d="M 285 198 C 290 178 305 165 320 160" />
          <path d="M 305 186 C 302 170 292 158 282 152" />
        </g>
      </g>

      {/* 7 Sensory Nodes with Interactive Highlighting */}

      {/* Top Center: Spiral Sound Wave */}
      <g
        id="badge-spiral-sound"
        className={`tree-node-group ${isAuditoryActive ? 'tree-node-active' : ''}`}
        transform={`translate(250, 95) scale(${isAuditoryActive ? 1.15 : 1})`}
        style={{
          filter: isAuditoryActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-spiral-sound', 3)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path
          d="M 0 10 A 10 10 0 0 1 -10 0 A 10 10 0 0 1 0 -10 A 14 14 0 0 1 14 4 A 18 18 0 0 1 -4 18"
          className="tree-sense-line"
          strokeWidth="3"
        />
        <circle cx="0" cy="0" r="3.5" className="tree-sense-fill" />
      </g>

      {/* Top Left: Eye (Sight - Step 5) */}
      <g
        id="badge-sight-eye"
        className={`tree-node-group ${isSightActive ? 'tree-node-active' : ''}`}
        transform={`translate(150, 138) scale(${isSightActive ? 1.15 : 1})`}
        style={{
          filter: isSightActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-sight-eye', 5)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path d="M -16 0 Q 0 -12 16 0 Q 0 12 -16 0 Z" className="tree-sense-line" />
        <circle cx="0" cy="0" r="7" className="tree-sense-line" fill={isSightActive ? '#ffffff' : '#65b1c8'} />
        <circle cx="0" cy="0" r="3.2" className="tree-sense-fill" />
      </g>

      {/* Top Right: Ear (Auditory - Step 3) */}
      <g
        id="badge-auditory-ear"
        className={`tree-node-group ${isAuditoryActive ? 'tree-node-active' : ''}`}
        transform={`translate(350, 138) scale(${isAuditoryActive ? 1.15 : 1})`}
        style={{
          filter: isAuditoryActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-auditory-ear', 3)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path
          d="M -5 11 C -10 11 -11 5 -11 -2 C -11 -10 -5 -15 3 -15 C 10 -15 14 -9 14 -2 C 14 6 7 8 5 11 C 3 13 -1 14 -3 14"
          className="tree-sense-line"
        />
        <path d="M -2 -3 C 3 -3 4 1 2 4 C 1 6 -2 7 -4 7" className="tree-sense-line" strokeWidth="2.5" />
      </g>

      {/* Middle Left: Touch Hand (Step 4) */}
      <g
        id="badge-touch-hand"
        className={`tree-node-group ${isTouchActive ? 'tree-node-active' : ''}`}
        transform={`translate(92, 222) scale(${isTouchActive ? 1.15 : 1})`}
        style={{
          filter: isTouchActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-touch-hand', 4)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path
          d="M -10 6 L -10 -2 C -10 -5 -7 -5 -7 -2 L -7 5 
             M -6 -1 L -6 -8 C -6 -11 -3 -11 -3 -8 L -3 5 
             M -2 -1 L -2 -9 C -2 -12 1 -12 1 -9 L 1 5 
             M 2 2 L 2 -4 C 2 -7 5 -7 5 -4 L 5 6 
             M 5 6 C 5 6 9 6 10 2 C 11 -1 9 -2 8 -1 L 5 8"
          className="tree-sense-line"
          strokeWidth="2.6"
        />
        <path d="M -10 6 C -10 13 5 14 5 7" className="tree-sense-line" strokeWidth="2.6" />
      </g>

      {/* Middle Right: Smell Nose (Step 2) */}
      <g
        id="badge-smell-nose"
        className={`tree-node-group ${isSmellActive ? 'tree-node-active' : ''}`}
        transform={`translate(408, 222) scale(${isSmellActive ? 1.15 : 1})`}
        style={{
          filter: isSmellActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-smell-nose', 2)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path d="M -4 -13 L 2 2 C 4 6 5 8 1 8 C -3 8 -5 6 -4 3" className="tree-sense-line" />
        <path d="M 1 8 C -2 10 -5 10 -7 7" className="tree-sense-line" strokeWidth="2.4" />
      </g>

      {/* Bottom Left: Taste Tongue (Step 1) */}
      <g
        id="badge-taste-tongue"
        className={`tree-node-group ${isTasteActive ? 'tree-node-active' : ''}`}
        transform={`translate(118, 322) scale(${isTasteActive ? 1.15 : 1})`}
        style={{
          filter: isTasteActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-taste-tongue', 1)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path d="M -13 -3 C -7 -7 7 -7 13 -3 C 10 12 -10 12 -13 -3 Z" className="tree-sense-line" />
        <path d="M -7 -1 C -7 8 7 8 7 -1" className="tree-sense-line" strokeWidth="2.5" />
        <path d="M 0 1 L 0 6" className="tree-sense-line" strokeWidth="2.5" />
      </g>

      {/* Bottom Right: Mouth Lips (Taste / Breath) */}
      <g
        id="badge-mouth-lips"
        className={`tree-node-group ${isTasteActive ? 'tree-node-active' : ''}`}
        transform={`translate(382, 322) scale(${isTasteActive ? 1.15 : 1})`}
        style={{
          filter: isTasteActive ? activeGlowFilter : 'none',
          cursor: interactive ? 'pointer' : 'default',
        }}
        onClick={() => onNodeClick?.('badge-mouth-lips', 1)}
      >
        <circle cx="0" cy="0" r="28" className="tree-node-circle" />
        <path d="M -14 0 Q -7 -7 0 -3 Q 7 -7 14 0 Q 7 8 0 7 Q -7 8 -14 0 Z" className="tree-sense-line" />
        <path d="M -14 0 Q 0 2 14 0" className="tree-sense-line" strokeWidth="2.2" />
      </g>
    </svg>
  );
};
