// ============================================================
// src/components/tactics/FormationPicker.tsx
// Quick chips for the most used formations plus a select with
// all of them.
// ============================================================

import type { FormationScheme } from '../../types/database';
import { FORMATIONS, getFormationLabel } from '../../lib/constants';

const QUICK_FORMATIONS: FormationScheme[] = ['4-3-3 Attack', '4-3-3 Holding', '4-2-3-1', '4-4-2', '3-5-2'];

interface FormationPickerProps {
  value: FormationScheme;
  onChange: (scheme: FormationScheme) => void;
}

export default function FormationPicker({ value, onChange }: FormationPickerProps) {
  return (
    <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center" translate="no">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as FormationScheme)}
        aria-label="Formación"
        className="font-semibold lg:w-64"
      >
        {FORMATIONS.map(({ scheme, label }) => (
          <option key={scheme} value={scheme}>
            {label}
          </option>
        ))}
      </select>

      <div role="group" aria-label="Formaciones habituales" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6 md:mx-0 md:px-0">
        {QUICK_FORMATIONS.map((scheme) => (
          <button
            key={scheme}
            type="button"
            aria-pressed={value === scheme}
            onClick={() => onChange(scheme)}
            className="chip"
          >
            {getFormationLabel(scheme)}
          </button>
        ))}
      </div>
    </div>
  );
}
