'use client';

import { useSyncExternalStore } from 'react';
import { BarterAgreement, BARTER_COMPANY_FIELDS, DEFAULT_BARTER_AGREEMENT } from '@/lib/barter-agreement';

const STORAGE_KEY = 'ecoexpo_barter_agreement_v1';
let snapshot: BarterAgreement | null = null;
const listeners = new Set<() => void>();

function readAgreement(): BarterAgreement {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return DEFAULT_BARTER_AGREEMENT;
    const next = { ...DEFAULT_BARTER_AGREEMENT, company: { ...DEFAULT_BARTER_AGREEMENT.company } };
    for (const key of Object.keys(DEFAULT_BARTER_AGREEMENT) as (keyof BarterAgreement)[]) {
      if (typeof DEFAULT_BARTER_AGREEMENT[key] === 'string' && typeof saved[key] === 'string') {
        Object.assign(next, { [key]: saved[key] });
      }
    }
    for (const [field] of BARTER_COMPANY_FIELDS) {
      if (typeof saved.company?.[field] === 'string') next.company[field] = saved.company[field];
    }
    for (const key of ['offererTerms', 'offereeTerms'] as const) {
      if (Array.isArray(saved[key])) next[key] = saved[key].filter((term: unknown) => typeof term === 'string');
    }
    if (typeof saved.showSignature === 'boolean') next.showSignature = saved.showSignature;
    if (typeof saved.fontSize === 'number') next.fontSize = Math.min(14, Math.max(10, saved.fontSize));
    if (typeof saved.lineSpacing === 'number') next.lineSpacing = Math.min(1.7, Math.max(1.15, saved.lineSpacing));
    return next;
  } catch {
    return DEFAULT_BARTER_AGREEMENT;
  }
}

function getSnapshot() {
  return snapshot ??= readAgreement();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      snapshot = readAgreement();
      listeners.forEach((notify) => notify());
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export function useBarterAgreement() {
  const agreement = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_BARTER_AGREEMENT);
  const updateAgreement = (partial: Partial<BarterAgreement>) => {
    snapshot = { ...getSnapshot(), ...partial };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch {
      // Retain edits for this session even if browser storage is unavailable.
    }
    listeners.forEach((notify) => notify());
  };
  const resetDesign = () => updateAgreement({
    title: DEFAULT_BARTER_AGREEMENT.title,
    logoUrl: DEFAULT_BARTER_AGREEMENT.logoUrl,
    fontSize: DEFAULT_BARTER_AGREEMENT.fontSize,
    lineSpacing: DEFAULT_BARTER_AGREEMENT.lineSpacing,
  });
  return { agreement, updateAgreement, resetDesign };
}
