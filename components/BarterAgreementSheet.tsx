'use client';

import React, { useLayoutEffect, useRef } from 'react';
import { Roboto_Condensed } from 'next/font/google';
import { BarterAgreement, BarterCompanyField, BARTER_COMPANY_FIELDS, compactTerms } from '@/lib/barter-agreement';

const agreementFont = Roboto_Condensed({ subsets: ['latin', 'latin-ext'], weight: ['400', '700'], variable: '--font-agreement-label' });

function GrowingField({ value, label, onChange }: { value: string; label: string; onChange: (value: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const field = ref.current;
    if (field) {
      field.style.height = 'auto';
      field.style.height = `${field.scrollHeight}px`;
    }
  }, [value]);
  return <textarea ref={ref} aria-label={label} rows={1} value={value} onChange={(e) => onChange(e.target.value)}
    className="barter-value" spellCheck={false} />;
}

export function BarterAgreementSheet({ agreement, onChange }: {
  agreement: BarterAgreement;
  onChange: (partial: Partial<BarterAgreement>) => void;
}) {
  const field = (id: BarterCompanyField) => {
    const label = BARTER_COMPANY_FIELDS.find(([key]) => key === id)![1];
    return <label className="barter-detail" key={id}>
      <span>{label}{' :'}</span>
      <GrowingField label={`Agreement ${label}`} value={agreement.company[id]}
        onChange={(value) => onChange({ company: { ...agreement.company, [id]: value.replace(/\s+/g, ' ') } })} />
    </label>;
  };
  const rows: BarterCompanyField[][] = [
    ['companyName'], ['companyOwner'], ['streetPostCode', 'street'],
    ['country', 'town', 'postCode'], ['phone', 'fax'], ['vatNumber'],
    ['website', 'companyEmail'], ['contactPerson'], ['gsm', 'personalEmail'],
  ];
  const terms = (heading: string, items: string[]) => <section className="barter-terms-section">
    {compactTerms(items).map((term, index) => <div key={index} data-pdf-block>
      {index === 0 && <h3>{heading}</h3>}
      <p className="barter-term">{term}</p>
    </div>)}
    {!compactTerms(items).length && <h3 data-pdf-block>{heading}</h3>}
  </section>;

  return <article data-exhibition-sheet="eco-expo-barter-agreement" data-pdf-flow="true"
    aria-label="Barter agreement preview" className={`barter-sheet ${agreementFont.variable}`}
    style={{ '--barter-font-size': `${agreement.fontSize}px`, '--barter-line-height': agreement.lineSpacing } as React.CSSProperties}>
    <header className="barter-document-header" data-pdf-block>
      <h1>{agreement.title}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={agreement.logoUrl} alt="Agreement partner logo" />
    </header>
    <section className="barter-company" aria-label="Company details">
      {rows.map((row, index) => <div key={index} data-pdf-block className={`barter-detail-row barter-columns-${row.length}`}>
        {row.map(field)}
      </div>)}
    </section>
    <div className="barter-terms">
      <h2 data-pdf-block>Barter Terms:</h2>
      {terms(agreement.offererHeading, agreement.offererTerms)}
      {terms(agreement.offereeHeading, agreement.offereeTerms)}
    </div>
    <footer className="barter-document-footer" data-pdf-block>
      <p className="barter-declaration">{agreement.declaration.replace(/\s+/g, ' ').trim()}</p>
      <div className="barter-signing-row">
        <div className="barter-signatures">
          <section>
            <p>Company Seal &amp; Signature <span>{agreement.signedDate}</span></p>
            <p>Authorized Person: <strong>{agreement.companySignatory}</strong></p>
            <div className="barter-signature-space">
              {agreement.showSignature && agreement.signatureUrl && <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={agreement.signatureUrl} alt="Company seal and signature from supplied agreement" />
              </>}
            </div>
          </section>
          <section>
            <p>{agreement.partnerCompany}</p>
            <p>Authorized Person: <strong>{agreement.partnerSignatory}</strong></p>
          </section>
        </div>
        <div className="barter-partner-contact">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={agreement.logoUrl} alt="Agreement partner footer logo" />
          <p>{agreement.partnerContact.split('\n').filter((line) => line.trim()).join('\n')}</p>
        </div>
      </div>
      <p className="barter-footer-note">{agreement.footerNote.replace(/\s+/g, ' ').trim()}</p>
    </footer>
  </article>;
}
