# FIFA Career Manager

> A full-stack web application for EA FC Career Mode managers to log matches, plan tactics, scout players, and keep the history of their multi-season career saves.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

---

## Overview

FIFA Career Manager bridges the gap between console or PC gameplay and career statistics tracking. Built with React, TypeScript, and Supabase, it lets football gaming enthusiasts log match statistics, design tactical lineups, scout transfer targets, archive past seasons, and showcase trophies. Every user only sees their own data, enforced by Row Level Security in the database.

---

## Core Features and Modules

### 1. Multi-Career Save Management
- Track multiple separate career saves (for example, Real Madrid, Arsenal, or Boca Juniors).
- Switch seamlessly between manager saves with persistent active season tracking.

### 2. Interactive Drag and Drop Tactical Pitch (`Tactics.tsx`)
- **20 EA FC Formations**: `4-3-3 Attack`, `4-3-3 Holding`, `4-2-3-1`, `4-4-2`, `3-5-2`, `5-3-2`, and more.
- **Native Drag and Drop**: Swap starters and bench players directly on the pitch canvas.
- **Real-Time Team Ratings**: Auto-calculates overall Squad Rating, Attack (ATT), Midfield (MID), and Defense (DEF).
- **Position Badges and Auto-Translate Protection**: Enforces position role constraints with `translate="no"` guards to prevent browser translation artifacts.

### 3. Squad Management and Auto-Sorting (`Squad.tsx`)
- **Structured Group Sorting**: Auto-sorts squad lists logically by position group (`GK -> DEF -> MID -> FWD`).
- **Country Flags**: Dynamic ISO and FIFA country flag rendering via FlagCDN.
- **Contract and Tenure Tracking**: Calculates player tenure years and age.
- **Persistent Squad Status**: Track injury status (`INJ`), market valuation, and wage structure.

### 4. Mobile-First Touch Match Logger and Auto Clean Sheets (`Stats.tsx`)
- **Mobile Step and Tab Navigation**: Step-by-step touch navigation (`1. Outcome & MVP`, `2. Starters`, `3. Substitutes`).
- **Starting XI Appearance Scoping**: Only the 11 tactical starters automatically receive Matches Played (`matches_played`).
- **Substitution Tracker**: Starter substitution selectors and bench entry toggles.
- **Automatic Clean Sheets**: Auto-credits clean sheets to Goalkeepers and Defenders when conceding 0 goals, respecting full-match participation.

