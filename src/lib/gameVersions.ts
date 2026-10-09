// ============================================================
// src/lib/gameVersions.ts
// Game editions a career can belong to (careers.game_version).
// Kept out of constants.ts so the app shell (sidebar, top bar)
// does not pull the country list into the first download.
// ============================================================

// Newest first; add a line when a new edition comes out (the database
// only checks the format).
export const GAME_VERSIONS: { value: string; label: string }[] = [
  { value: 'FC27',   label: 'EA SPORTS FC 27' },
  { value: 'FC26',   label: 'EA SPORTS FC 26' },
  { value: 'FC25',   label: 'EA SPORTS FC 25' },
  { value: 'FC24',   label: 'EA SPORTS FC 24' },
  { value: 'FIFA23', label: 'FIFA 23' },
  { value: 'FIFA22', label: 'FIFA 22' },
  { value: 'FIFA21', label: 'FIFA 21' },
];

// Short badge text: "FC27" → "FC 27", "FIFA23" → "FIFA 23"
export const getGameVersionShort = (value: string | null | undefined): string | null =>
  value ? value.replace(/^(FIFA|FC)(\d+)$/, '$1 $2') : null;
