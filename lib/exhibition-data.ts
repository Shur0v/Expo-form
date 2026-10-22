export type LogoPresetType = 'dta' | 'dcc' | 'dme';

export type SectorLayoutType = 'grid-3' | 'grid-2' | 'stack-1';

export type ThemePresetId =
  | 'dta-orange'
  | 'dcc-amber'
  | 'dme-blue'
  | 'crimson-red'
  | 'emerald-teal';

export type FieldIconName =
  | 'globe'
  | 'store'
  | 'map-pin'
  | 'mail'
  | 'package'
  | 'phone'
  | 'briefcase'
  | 'user'
  | 'users'
  | 'layers'
  | 'banknote'
  | 'list'
  | 'ban'
  | 'file-text'
  | 'building';

export interface CustomExtraField {
  id: string;
  section: 'company' | 'contact' | 'other';
  label: string;
  icon: FieldIconName;
  value: string;
}

export interface ThemeTokenClasses {
  id: ThemePresetId;
  label: string;
  swatchBg: string;
  headerDarkBg: string;
  primaryAccentBg: string;
  secondaryAccentBg: string;
  yearHighlightText: string;
  iconText: string;
  iconBadgeBg: string;
  sectorCardBg: string;
  sectionBarBg: string;
  inputBg: string;
  inputBorder: string;
  checkLabelText: string;
  footerLeftBg: string;
  footerMidSlopeBg: string;
  footerRightBg: string;
  organizerLogoVariant: 'light' | 'dark';
}

export const THEME_PRESETS: Record<ThemePresetId, ThemeTokenClasses> = {
  'dta-orange': {
    id: 'dta-orange',
    label: 'DTA Orange & Warm Gold',
    swatchBg: 'bg-[#F05A0B]',
    headerDarkBg: 'bg-[#25282C]/90',
    primaryAccentBg: 'bg-[#F05A0B]',
    secondaryAccentBg: 'bg-[#FF7A29]',
    yearHighlightText: 'text-[#FF8A00]',
    iconText: 'text-[#F05A0B]',
    iconBadgeBg: 'bg-[#FCEEE4]',
    sectorCardBg: 'bg-[#FAF0E6]',
    sectionBarBg: 'bg-[#F05A0B]',
    inputBg: 'bg-[#F1F3F6]',
    inputBorder: 'border-[#6C85A3]',
    checkLabelText: 'text-[#1E56A0]',
    footerLeftBg: 'bg-gradient-to-r from-[#FAD15A] to-[#F5B335]',
    footerMidSlopeBg: 'bg-[#F47B20]',
    footerRightBg: 'bg-[#E0530C]',
    organizerLogoVariant: 'light',
  },
  'dcc-amber': {
    id: 'dcc-amber',
    label: 'DCC Golden Amber & Charcoal',
    swatchBg: 'bg-[#F5A800]',
    headerDarkBg: 'bg-[#22252A]/90',
    primaryAccentBg: 'bg-[#F5A800]',
    secondaryAccentBg: 'bg-[#FFC038]',
    yearHighlightText: 'text-[#FFB800]',
    iconText: 'text-[#D98A00]',
    iconBadgeBg: 'bg-[#FDF4DC]',
    sectorCardBg: 'bg-[#FBF5E6]',
    sectionBarBg: 'bg-[#F5A800]',
    inputBg: 'bg-[#F1F3F6]',
    inputBorder: 'border-[#6C85A3]',
    checkLabelText: 'text-[#1E56A0]',
    footerLeftBg: 'bg-[#23272B]',
    footerMidSlopeBg: 'bg-[#DFA012]',
    footerRightBg: 'bg-[#F5A800]',
    organizerLogoVariant: 'dark',
  },
  'dme-blue': {
    id: 'dme-blue',
    label: 'Diagnostic Medical Blue & Navy',
    swatchBg: 'bg-[#1E6FB8]',
    headerDarkBg: 'bg-[#1D2833]/90',
    primaryAccentBg: 'bg-[#1E6FB8]',
    secondaryAccentBg: 'bg-[#3B8ED8]',
    yearHighlightText: 'text-[#4DA8FF]',
    iconText: 'text-[#1E6FB8]',
    iconBadgeBg: 'bg-[#E9F3FC]',
    sectorCardBg: 'bg-[#EDF4FA]',
    sectionBarBg: 'bg-[#1E6FB8]',
    inputBg: 'bg-[#F1F3F6]',
    inputBorder: 'border-[#6C85A3]',
    checkLabelText: 'text-[#1E56A0]',
    footerLeftBg: 'bg-[#073B65]',
    footerMidSlopeBg: 'bg-[#2B7BC2]',
    footerRightBg: 'bg-[#1E6FB8]',
    organizerLogoVariant: 'dark',
  },
  'crimson-red': {
    id: 'crimson-red',
    label: 'Executive Crimson & Slate',
    swatchBg: 'bg-[#D62828]',
    headerDarkBg: 'bg-[#232328]/90',
    primaryAccentBg: 'bg-[#D62828]',
    secondaryAccentBg: 'bg-[#EF4444]',
    yearHighlightText: 'text-[#FF5C5C]',
    iconText: 'text-[#D62828]',
    iconBadgeBg: 'bg-[#FCEAEA]',
    sectorCardBg: 'bg-[#FAF0F0]',
    sectionBarBg: 'bg-[#D62828]',
    inputBg: 'bg-[#F1F3F6]',
    inputBorder: 'border-[#6C85A3]',
    checkLabelText: 'text-[#1E56A0]',
    footerLeftBg: 'bg-[#232328]',
    footerMidSlopeBg: 'bg-[#E03E3E]',
    footerRightBg: 'bg-[#B91C1C]',
    organizerLogoVariant: 'dark',
  },
  'emerald-teal': {
    id: 'emerald-teal',
    label: 'Industrial Teal & Deep Slate',
    swatchBg: 'bg-[#0D9488]',
    headerDarkBg: 'bg-[#19252E]/90',
    primaryAccentBg: 'bg-[#0D9488]',
    secondaryAccentBg: 'bg-[#14B8A6]',
    yearHighlightText: 'text-[#2DD4BF]',
    iconText: 'text-[#0D9488]',
    iconBadgeBg: 'bg-[#E6F7F5]',
    sectorCardBg: 'bg-[#ECF8F7]',
    sectionBarBg: 'bg-[#0D9488]',
    inputBg: 'bg-[#F1F3F6]',
    inputBorder: 'border-[#6C85A3]',
    checkLabelText: 'text-[#1E56A0]',
    footerLeftBg: 'bg-[#0F172A]',
    footerMidSlopeBg: 'bg-[#14B8A6]',
    footerRightBg: 'bg-[#0D9488]',
    organizerLogoVariant: 'dark',
  },
};

