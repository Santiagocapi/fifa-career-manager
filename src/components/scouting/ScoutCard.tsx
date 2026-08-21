// ============================================================
// src/components/scouting/ScoutCard.tsx
// Interactive Card for Scouted Players / Transfer Targets / Sell List.
// ============================================================

import React from "react";
import { clsx } from "clsx";
import type { ScoutingEntry, ScoutingListType } from "../../types/database";
import {
  POSITION_COLORS,
  getPositionGroup,
  formatValue,
  getCountryCode,
  SCOUTING_LIST_TYPES,
} from "../../lib/constants";
import { Globe, Trash2, UserPlus, FileText, Building, ArrowRight } from "lucide-react";

interface ScoutCardProps {
  entry: ScoutingEntry;
  onMove: (id: string, newListType: ScoutingListType) => void;
  onDelete: (id: string) => void;
  onSignPlayer?: (entry: ScoutingEntry) => void;
}

export default function ScoutCard({
  entry,
  onMove,
  onDelete,
  onSignPlayer,
}: ScoutCardProps) {
  const group = getPositionGroup(entry.position ?? "CM");
  const colors = POSITION_COLORS[group];
  const countryCode = getCountryCode(entry.nationality);
  const isSellList = entry.list_type === "sell";

  return (
    <div className="card p-3.5 flex flex-col justify-between gap-3 group hover:border-white/20 transition-all shadow-md hover:-translate-y-0.5 bg-[#0b111e]/90">
      {/* Top Header: Name, Position, Flag, OVR & Delete */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {entry.position && (
              <span
                translate="no"
                className={clsx(
                  "badge text-[9px] font-black px-1.5 py-0.2 rounded uppercase shadow-sm",
                  colors.badge
                )}
              >
                {entry.position}
              </span>
            )}
            <h4 className="font-extrabold text-white text-sm truncate group-hover:text-amber-300 transition-colors">
              {entry.full_name}
            </h4>
          </div>

          <div className="flex items-center gap-2 mt-1">
            {countryCode && (
              <div className="flex items-center gap-1 text-[11px] text-white/50">
                <img
                  src={`https://flagcdn.com/w40/${countryCode}.png`}
                  alt={entry.nationality ?? ""}
                  className="w-3.5 h-2.5 object-cover rounded-[2px] shadow-sm flex-shrink-0"
                />
                <span className="truncate">{entry.nationality}</span>
              </div>
            )}
            {entry.current_club && (
              <span className="text-[11px] text-white/40 flex items-center gap-1 truncate">
                <Building size={10} className="flex-shrink-0" />
                {entry.current_club}
              </span>
            )}
          </div>
        </div>

        {/* OVR Rating Badge & Delete Action */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {entry.current_ovr ? (
            <div className="w-9 h-9 rounded-xl bg-pitch-700/80 border border-pitch-600 flex items-center justify-center font-mono font-black text-amber-300 text-sm shadow-inner">
              {entry.current_ovr}
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-pitch-700/40 border border-white/10 flex items-center justify-center font-mono font-bold text-white/30 text-xs">
              ?
            </div>
          )}

          <button
            onClick={() => onDelete(entry.id)}
            className="btn-danger p-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
            title="Remove from scouting"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Middle Info: Valuation & Notes */}
      <div className="flex flex-col gap-1.5 pt-1 border-t border-[#1e293b]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
            Est. Value
          </span>
          <span className="font-mono font-extrabold text-emerald-400 text-xs">
            {entry.estimated_value ? formatValue(entry.estimated_value) : "N/A"}
          </span>
        </div>

        {entry.notes && (
          <div className="flex items-start gap-1.5 p-2 rounded-xl bg-white/5 border border-white/5 mt-0.5">
            <FileText size={12} className="text-amber-400/80 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/70 italic line-clamp-2 leading-relaxed">
              "{entry.notes}"
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions: Sign to Club button (if not sell list) & Category Switcher */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#1e293b]">
        {!isSellList && onSignPlayer && (
          <button
            onClick={() => onSignPlayer(entry)}
            className="btn-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 w-full shadow-md font-bold"
          >
            <UserPlus size={14} /> Fichar al Club
          </button>
        )}

        {/* Move to another category pills */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none opacity-80 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-white/40 uppercase font-bold mr-1 flex-shrink-0">
            Mover:
          </span>
          {SCOUTING_LIST_TYPES.filter((t) => t.value !== entry.list_type).map((t) => (
            <button
              key={t.value}
              onClick={() => onMove(entry.id, t.value)}
              className="text-[10px] text-white/60 hover:text-white transition-colors px-2 py-0.5 rounded-md bg-[#141e33] hover:bg-amber-400/20 border border-[#223254] hover:border-amber-400/40 flex-shrink-0 flex items-center gap-1"
              title={`Mover a ${t.label}`}
            >
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label.split(" ")[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
