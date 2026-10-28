import type { Currency } from '@/lib/floorplan/types';

/** Public, standalone viewer context. No dashboard accounts or booking commands. */
export interface ViewProps {
  state: {
    accounts: { id: string; role: 'exhibitor' | 'admin' }[];
    editions: { id: string; series: string; year: number; status: string; currency: Currency }[];
    policy: { holdHours: number };
  };
  context: { accountId: string; editionId?: string; editionIds?: string[] };
  readOnly: boolean;
}

export const standaloneFloorplan: ViewProps = {
  state: {
    accounts: [{ id: 'formstudio-floorplan', role: 'exhibitor' }],
    editions: [
      { id: 'bitma-2027', series: 'BITMA', year: 2027, status: 'preparation', currency: 'USD' },
      { id: 'dta-2026', series: 'DTA', year: 2026, status: 'sales-open', currency: 'USD' },
    ],
    policy: { holdHours: 24 },
  },
  context: { accountId: 'formstudio-floorplan' },
  readOnly: false,
};

export function visibleEditions(state: ViewProps['state'], _context: ViewProps['context']) {
  return state.editions;
}

export const money = (amount: number, currency: Currency) =>
  new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount / 100);