export interface ExhibitionFormValues {
  companyName: string;
  country: string;
  topStallNo: string;
  companyAddress: string;
  emailAddress: string;
  productToExhibit: string;
  whatsappNo: string;
  website: string;
  businessTypes: string[];
  selectedSectors: string[];
  contactName: string;
  contactWhatsapp: string;
  secondPersonWhatsapp: string;
  representativesCount: string;
  contactEmail: string;
  stallStatus: string[];
  bottomStallNo: string;
  stallPrice: string;
  extraFacilities: string;
  competitorRequest: string;
}

export interface ExhibitionConfig {
  id: string;
  tabLabel: string;
  shortCode: string;
  topPrefix: string;
  titleLine1: string;
  titleLine2Prefix: string;
  titleYearHighlight: string;
  edition: string;
  eventDate: string;
  eventVenue: string;
  eventTime: string;
  eventWebsite: string;
  logoType: LogoPresetType;
  customMainLogoUrl: string | null;
  customHeaderBgUrl: string | null;
  customFooterLogoUrl: string | null;
  themePresetId: ThemePresetId;
  sectorLayout: SectorLayoutType;
  businessTypeOptions: string[];
  sectors: string[];
  stallStatusOptions: string[];
  extraFields: CustomExtraField[];
  compactLevel: 'compact' | 'standard' | 'ultra-compact';
  termsHeading: string;
  termsText: string;
  authoritySignLabel: string;
  exhibitorSignLabel: string;
  values: ExhibitionFormValues;
}

export const INITIAL_FORM_VALUES: ExhibitionFormValues = {
  companyName: '',
  country: '',
  topStallNo: '',
  companyAddress: '',
  emailAddress: '',
  productToExhibit: '',
  whatsappNo: '',
  website: '',
  businessTypes: [],
  selectedSectors: [],
  contactName: '',
  contactWhatsapp: '',
  secondPersonWhatsapp: '',
  representativesCount: '',
  contactEmail: '',
  stallStatus: [],
  bottomStallNo: '',
  stallPrice: '',
  extraFacilities: '',
  competitorRequest: '',
};

