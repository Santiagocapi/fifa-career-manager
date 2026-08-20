// ============================================================
// src/components/history/TrophyIcons.tsx
// Authentic SVG Football Trophy Badge Components (Champions League,
// League Title, Cup, Ballon d'Or, Golden Boot, Golden Glove).
// ============================================================

import React from "react";

export type IconicTrophyKey =
  | "champions"
  | "league"
  | "cup"
  | "ballon_dor"
  | "golden_boot"
  | "golden_glove"
  | "playmaker"
  | "other";

interface TrophyIconProps {
  type: IconicTrophyKey | string;
  className?: string;
  size?: number;
}

export function TrophyIcon({ type, className = "", size = 48 }: TrophyIconProps) {
  const normalized = (type || "").toLowerCase();

  if (normalized.includes("champions") || normalized.includes("libertadores") || normalized === "champions") {
    // UEFA Champions League / Copa Libertadores ("Big Ears")
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <defs>
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
        </defs>
        {/* Base */}
        <rect x="22" y="52" width="20" height="6" rx="2" fill="#334155" stroke="url(#silverGrad)" strokeWidth="1" />
        <rect x="26" y="46" width="12" height="6" fill="url(#silverGrad)" />
        {/* Cup Body */}
        <path d="M 20 18 Q 16 38 32 46 Q 48 38 44 18 Z" fill="url(#silverGrad)" stroke="#475569" strokeWidth="1.5" />
        {/* Handles (Big Ears) */}
        <path d="M 20 20 C 8 16 10 34 22 36" fill="none" stroke="url(#silverGrad)" strokeWidth="4" strokeLinecap="round" />
        <path d="M 44 20 C 56 16 54 34 42 36" fill="none" stroke="url(#silverGrad)" strokeWidth="4" strokeLinecap="round" />
        {/* Top Rim & Star Aura */}
        <ellipse cx="32" cy="18" rx="12" ry="3" fill="url(#goldRim)" />
        <polygon points="32,22 34,26 38,26 35,29 36,33 32,30 28,33 29,29 26,26 30,26" fill="#fbbf24" opacity="0.9" />
      </svg>
    );
  }

  if (normalized.includes("league") || normalized.includes("liga") || normalized === "league") {
    // League Title (Meisterschale / Premier League Gold Trophy)
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>
        {/* Pedestal */}
        <rect x="20" y="52" width="24" height="6" rx="2" fill="#1e293b" stroke="url(#goldGrad)" strokeWidth="1" />
        <rect x="25" y="44" width="14" height="8" fill="url(#goldGrad)" />
        {/* Crown Shield */}
        <path d="M 32 10 L 48 20 V 36 Q 32 48 32 48 Q 32 48 16 36 V 20 Z" fill="url(#goldGrad)" stroke="#78350f" strokeWidth="1.5" />
        {/* Crown Peaks */}
        <path d="M 22 22 L 27 30 L 32 20 L 37 30 L 42 22 V 32 H 22 Z" fill="#fff" opacity="0.4" />
        <circle cx="32" cy="36" r="4" fill="#fff" opacity="0.8" />
      </svg>
    );
  }

  if (normalized.includes("ballon") || normalized.includes("golden ball") || normalized === "ballon_dor") {
    // Ballon d'Or / Golden Ball
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <defs>
          <radialGradient id="ballonGold" cx="35%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#fff7ed" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="85%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>
        </defs>
        {/* Pyrites Base */}
        <path d="M 22 48 L 18 58 H 46 L 42 48 Z" fill="#334155" stroke="#fbbf24" strokeWidth="1" />
        <rect x="26" y="44" width="12" height="4" fill="#fbbf24" />
        {/* Golden Ball */}
        <circle cx="32" cy="26" r="18" fill="url(#ballonGold)" stroke="#b45309" strokeWidth="1.5" />
        {/* Pentagon Pattern */}
        <polygon points="32,18 37,22 35,27 29,27 27,22" fill="#78350f" opacity="0.5" />
        <line x1="32" y1="18" x2="32" y2="10" stroke="#78350f" strokeWidth="1" />
        <line x1="37" y1="22" x2="44" y2="20" stroke="#78350f" strokeWidth="1" />
        <line x1="35" y1="27" x2="41" y2="33" stroke="#78350f" strokeWidth="1" />
        <line x1="29" y1="27" x2="23" y2="33" stroke="#78350f" strokeWidth="1" />
        <line x1="27" y1="22" x2="20" y2="20" stroke="#78350f" strokeWidth="1" />
      </svg>
    );
  }

  if (normalized.includes("boot") || normalized.includes("botin") || normalized === "golden_boot") {
    // Golden Boot (Botin de Oro)
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <defs>
          <linearGradient id="bootGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>
        {/* Pedestal */}
        <rect x="14" y="50" width="36" height="8" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1" />
        {/* Shoe Silhouette */}
        <path d="M 16 38 C 16 38 24 38 30 32 L 40 32 C 48 32 52 42 50 46 H 16 V 38 Z" fill="url(#bootGold)" stroke="#78350f" strokeWidth="1.5" />
        {/* Cleats Studs */}
        <rect x="20" y="46" width="3" height="4" fill="#fbbf24" />
        <rect x="28" y="46" width="3" height="4" fill="#fbbf24" />
        <rect x="38" y="46" width="3" height="4" fill="#fbbf24" />
        <rect x="44" y="46" width="3" height="4" fill="#fbbf24" />
      </svg>
    );
  }

  if (normalized.includes("glove") || normalized.includes("guante") || normalized === "golden_glove") {
    // Golden Glove (Guante de Oro)
    return (
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
        <defs>
          <linearGradient id="gloveGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#854d0e" />
          </linearGradient>
        </defs>
        {/* Base */}
        <rect x="20" y="52" width="24" height="6" rx="2" fill="#1e293b" stroke="#eab308" strokeWidth="1" />
        {/* Glove Palm & Fingers */}
        <path d="M 22 48 V 32 Q 22 24 26 24 Q 28 24 28 30 V 16 Q 28 12 32 12 Q 36 12 36 18 V 16 Q 36 12 40 12 Q 44 12 44 20 V 48 Z" fill="url(#gloveGold)" stroke="#713f12" strokeWidth="1.5" />
        <path d="M 22 34 Q 16 34 16 38 Q 16 42 22 44 Z" fill="url(#gloveGold)" stroke="#713f12" strokeWidth="1.5" />
      </svg>
    );
  }

  // Generic Cup Trophy (Domestic Cup / Default)
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <defs>
        <linearGradient id="classicGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <rect x="20" y="52" width="24" height="6" rx="2" fill="#1e293b" stroke="url(#classicGold)" strokeWidth="1" />
      <rect x="26" y="44" width="12" height="8" fill="url(#classicGold)" />
      <path d="M 20 14 H 44 V 28 C 44 38 32 44 32 44 C 32 44 20 38 20 28 V 14 Z" fill="url(#classicGold)" stroke="#78350f" strokeWidth="1.5" />
      <path d="M 20 18 H 14 C 10 18 10 30 20 30" fill="none" stroke="url(#classicGold)" strokeWidth="3" />
      <path d="M 44 18 H 50 C 54 18 54 30 44 30" fill="none" stroke="url(#classicGold)" strokeWidth="3" />
    </svg>
  );
}
