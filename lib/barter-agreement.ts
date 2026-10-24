export const BARTER_COMPANY_FIELDS = [
  ['companyName', 'Company name'],
  ['companyOwner', 'Company owner / Managing director'],
  ['streetPostCode', 'Post code for street'],
  ['street', 'Street'],
  ['country', 'Country'],
  ['town', 'Town'],
  ['postCode', 'Post Code'],
  ['phone', 'Phone'],
  ['fax', 'Fax'],
  ['vatNumber', 'VAT Number'],
  ['website', 'Web Site'],
  ['companyEmail', 'Company e-mail'],
  ['contactPerson', 'Contact Person'],
  ['gsm', 'GSM'],
  ['personalEmail', 'Personal e-mail'],
] as const;

export type BarterCompanyField = typeof BARTER_COMPANY_FIELDS[number][0];
export interface BarterAgreement {
  title: string;
  company: Record<BarterCompanyField, string>;
  offererHeading: string;
  offererTerms: string[];
  offereeHeading: string;
  offereeTerms: string[];
  declaration: string;
  signedDate: string;
  companySignatory: string;
  partnerCompany: string;
  partnerSignatory: string;
  partnerContact: string;
  footerNote: string;
  logoUrl: string;
  signatureUrl: string;
  showSignature: boolean;
  fontSize: number;
  lineSpacing: number;
}

export const DEFAULT_BARTER_AGREEMENT: BarterAgreement = {
  title: 'BARTER AGREEMENT',
  company: {
    companyName: 'ECO Expo',
    companyOwner: 'Md. Rajwanur Rahman',
    streetPostCode: '5400',
    street: 'New Shenpara, Rangpur Sadar, Rangpur',
    country: 'Bangladesh',
    town: 'Rangpur Sadar',
    postCode: '5400',
    phone: '+8801715105189',
    fax: 'N/A',
    vatNumber: '',
    website: 'https://dccexpo.com/',
    companyEmail: 'ceo@ecoexxpo.events',
    contactPerson: 'Mohsanat Ibni Aual (Emon)',
    gsm: '+8801898836003',
    personalEmail: 'emon@ecoexpo.events',
  },
  offererHeading: 'Artkim(offerer) will provide;',
  offererTerms: [
    'Complimentary exhibition stand allocation',
    'Logo placement with a hyperlink in the Media Partners section of the official exhibition website',
    'One full-page advertisement in the digital exhibition catalogue',
  ],
  offereeHeading: 'Offeree will provide;',
  offereeTerms: [
    'Complimentary exhibition stand allocation.',
    'Website banner placement.',
    'Email marketing and promotional campaigns.',
    'Promotion through official social media platforms.',
    'Catalogue advertising.',
    'Event listings and promotional announcements.',
    'Inclusion in the Expo Directory.',
    'News coverage and promotional articles.',
    'Promotion through partner and industry association networks.',
    'Cross-promotion through international business contacts and exhibitor networks and Promotion through other relevant communication channels.',
  ],
  declaration: 'We accept all items of the enclosed terms of contract for participation. The stated company data and exhibits can already be recorded and published. All that articles have been read and signed',
  signedDate: '15/08/2026',
  companySignatory: 'Md. Rajwanur Rahman',
  partnerCompany: 'ARTKİM FUARCILIK TİC. A.Ş.',
  partnerSignatory: 'Berat Özkan',
  partnerContact: 'Sultan Selim Mahallesi Akyol Sitesi Çıkmazı Sokak\nNo:6 Artkim Center Kağıthane / İstanbul / Türkiye\nT:0212 324 00 00  F:0212 324 37 57\nMaslak VD.0850408798\nsales@artkim.com.tr    www.artkim.com.tr',
  footerNote: 'THIS EXHIBITION IS ORGANIZED UNDER THE PERMISSION OF TOBB(THE UNION OF CHAMBERS AND COMMODITY EXCHANGES OF TURKEY) ACCORDING TO THE LAW 5174.',
  logoUrl: '/assets/barter/artkim-logo.png',
  signatureUrl: '/assets/barter/company-signature.png',
  showSignature: true,
  fontSize: 12,
  lineSpacing: 1.4,
};

/** A term is one paragraph, with no empty paragraphs or accidental extra spacing. */
export function compactTerms(terms: string[]): string[] {
  return terms.map((term) => term.replace(/\s+/g, ' ').trim()).filter(Boolean);
}
