"use client";
import { useSyncExternalStore } from 'react';
import { validateOffer } from './model';
import type { ServiceRecord } from './types';

export const OFFER_STORAGE_KEY = 'ecoexpo-formstudio-offers-v1';
const CHANGE = 'ecoexpo-formstudio-offers-change';
const empty: ServiceRecord[] = [];
const serverSnapshot = { records: empty, error: '', ready: false };
const blockedSnapshot = { records: empty, error: 'Browser storage is unavailable. Offer letters cannot be saved until storage is enabled.', ready: true };
let cachedRaw: string | null | undefined;
let cached = serverSnapshot;

function recordsSnapshot() {
  let raw: string | null;
  try { raw = window.localStorage.getItem(OFFER_STORAGE_KEY); } catch { return blockedSnapshot; }
  if (raw === cachedRaw) return cached;
  cachedRaw = raw;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : empty;
    if (!Array.isArray(parsed) || parsed.some(record => !record || record.module !== 'offerletter' || typeof record.id !== 'string' || typeof record.title !== 'string' || typeof record.at !== 'string' || !record.fields || typeof record.fields !== 'object')) throw Error('Invalid offers');
    return cached = { records: parsed as ServiceRecord[], error: '', ready: true };
  } catch {
    return cached = { records: empty, error: 'Saved offer letters could not be read. Your original data has been kept; saving is disabled to prevent overwriting it.', ready: true };
  }
}
function subscribe(listener: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === OFFER_STORAGE_KEY || event.key === null) listener(); };
  window.addEventListener('storage', storage);
  window.addEventListener(CHANGE, listener);
  return () => { window.removeEventListener('storage', storage); window.removeEventListener(CHANGE, listener); };
}
export function useOfferStore() { return useSyncExternalStore(subscribe, recordsSnapshot, () => serverSnapshot); }

export function saveOfferRecord(record: ServiceRecord) {
  const snapshot = recordsSnapshot();
  if (snapshot.error) throw Error(snapshot.error);
  const records = snapshot.records, previous = records.find(item => item.id === record.id);
  if (record.module !== 'offerletter') throw Error('Only offer letters can be saved here.');
  validateOffer(record, previous);
  const next = [structuredClone(record), ...records.filter(item => item.id !== record.id)];
  // Commit before notifying: a failed/quota-limited write must not appear saved.
  window.localStorage.setItem(OFFER_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE));
}
