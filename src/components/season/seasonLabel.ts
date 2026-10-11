// ============================================================
// src/components/season/seasonLabel.ts
// Suggested name for the next season of a career.
// ============================================================

import type { Season } from '../../types/database';

// "2024/2025" → "2025/2026", "2025" → "2026"; falls back to the
// current calendar year when the last label has no year in it.
export const suggestNextSeasonLabel = (seasons: Season[]): string => {
  const last = seasons[seasons.length - 1]?.year_label ?? '';
  const pair = last.match(/(\d{4})(\D+)(\d{4})/);
  if (pair) return `${Number(pair[1]) + 1}${pair[2]}${Number(pair[3]) + 1}`;
  const single = last.match(/\d{4}/);
  if (single) return String(Number(single[0]) + 1);
  const year = new Date().getFullYear();
  return `${year}/${year + 1}`;
};