### 5. Authentic Trophy Cabinet and Season Archives (`History.tsx`)
- **Realistic SVG Trophy Badges**: Authentic visual renders for UEFA Champions League, Copa Libertadores, League Shields, Domestic Cups, Ballon d'Or, Golden Boot, and Golden Glove.
- **Top 3 Most Influential Players Podium**: Automated season impact ranking (#1 Gold, #2 Silver, #3 Bronze) calculated by goals, assists, and MVP awards.
- **Dual Cabinet Shelves**: Dedicated shelves for Club Trophies and Individual Player Awards.

### 6. Scouting and Transfer Hub (`Scouting.tsx`)
- **4 Watchlist Categories**: `Wonderkids`, `Transfer Targets`, `Free Agents`, and `Players to Sell`.
- **Squad Auto-Fill**: Selecting "Players to Sell" brings up a dropdown of your existing squad members to auto-fill their profile and market valuation.
- **"Sign to Club" Workflow**: Direct modal to sign scouted targets directly into your active squad with custom weekly wages.

### 7. Dynamic OVR Tier Highlights
- **5 Visual Rating Tiers**:
  - **90+**: Glowing gold neon gradient badge.
  - **85-89**: Gold and amber metallic badge.
  - **80-84**: Emerald green badge with glowing border.
  - **75-79**: Cyan and blue badge.
  - **< 75**: Slate gray badge.

---

## System Architecture

### Data Flow and State Management

```
+-----------------------------------------------------------+
|                      React Components                     |
|    (Dashboard, Squad, Tactics, Stats, History, Scouting)  |
+-------------+-------------------------------+-------------+
              | Calls Hook Actions            | Reads State
              v                               |
+---------------------------------------------+-------------+
|                 Zustand Global State Stores               |
|       - useAppStore.ts    (Active Career & Season)        |
|       - useTacticsStore.ts (Lineups & Formations)         |
+-------------+-------------------------------+-------------+
              | Executes DB Queries           | Updates State
              v                               |
+---------------------------------------------+-------------+
|                 Custom React Hooks Layer                  |
|  (useCareers, usePlayers, useMatches, useScouting, etc.)  |
+-------------+-------------------------------+-------------+
              | Supabase Client               | Response
              v                               |
+---------------------------------------------+-------------+
|                 Supabase PostgreSQL Backend               |
+-----------------------------------------------------------+
```

---

## Database Relational Schema

The PostgreSQL database schema is managed via Supabase and comprises the following entity relationships:

- **`careers`**: Stores career saves (`id`, `user_id`, `manager_name`, `club_name`, `created_at`).
- **`seasons`**: Multi-season records per career (`id`, `career_id`, `season_number`, `year_label`, `is_closed`).
- **`players`**: Player profiles linked to a career save (`id`, `career_id`, `full_name`, `preferred_position`, `nationality`, `joined_year`).
- **`season_stats`**: Per-season stats for players (`id`, `season_id`, `player_id`, `ovr_start`, `ovr_end`, `goals`, `assists`, `matches_played`, `clean_sheets`, `salary`, `is_injured`). Counters are derived from `match_events`.
- **`matches`**: Logged match results (`id`, `season_id`, `opponent`, `competition`, `team_score`, `opponent_score`, `result`, `mvp_player_id`, `match_date`).
- **`match_events`**: Player performances per match (`id`, `match_id`, `player_id`, `played`, `goals`, `assists`, `yellow_card`, `red_card`, `clean_sheet`, `injured`). Written only through the `log_match`, `update_match` and `delete_match` functions.
- **`scouting_list`**: Watchlist entries (`id`, `career_id`, `full_name`, `position`, `list_type`, `estimated_value`).
- **`trophies`**: Club and player awards (`id`, `season_id`, `trophy_name`, `trophy_type`, `icon`).

---

## Project Directory Structure

```
fifa-career-manager/
|-- public/                     # Static assets and favicon
|-- src/
|   |-- components/             # Reusable UI components
|   |   |-- history/            # TrophyCabinet, SeasonSummary, TrophyIcons
|   |   |-- layout/             # AppLayout, Sidebar, BottomNav
|   |   |-- scouting/           # ScoutCard
|   |   `-- tactics/            # PitchBoard, BenchList, formationPositions
|   |-- hooks/                  # Custom React hooks (usePlayers, useMatches, etc.)
|   |-- lib/                    # Helper constants, country flags, OVR badge styles
|   |-- pages/                  # Main route views (Squad, Tactics, Stats, etc.)
|   |-- store/                  # Zustand global stores (useAppStore, useTacticsStore)
|   |-- types/                  # Database TypeScript interfaces
|   |-- App.tsx                 # App router and layout entry
|   |-- main.tsx                # React DOM render entry
|   `-- index.css               # Global styles and Tailwind CSS directives
|-- supabase/
|   |-- migrations/             # Numbered SQL migrations (run in order)
|   `-- scripts/                # One-time data fixes, not migrations
|-- .github/                    # CI workflow, PR template, Dependabot
|-- .env.example                # Supabase API key configuration template
|-- LICENSE                     # MIT
|-- package.json
|-- tailwind.config.js          # Tailwind theme and color definitions
|-- tsconfig.json               # TypeScript compiler config
`-- vite.config.ts              # Vite bundle config
```

---

## Getting Started and Local Setup

Follow these steps to run the application locally on your machine:

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- A **Supabase** account (Free Tier works as intended) and an empty Supabase project

### 1. Clone the Repository
```bash
git clone https://github.com/Santiagocapi/fifa-career-manager.git
cd fifa-career-manager
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory by copying the template (it is git-ignored):
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials (Project Settings -> API). Use the public anon / publishable key only, never the `service_role` or secret key:
```env
VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

### 4. Create the Database Schema
In the Supabase dashboard open **SQL Editor** and run every file in `supabase/migrations/` **in numeric order** (`001_...` first). Each migration enables Row Level Security on the tables it creates.

Files in `supabase/scripts/` are one-time data fixes for a specific database and are **not** needed on a fresh install.

### 5. Configure Authentication
In the Supabase dashboard:
1. **Authentication -> Providers -> Email**: enable **Confirm email** and set the minimum password length to 8.
2. **Authentication -> URL Configuration**: set **Site URL** to your deployed URL and add `http://localhost:5173/**` to **Redirect URLs** so local development keeps working.
3. **Project Settings -> Authentication -> SMTP**: connect your own SMTP provider. The default Supabase mail server only allows a few emails per hour, which blocks sign-ups as soon as several people register in a short time.

### 6. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## Contribution Guidelines

Contributions are welcome. To maintain high code quality and consistency, please adhere to the following workflow:

### Branch Naming Conventions
- `feat/feature-name`: New features or UI components
- `fix/bug-description`: Bug fixes or patch resolutions
- `docs/documentation-update`: Documentation or README updates
- `refactor/scope`: Code cleanup or performance optimizations

### Commit Conventions (Conventional Commits)
All commit messages should follow the Conventional Commits specification:
- `feat: add 3-5-2 formation scheme`
- `fix: correct auto clean sheet calculation for substitutes`
- `docs: add system architecture diagram`

### Pull Request Checklist
1. Ensure `npx tsc -b`, `npm run lint` and `npm run build` pass with 0 errors (CI runs the same checks).
2. Verify responsive layout on mobile screens (`< 640px`) and desktop screens.
3. Add a numbered migration in `supabase/migrations/` for any schema change and update `src/types/database.ts` in the same PR.
4. Include a detailed summary of changes in the PR description.

---

## License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more details.

## Disclaimer

This is an independent fan project. It is not affiliated with, endorsed by, or sponsored by Electronic Arts Inc. or EA SPORTS. EA SPORTS FC and related names are trademarks of their respective owners.
