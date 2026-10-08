// ============================================================
// src/components/layout/navItems.ts
// Single source of truth for the app sections, shared by the
// desktop Sidebar and the mobile BottomNav / "Más" sheet.
// ============================================================

import { House, Shirt, Swords, Telescope, Trophy, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Bottom tab on phones; the rest live in the "Más" sheet */
  primary: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Inicio',    description: 'Resumen de la temporada',     icon: House,     primary: true },
  { to: '/squad',     label: 'Plantilla', description: 'Jugadores, medias y valores', icon: Users,     primary: true },
  { to: '/stats',     label: 'Partidos',  description: 'Resultados y estadísticas',   icon: Swords,    primary: true },
  { to: '/tactics',   label: 'Tácticas',  description: 'Formación y once inicial',    icon: Shirt,     primary: true },
  { to: '/scouting',  label: 'Mercado',   description: 'Promesas, objetivos y ventas', icon: Telescope, primary: false },
  { to: '/history',   label: 'Historial', description: 'Temporadas y trofeos',        icon: Trophy,    primary: false },
];
