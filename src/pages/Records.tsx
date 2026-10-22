// ============================================================
// src/pages/Records.tsx
// Career records across every season: overall balance, all-time
// leaders, best streaks, standout matches, and the breakdown by
// season and by competition.
// ============================================================

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Medal } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useCareerRecords } from '../hooks/useCareerRecords';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import InlineAlert from '../components/ui/InlineAlert';
import SeasonRecord from '../components/matches/SeasonRecord';
import { computeCareerRecords } from '../components/records/careerRecords';
import AllTimeLeaders from '../components/records/AllTimeLeaders';
import StreakRecords from '../components/records/StreakRecords';
import MatchRecords from '../components/records/MatchRecords';
import { CompetitionsTable, SeasonsTable } from '../components/records/BreakdownTables';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function Records() {
  const { activeCareer } = useAppStore();
  const { data, loading, error } = useCareerRecords(activeCareer?.id ?? null);
  const records = useMemo(() => computeCareerRecords(data), [data]);

  const subtitle = loading
    ? 'Toda tu carrera'
    : [
        plural(data.seasons.length, 'temporada', 'temporadas'),
        plural(records.summary.played, 'partido', 'partidos'),
        plural(records.trophies, 'trofeo', 'trofeos'),
      ].join(' · ');

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Récords" subtitle={subtitle} />

      {error && <InlineAlert>{error}</InlineAlert>}

      {loading ? (
        <div className="flex flex-col gap-5" role="status" aria-label="Cargando récords">
          <div className="skeleton h-[188px] rounded-2xl" />
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="skeleton h-[320px] rounded-2xl" />
            <div className="skeleton h-[320px] rounded-2xl" />
          </div>
        </div>
      ) : records.summary.played === 0 ? (
        <EmptyState
          className="card"
          icon={Medal}
          title="Aún no hay récords"
          description="Aparecerán en cuanto registres partidos: goleadas, rachas, máximos goleadores de la carrera…"
          action={
            <Link to="/stats" className="btn-primary">
              Ir a Partidos
            </Link>
          }
        />
      ) : (
        <>
          <SeasonRecord matches={records.matchesNewestFirst} title="Balance de la carrera" />

          <div className="grid items-start gap-5 lg:grid-cols-2">
            <AllTimeLeaders leaders={records.leaders} />
            <StreakRecords streaks={records.streaks} />
          </div>

          <MatchRecords
            biggestWin={records.biggestWin}
            heaviestLoss={records.heaviestLoss}
            highestScoring={records.highestScoring}
            bestIndividual={records.bestIndividual}
          />

          <section className="card overflow-hidden" aria-labelledby="by-season-title">
            <h2 id="by-season-title" className="section-title px-4 pb-2 pt-4 sm:px-5">
              Temporada a temporada
            </h2>
            <SeasonsTable rows={records.bySeason} />
          </section>

          <section className="card overflow-hidden" aria-labelledby="by-competition-title">
            <h2 id="by-competition-title" className="section-title px-4 pb-2 pt-4 sm:px-5">
              Por competición
            </h2>
            <CompetitionsTable rows={records.byCompetition} />
          </section>
        </>
      )}
    </div>
  );
}