export const SAMPLE_FORM_VALUES: Record<string, ExhibitionFormValues> = {
  'dta-2027': {
    companyName: 'APEX SPINNING & KNITTING MILLS LTD.',
    country: 'Bangladesh',
    topStallNo: 'A-104',
    companyAddress: 'Plot 42, Sector 7, Uttara Commercial Area, Dhaka-1230',
    emailAddress: 'export@apexspinning-bd.com',
    productToExhibit:
      '100% Organic Cotton Yarn, Knitted Jersey & Sustainable Denim Fabrics',
    whatsappNo: '+880 1711-234567',
    website: 'www.apexspinning-bd.com',
    businessTypes: ['Manufacturer'],
    selectedSectors: [
      'FIBER / YARN',
      'FABRICS',
      'FINISHED & SEMI FINISHED APPARELS',
    ],
    contactName: 'Engr. Tariqul Islam Chowdhury',
    contactWhatsapp: '+880 1711-234567',
    secondPersonWhatsapp: '+880 1819-876543',
    representativesCount: '06',
    contactEmail: 'tariqul@apexspinning-bd.com',
    stallStatus: ['Constructed Booth'],
    bottomStallNo: 'A-104 (36 sqm)',
    stallPrice: 'USD 7,200',
    extraFacilities:
      '3-Phase 15kW Industrial Power Line, 2 Compressed Air Connections',
    competitorRequest: 'None',
  },
  'dcc-2027': {
    companyName: 'HUNTSMAN COLOR & SPECIALTY CHEMICALS ASIA',
    country: 'Singapore',
    topStallNo: 'B-212',
    companyAddress: '18 Jurong Port Road, Chemical Hub Tower, Singapore 619093',
    emailAddress: 'info.asia@huntsmanchem.sg',
    productToExhibit:
      'Reactive Textile Dyes, Optical Brighteners & Eco-Friendly Finishing Enzymes',
    whatsappNo: '+65 9123 4567',
    website: 'www.huntsmanchem.sg',
    businessTypes: ['Manufacturer', 'Trader'],
    selectedSectors: ['DYESTUFF & COLOR', 'CHEMICAL'],
    contactName: 'Dr. Marcus Tan Wei Ming',
    contactWhatsapp: '+65 9123 4567',
    secondPersonWhatsapp: '+880 1713-998877',
    representativesCount: '04',
    contactEmail: 'marcus.tan@huntsmanchem.sg',
    stallStatus: ['Bare Space'],
    bottomStallNo: 'B-212 (54 sqm)',
    stallPrice: 'USD 9,500',
    extraFacilities:
      'Chemical Display Ventilation Spotlight Rig & Meeting Lounge',
    competitorRequest: 'Request placement near Entrance Gate 2',
  },
  'dme-2027': {
    companyName: 'MEDITECH DIAGNOSTICS & IMAGING GMBH',
    country: 'Germany',
    topStallNo: 'M-08',
    companyAddress: 'Medizinstraße 14, 80331 München, Germany',
    emailAddress: 'exhibitions@meditech-diagnostics.de',
    productToExhibit:
      'Automated Hematology Analyzers, Digital X-Ray Systems & PCR Reagents',
    whatsappNo: '+49 151 23456789',
    website: 'www.meditech-diagnostics.de',
    businessTypes: ['Manufacturer'],
    selectedSectors: [
      'MEDICAL EQUIPMENT',
      'DIAGNOSTIC EQUIPMENT',
      'LAB EQUIPMENT & REAGENT',
    ],
    contactName: 'Dr. Lukas Weber',
    contactWhatsapp: '+49 151 23456789',
    secondPersonWhatsapp: '+880 1715-443322',
    representativesCount: '05',
    contactEmail: 'l.weber@meditech-diagnostics.de',
    stallStatus: ['Constructed Booth'],
    bottomStallNo: 'M-08 (24 sqm)',
    stallPrice: 'USD 5,400',
    extraFacilities:
      'Stabilized 220V UPS Power Feed for Live Diagnostic Analyzer Demo',
    competitorRequest: 'Keep clear of Hall B heavy generator zone',
  },
};

