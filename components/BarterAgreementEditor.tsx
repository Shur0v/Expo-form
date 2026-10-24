'use client';

import React, { useState } from 'react';
import { Building2, ListChecks, PenLine, SlidersHorizontal, Plus, X, Upload, RotateCcw } from 'lucide-react';
import { BarterAgreement, BARTER_COMPANY_FIELDS, DEFAULT_BARTER_AGREEMENT, compactTerms } from '@/lib/barter-agreement';
import { readAndOptimizeImageFile } from '@/lib/exhibition-data';

export function BarterAgreementEditor({ agreement, onChange }: {
  agreement: BarterAgreement;
  onChange: (partial: Partial<BarterAgreement>) => void;
}) {
  const [tab, setTab] = useState<'company' | 'terms' | 'signing' | 'layout'>('company');
  const tabs = [
    ['company', 'Company', Building2], ['terms', 'Terms', ListChecks],
    ['signing', 'Signing', PenLine], ['layout', 'Layout', SlidersHorizontal],
  ] as const;
  const input = (key: keyof BarterAgreement, label: string, multiline = false) => <label className="barter-editor-field" key={key}>
    <span>{label}</span>
    {multiline ? <textarea rows={4} value={String(agreement[key])} onChange={(e) => onChange({ [key]: e.target.value })} />
      : <input value={String(agreement[key])} onChange={(e) => onChange({ [key]: e.target.value })} />}
  </label>;
  const editTerms = (key: 'offererTerms' | 'offereeTerms', headingKey: 'offererHeading' | 'offereeHeading', label: string) => <section className="barter-editor-section">
    <div className="barter-editor-section-title"><h3>{label}</h3><span>{compactTerms(agreement[key]).length} items</span></div>
    {input(headingKey, 'Section heading')}
    <div className="barter-editor-term-list">
      {agreement[key].map((term, index) => <div className="barter-editor-term" key={index}>
        <span>{String(index + 1).padStart(2, '0')}</span>
        <textarea rows={2} aria-label={`${label} term ${index + 1}`} value={term}
          onChange={(e) => onChange({ [key]: agreement[key].map((item, i) => i === index ? e.target.value : item) })} />
        <button type="button" aria-label={`Remove ${label.toLowerCase()} term ${index + 1}`}
          onClick={() => onChange({ [key]: agreement[key].filter((_, i) => i !== index) })}><X size={14} /></button>
      </div>)}
    </div>
    <button className="barter-add-term" type="button" onClick={() => onChange({ [key]: [...agreement[key], ''] })}><Plus size={14} />Add term</button>
  </section>;
  const upload = (key: 'logoUrl' | 'signatureUrl', label: string) => <label className="barter-upload">
    <Upload size={15} /><span>{label}</span>
    <input type="file" accept="image/*" onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) readAndOptimizeImageFile(file, (url) => onChange({ [key]: url }));
      e.target.value = '';
    }} />
  </label>;

  return <aside aria-label="Barter agreement editor" className="barter-editor print:hidden">
    <div className="barter-editor-top">
      <div><span className="barter-editor-eyebrow">DOCUMENT 04</span><h2>Barter Agreement</h2><p>A dedicated editor for your agreement.</p></div>
      <span className="barter-editor-saved">Auto-saved locally</span>
    </div>
    <nav className="barter-editor-tabs" aria-label="Agreement editor sections">
      {tabs.map(([id, label, Icon]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>
        <Icon size={16} /><span>{label}</span>
      </button>)}
    </nav>
    <div className="barter-editor-content">
      {tab === 'company' && <section className="barter-editor-section">
        <div className="barter-editor-section-title"><h3>Company details</h3><span>15 fields</span></div>
        <p className="barter-editor-hint">Edit here or directly on the document. Longer details wrap automatically.</p>
        {BARTER_COMPANY_FIELDS.map(([key, label]) => <label className="barter-editor-field" key={key}>
          <span>{label}</span><input value={agreement.company[key]} aria-label={`Editor ${label}`}
            onChange={(e) => onChange({ company: { ...agreement.company, [key]: e.target.value } })} />
        </label>)}
      </section>}
      {tab === 'terms' && <>
        <p className="barter-editor-hint">Each item becomes one compact paragraph. Empty items and extra line breaks are omitted. Longer agreements continue onto additional A4 pages when downloaded.</p>
        {editTerms('offererTerms', 'offererHeading', 'Offerer')}
        {editTerms('offereeTerms', 'offereeHeading', 'Offeree')}
        {input('declaration', 'Acceptance statement', true)}
      </>}
      {tab === 'signing' && <>
        <section className="barter-editor-section">
          <div className="barter-editor-section-title"><h3>Company signature</h3><PenLine size={16} /></div>
          {input('signedDate', 'Signature date')}{input('companySignatory', 'Company authorized person')}
          <label className="barter-editor-toggle"><input type="checkbox" checked={agreement.showSignature} onChange={(e) => onChange({ showSignature: e.target.checked })} /><span>Include supplied seal & signature</span></label>
          {upload('signatureUrl', 'Replace seal & signature')}
        </section>
        <section className="barter-editor-section">
          <div className="barter-editor-section-title"><h3>Agreement partner</h3></div>
          {input('partnerCompany', 'Partner company')}{input('partnerSignatory', 'Partner authorized person')}
          {input('partnerContact', 'Partner address & contact', true)}
        </section>
      </>}
      {tab === 'layout' && <>
        <section className="barter-editor-section">
          <div className="barter-editor-section-title"><h3>Document appearance</h3><span>A4 portrait</span></div>
          {input('title', 'Document title')}
          <label className="barter-editor-field"><span>Terms text size · {agreement.fontSize}px</span>
            <input type="range" min="10" max="14" step="0.5" value={agreement.fontSize} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} /></label>
          <label className="barter-editor-field"><span>Line spacing · {agreement.lineSpacing.toFixed(2)}</span>
            <input type="range" min="1.15" max="1.7" step="0.05" value={agreement.lineSpacing} onChange={(e) => onChange({ lineSpacing: Number(e.target.value) })} /></label>
          {upload('logoUrl', 'Replace partner logo')}
          <button className="barter-add-term" type="button" onClick={() => onChange({ logoUrl: DEFAULT_BARTER_AGREEMENT.logoUrl })}><RotateCcw size={14} />Restore original logo</button>
          {input('footerNote', 'Footer note', true)}
        </section>
      </>}
    </div>
    <div className="barter-editor-bottom">Changes apply only to this agreement.</div>
  </aside>;
}
