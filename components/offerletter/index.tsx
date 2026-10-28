"use client";
import { useMemo } from 'react';
import { Instrument_Sans } from 'next/font/google';
import type { ExhibitionConfig } from '@/lib/exhibition-data';
import type { OfferCompany } from '@/lib/offerletter/types';
import { saveOfferRecord, useOfferStore } from '@/lib/offerletter/store';
import Offerletters from './offerletters';
import './workspace.css';

const instrument = Instrument_Sans({ subsets: ['latin'], display: 'swap' });
export default function OfferletterPage({ exhibitions }: { exhibitions: ExhibitionConfig[] }) {
  const { records, error, ready } = useOfferStore();
  const companies = useMemo(() => {
    const result = new Map<string, OfferCompany>();
    for (const exhibition of exhibitions) {
      const value = exhibition.values;
      if (value.companyName.trim()) result.set(value.companyName.trim().toLowerCase(), { id: 'registration-' + exhibition.id, name: value.companyName.trim(), contactName: value.contactName, email: value.contactEmail || value.emailAddress });
    }
    for (const record of records) {
      const name = record.fields.Company?.trim();
      if (name && !result.has(name.toLowerCase())) result.set(name.toLowerCase(), { id: record.companyId || 'offer-company-' + record.id, name, contactName: record.fields.Recipient });
    }
    return [...result.values()];
  }, [exhibitions, records]);
  if (!ready) return <p role="status">Loading offer letters…</p>;
  return <section className={`${instrument.className} offer-workspace`} aria-label="Offer Letter workspace">
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <Offerletters state={{
      records, companies, accounts: [],
      editions: exhibitions.map(exhibition => ({ id: exhibition.id, series: exhibition.shortCode.replace(/\s+\d{4}$/, ''), year: Number(exhibition.titleYearHighlight) || 2027, name: `${exhibition.topPrefix} ${exhibition.titleLine1}`, currency: 'USD' })),
    }} context={{ accountId: 'formstudio-offerletter' }} readOnly={!!error}
      run={async command => { saveOfferRecord(command.record); return true; }} />
  </section>;
}