export const DEFAULT_EXHIBITIONS: ExhibitionConfig[] = [
  {
    id: 'dta-2027',
    tabLabel: '1. Textile & Apparel (DTA)',
    shortCode: 'DTA 2027',
    topPrefix: 'Dhaka Int.',
    titleLine1: 'Textile & Apparel',
    titleLine2Prefix: 'Expo - ',
    titleYearHighlight: '2027',
    edition: '(3rd Edition)',
    eventDate: '03-05 JUNE 2027',
    eventVenue: 'ICCB',
    eventTime: '10:30 AM - 07:00 PM',
    eventWebsite: 'www.dtaexpo.com',
    logoType: 'dta',
    customMainLogoUrl: null,
    customHeaderBgUrl: null,
    customFooterLogoUrl: null,
    themePresetId: 'dta-orange',
    sectorLayout: 'grid-3',
    businessTypeOptions: ['Manufacturer', 'Trader'],
    sectors: [
      'FIBER / YARN',
      'FABRICS',
      'HOME TEXTILE',
      'TRIMS',
      'ACCESSORIES',
      'FINISHED & SEMI FINISHED APPARELS',
    ],
    stallStatusOptions: ['Bare Space', 'Constructed Booth'],
    extraFields: [],
    compactLevel: 'compact',
    termsHeading: 'Terms & Conditions:',
    termsText:
      "I, below signatory, hereby declare that I have gone through the terms and conditions of Dhaka Int. Textile & Apparel Expo 2026 & Eco Expo's rules and regulations, as well as the fair Manual's terms and I, my company, and representatives will abide by it. In case of any violation, Eco Expo's decision is final, and we will comply with it.",
    authoritySignLabel: 'Seal & Sign of ECO Expo Authority',
    exhibitorSignLabel: 'Seal & Sign of the Exhibiting Company',
    values: { ...INITIAL_FORM_VALUES },
  },
  {
    id: 'dcc-2027',
    tabLabel: '2. Color & Chemical (DCC)',
    shortCode: 'DCC 2027',
    topPrefix: 'Dhaka Int.',
    titleLine1: 'Color & Chemical',
    titleLine2Prefix: 'Expo - ',
    titleYearHighlight: '2027',
    edition: '(2nd Edition)',
    eventDate: '03-05 JUNE 2027',
    eventVenue: 'ICCB',
    eventTime: '10:30 AM - 07:00 PM',
    eventWebsite: 'www.dccexpo.com',
    logoType: 'dcc',
    customMainLogoUrl: null,
    customHeaderBgUrl: null,
    customFooterLogoUrl: null,
    themePresetId: 'dcc-amber',
    sectorLayout: 'grid-2',
    businessTypeOptions: ['Manufacturer', 'Trader'],
    sectors: ['DYESTUFF & COLOR', 'CHEMICAL'],
    stallStatusOptions: ['Bare Space', 'Constructed Booth'],
    extraFields: [],
    compactLevel: 'compact',
    termsHeading: 'Terms & Conditions:',
    termsText:
      "I, below signatory, hereby declare that I have gone through the terms and conditions of Dhaka Int. Color & Chemical Expo 2026 & Eco Expo's rules and regulations, as well as the fair Manual's terms and I, my company, and representatives will abide by it. In case of any violation, Eco Expo's decision is final, and we will comply with it.",
    authoritySignLabel: 'Seal & Sign of ECO Expo Authority',
    exhibitorSignLabel: 'Seal & Sign of the Exhibiting Company',
    values: { ...INITIAL_FORM_VALUES },
  },
  {
    id: 'dme-2027',
    tabLabel: '3. Diagnostic Medical (DME)',
    shortCode: 'DME 2027',
    topPrefix: 'Dhaka Int.',
    titleLine1: 'Diagnostic Medical',
    titleLine2Prefix: 'Equipment Expo - ',
    titleYearHighlight: '2027',
    edition: '',
    eventDate: '14 - 16 January, 2027',
    eventVenue: 'BCFCC',
    eventTime: '10:30 AM - 07:00 PM',
    eventWebsite: 'www.dhakadiagnosticexpo.com',
    logoType: 'dme',
    customMainLogoUrl: null,
    customHeaderBgUrl: null,
    customFooterLogoUrl: null,
    themePresetId: 'dme-blue',
    sectorLayout: 'grid-3',
    businessTypeOptions: ['Manufacturer', 'Trader'],
    sectors: [
      'MEDICAL EQUIPMENT',
      'DIAGNOSTIC EQUIPMENT',
      'LAB EQUIPMENT & REAGENT',
      'MEDICAL DEVICE',
      'SURGICAL EQUIPMENT',
      'DENTAL EQUIPMENT',
    ],
    stallStatusOptions: ['Bare Space', 'Constructed Booth'],
    extraFields: [],
    compactLevel: 'compact',
    termsHeading: 'Terms & Conditions:',
    termsText:
      "I, below signatory, hereby declare that I have gone through the terms and conditions of Dhaka Int. Diagnostic Medical Equipment Expo 2026 & Eco Expo's rules and regulations, as well as the fair Manual's terms and I, my company, and representatives will abide by it. In case of any violation, Eco Expo's decision is final, and we will comply with it.",
    authoritySignLabel: 'Seal & Sign of ECO Expo Authority',
    exhibitorSignLabel: 'Seal & Sign of the Exhibiting Company',
    values: { ...INITIAL_FORM_VALUES },
  },
];
