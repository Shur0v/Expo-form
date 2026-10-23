'use client';

import { EXHIBITION_ASSETS } from '@/lib/exhibition-assets';
import React, { useRef } from 'react';
import {
  Check,
  CalendarDays,
  MapPin,
  Clock,
  Globe,
  Building2,
  Store,
  Mail,
  Package,
  MessageCircle,
  Phone,
  Briefcase,
  UserRound,
  Users,
  Settings,
  Layers,
  Banknote,
  ListFilter,
  Ban,
  FileText,
  Upload,
  RotateCcw,
} from 'lucide-react';
import {
  ExhibitionConfig,
  ExhibitionFormValues,
  FieldIconName,
  readAndOptimizeImageFile,
  THEME_PRESETS,
} from '@/lib/exhibition-data';
import {
  ExhibitionMainLogo,
  EcoExpoFooterLogo,
} from '@/components/ExhibitionLogos';

interface ExhibitionFormSheetProps {
  config: ExhibitionConfig;
  onChangeValue: <K extends keyof ExhibitionFormValues>(
    field: K,
    value: ExhibitionFormValues[K]
  ) => void;
  onUpdateConfig: (partial: Partial<ExhibitionConfig>) => void;
  onUpdateExtraFieldValue?: (id: string, value: string) => void;
  templateEditMode?: boolean;
  interactive?: boolean;
}

export function ExhibitionFormSheet({
  config,
  onChangeValue,
  onUpdateConfig,
  onUpdateExtraFieldValue,
  templateEditMode = false,
  interactive = true,
}: ExhibitionFormSheetProps) {
  const theme =
    THEME_PRESETS[config.themePresetId] || THEME_PRESETS['dta-orange'];
  const { values } = config;
  const headerBgInputRef = useRef<HTMLInputElement>(null);

  // Dynamic field height based on compactLevel
  const inputHeightClass =
    config.compactLevel === 'ultra-compact'
      ? 'h-[23px]'
      : config.compactLevel === 'standard'
      ? 'h-[27px]'
      : 'h-[25px]';

  const companyBoxHeightClass =
    config.compactLevel === 'ultra-compact'
      ? 'h-[34px]'
      : config.compactLevel === 'standard'
      ? 'h-[42px]'
      : 'h-[37px]';

  const checkboxSizeClass =
    config.compactLevel === 'ultra-compact'
      ? 'w-[21px] h-[20px]'
      : config.compactLevel === 'standard'
      ? 'w-[24px] h-[23px]'
      : 'w-[22px] h-[21px]';

  const rowGapClass =
    config.compactLevel === 'ultra-compact'
      ? 'space-y-[5.5px]'
      : config.compactLevel === 'standard'
      ? 'space-y-[6.5px]'
      : 'space-y-[6px]';

  const sectionTopMarginClass =
    config.compactLevel === 'ultra-compact'
      ? 'mt-[8px]'
      : config.compactLevel === 'standard'
      ? 'mt-[11px]'
      : 'mt-[9.5px]';

  const handleHeaderBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndOptimizeImageFile(file, (dataUrl) => {
      onUpdateConfig({ customHeaderBgUrl: dataUrl });
    });
    e.target.value = '';
  };

  const toggleArrayItem = (
    field: 'businessTypes' | 'selectedSectors' | 'stallStatus',
    item: string
  ) => {
    if (!interactive) return;
    const current = values[field];
    const exists = current.includes(item);
    const updated = exists
      ? current.filter((v) => v !== item)
      : [...current, item];
    onChangeValue(field, updated);
  };

  const companyExtraFields = config.extraFields.filter(
    (f) => f.section === 'company'
  );
  const contactExtraFields = config.extraFields.filter(
    (f) => f.section === 'contact'
  );
  const otherExtraFields = config.extraFields.filter(
    (f) => f.section === 'other'
  );

  return (
    <div data-exhibition-sheet={config.id} className="w-[794px] h-[1122px] min-h-[1122px] bg-white text-black font-[family-name:var(--font-inter)] shadow-xl ring-1 ring-slate-300/80 flex flex-col justify-between relative overflow-hidden [print-color-adjust:exact] [-webkit-print-color-adjust:exact] print:shadow-none print:ring-0 print:w-[210mm] print:h-[297mm] print:min-h-[297mm] print:max-h-[297mm] print:m-0 print:p-0 select-none">
      {/* ==================== TOP GEOMETRIC HEADER BANNER (Open Sans Font) ==================== */}
      <div className="relative w-full h-[156px] shrink-0 bg-[#F7F8FA] overflow-hidden font-[family-name:var(--font-open-sans)] group">
        {interactive && (
          <input
            ref={headerBgInputRef}
            type="file"
            accept="image/*"
            onChange={handleHeaderBgFileChange}
            className="hidden"
          />
        )}

        {/* 1. Right-Side Light Architectural Geometric Facets (Behind Logo) */}
        <div className="absolute inset-0 bg-[#F8F9FB]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0F2F5] to-[#E4E7EC] [clip-path:polygon(87%_0,100%_0,100%_100%,76%_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#E8EBF0] to-[#DCE0E6] [clip-path:polygon(95.5%_0,100%_0,100%_100%,85%_100%)]" />

        {/* 2. Solid Dark Charcoal Base Polygon: (0,0) -> (57.3%, 0) -> (69.5%, 100%) -> (0, 100%) */}
        <div className="absolute inset-0 bg-[#2B3034] [clip-path:polygon(0_0,57.3%_0,69.5%_100%,0_100%)]" />

        {/* Subtle Dark Geometric Facets on Left Side of Dark Polygon */}
        <div className="absolute inset-0 bg-white/[0.03] [clip-path:polygon(0_71.5%,10.8%_22%,34%_0,49%_52%,20%_100%,0_100%)]" />
        <div className="absolute inset-0 bg-black/20 [clip-path:polygon(5.5%_28%,10.8%_22%,3.2%_83%,0_71.5%)]" />

        {/* 3. Replaceable Background Image Inside Dark Polygon (Desaturated + Smooth Left-to-Right Gradient Opacity) */}
        <div className="absolute inset-0 [clip-path:polygon(36%_0,57.3%_0,69.5%_100%,36%_100%)] overflow-hidden">
          <div className="absolute left-[38%] right-[27%] top-0 bottom-0">
            {config.customHeaderBgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.customHeaderBgUrl}
                alt="Header Background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center grayscale contrast-125 opacity-65"
              />
            ) : (
              <DefaultYarnSpoolsBackdrop mode="grayscale" />
            )}
            {/* Gradient Opacity Mask: Solid #2B3034 on left fading smoothly to transparent on right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#2B3034] via-[#2B3034]/80 via-35% to-[#2B3034]/20" />
            {/* Bottom vignette for crisp metadata legibility */}
            <div className="absolute inset-x-0 bottom-0 h-[38px] bg-gradient-to-t from-[#252A2E]/90 to-transparent" />
          </div>
        </div>

        {/* 4. Top-Right Accent V-Triangle: (57.3%, 0) -> (71.2%, 0) -> (64.3%, 56%) */}
        <div className="absolute inset-0 [clip-path:polygon(57.3%_0,71.2%_0,64.3%_56%)] overflow-hidden">
          <div className={`absolute inset-0 ${theme.primaryAccentBg}`} />
          <div className="absolute left-[38%] right-[27%] top-0 bottom-0">
            {config.customHeaderBgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.customHeaderBgUrl}
                alt="Header Triangle Background"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center grayscale contrast-125 mix-blend-multiply opacity-85"
              />
            ) : (
              <DefaultYarnSpoolsBackdrop mode="tinted" />
            )}
          </div>
          <div
            className={`absolute inset-0 ${theme.secondaryAccentBg} opacity-35 mix-blend-screen`}
          />
        </div>

        {/* 5. Translucent White/Grey Diagonal Ribbon Overlapping the Vertex (64.3%, 56%) */}
        <div className="absolute inset-0 bg-white/20 [clip-path:polygon(62.3%_39.5%,64.3%_56%,60.7%_81.5%,57.2%_81.5%)]" />

        {/* 6. Upper-Right Light Grey Parallel Diagonal Stripe next to V-Triangle */}
        <div className="absolute inset-0 bg-[#DFE3E8] [clip-path:polygon(71.2%_0,72.3%_0,65.1%_62%,64.3%_56%)]" />

        {/* 7. Lower-Right Solid Accent Diagonal Stripe from Vertex (64.3%, 56%) to Bottom (70.6%, 100%) */}
        <div
          className={`absolute inset-0 ${theme.primaryAccentBg} [clip-path:polygon(64.3%_56%,65.1%_49.5%,70.6%_100%,69.4%_100%)]`}
        />

        {/* 8. Top-Left Solid Accent Triangle Wedge: (0,0) -> (9.1%, 0) -> (0, 71.5%) */}
        <div
          className={`absolute inset-0 ${theme.primaryAccentBg} [clip-path:polygon(0_0,9.1%_0,0_71.5%)] z-10`}
        />
        <div className="absolute inset-0 bg-black/14 [clip-path:polygon(0_36%,5.6%_28%,0_71.5%)] z-10" />

        {/* Hover Button to Replace Header Background Image (Hidden in Print) */}
        {interactive && (
          <div className="print:hidden absolute top-2 left-[50%] z-30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
            <button
              type="button"
              onClick={() => headerBgInputRef.current?.click()}
              className="px-2.5 py-1 bg-white/95 text-slate-900 rounded shadow-md text-[10.5px] font-bold flex items-center gap-1 hover:bg-white cursor-pointer"
              title="Upload background photo behind geometric header"
            >
              <Upload className="w-3 h-3 text-[#F05A0B]" />
              <span>Replace Header BG</span>
            </button>
            {config.customHeaderBgUrl && (
              <button
                type="button"
                onClick={() => onUpdateConfig({ customHeaderBgUrl: null })}
                className="p-1 bg-rose-600 text-white rounded shadow-md hover:bg-rose-500 cursor-pointer"
                title="Reset header background"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* 9. Left Header Typography & Bottom 4-Icon Metadata Strip (Open Sans) */}
        <div className="relative z-20 w-[70%] h-full flex flex-col justify-between pt-[15px] pb-[9px]">
          <div className="pl-[80px] pr-[20px]">
            <div className="flex items-center gap-3 mb-[1px]">
              <span
                className={`w-[12px] h-[12px] ${theme.primaryAccentBg} inline-block shrink-0`}
              />
              {templateEditMode ? (
                <input
                  type="text"
                  value={config.topPrefix}
                  onChange={(e) =>
                    onUpdateConfig({ topPrefix: e.target.value })
                  }
                  className="bg-white/10 text-white text-[22px] font-light leading-none px-1 rounded border border-white/30 focus:outline-none w-[200px]"
                />
              ) : (
                <span className="text-[23px] font-normal leading-none tracking-[0.01em] text-white">
                  {config.topPrefix}
                </span>
              )}
            </div>

            <div className="pl-[20px]">
              {templateEditMode ? (
                <input
                  type="text"
                  value={config.titleLine1}
                  onChange={(e) =>
                    onUpdateConfig({ titleLine1: e.target.value })
                  }
                  className="bg-white/10 text-white text-[34px] font-extrabold leading-[1.05] px-1 rounded border border-white/30 focus:outline-none w-full my-0.5"
                />
              ) : (
                <h1 className="text-[35px] font-extrabold leading-[1.06] tracking-[-0.01em] text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
                  {config.titleLine1}
                </h1>
              )}

              <div className="flex items-baseline flex-wrap">
                {templateEditMode ? (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={config.titleLine2Prefix}
                      onChange={(e) =>
                        onUpdateConfig({ titleLine2Prefix: e.target.value })
                      }
                      className="bg-white/10 text-white text-[26px] font-extrabold px-1 rounded border border-white/30 w-[150px]"
                    />
                    <input
                      type="text"
                      value={config.titleYearHighlight}
                      onChange={(e) =>
                        onUpdateConfig({ titleYearHighlight: e.target.value })
                      }
                      className={`bg-white/10 ${theme.yearHighlightText} text-[26px] font-extrabold px-1 rounded border border-white/30 w-[85px]`}
                    />
                    <input
                      type="text"
                      value={config.edition}
                      onChange={(e) =>
                        onUpdateConfig({ edition: e.target.value })
                      }
                      placeholder="(Edition)"
                      className="bg-white/10 text-white text-[17px] font-normal px-1 rounded border border-white/30 w-[120px]"
                    />
                  </div>
                ) : (
                  <div className="leading-[1.08] drop-shadow-[0_2px_3px_rgba(0,0,0,0.45)]">
                    <span className="text-[34px] font-extrabold tracking-[-0.01em] text-white">
                      {config.titleLine2Prefix}
                    </span>
                    <span
                      className={`text-[34px] font-extrabold tracking-[-0.01em] ${theme.yearHighlightText}`}
                    >
                      {config.titleYearHighlight}
                    </span>
                    {config.edition && (
                      <span className="text-[20px] font-normal text-white ml-2.5">
                        {config.edition}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Event Metadata Row with 4 Colored Icons */}
          <div className="pl-[38px] pr-[12px] flex items-center gap-2.5 text-[11.5px] font-semibold text-white">
            <div className="flex items-center gap-1.5 shrink-0">
              <CalendarDays
                className={`w-[15px] h-[15px] ${theme.iconText} stroke-[2.2]`}
              />
              {templateEditMode ? (
                <input
                  type="text"
                  value={config.eventDate}
                  onChange={(e) =>
                    onUpdateConfig({ eventDate: e.target.value })
                  }
                  className="bg-white/10 text-white px-1 rounded border border-white/30 w-[95px] text-[10.5px]"
                />
              ) : (
                <span>{config.eventDate}</span>
              )}
            </div>

            <span className="text-white/60 font-light">|</span>

            <div className="flex items-center gap-1 shrink-0">
              <MapPin
                className={`w-[15px] h-[15px] ${theme.iconText} stroke-[2.2]`}
              />
              {templateEditMode ? (
                <input
                  type="text"
                  value={config.eventVenue}
                  onChange={(e) =>
                    onUpdateConfig({ eventVenue: e.target.value })
                  }
                  className="bg-white/10 text-white px-1 rounded border border-white/30 w-[50px] text-[10.5px]"
                />
              ) : (
                <span>{config.eventVenue}</span>
              )}
            </div>

            <span className="text-white/60 font-light">|</span>

            <div className="flex items-center gap-1.5 shrink-0">
              <Clock
                className={`w-[15px] h-[15px] ${theme.iconText} stroke-[2.2]`}
              />
              {templateEditMode ? (
                <input
                  type="text"
                  value={config.eventTime}
                  onChange={(e) =>
                    onUpdateConfig({ eventTime: e.target.value })
                  }
                  className="bg-white/10 text-white px-1 rounded border border-white/30 w-[115px] text-[10.5px]"
                />
              ) : (
                <span>{config.eventTime}</span>
              )}
            </div>

            <span className="text-white/60 font-light">|</span>

            <div className="flex items-center gap-1.5 min-w-0">
              <Globe
                className={`w-[15px] h-[15px] ${theme.iconText} stroke-[2.2] shrink-0`}
              />
              {templateEditMode ? (
                <input
                  type="text"
                  value={config.eventWebsite}
                  onChange={(e) =>
                    onUpdateConfig({ eventWebsite: e.target.value })
                  }
                  className="bg-white/10 text-white px-1 rounded border border-white/30 w-[115px] text-[10.5px]"
                />
              ) : (
                <span className="truncate">{config.eventWebsite}</span>
              )}
            </div>
          </div>
        </div>

        {/* 10. Right Exhibition Main Logo Space — 8px Padding from Right Side Only */}
        <div className="absolute right-0 top-0 bottom-0 w-[28.4%] z-20 p-0 flex items-center justify-center">
          <ExhibitionMainLogo
            logoType={config.logoType}
            customLogoUrl={config.customMainLogoUrl}
            onUploadLogo={(url) => onUpdateConfig({ customMainLogoUrl: url })}
            interactive={interactive}
          />
        </div>
      </div>

      {/* ==================== MAIN FORM BODY (Google Inter Font) ==================== */}
      <div className="flex-1 px-[34px] pt-[12px] pb-[8px] flex flex-col font-[family-name:var(--font-inter)]">
        {/* SECTION 1: COMPANY DETAILS */}
        <div className={rowGapClass}>
          {/* NAME OF THE PARTICIPATING COMPANY with Angled Left Icon Tab */}
          <div>
            <div className="flex items-stretch h-[25px] bg-gradient-to-r from-[#E6ECF2] via-[#F1F5F8] to-transparent rounded-tl-[4px]">
              <div
                className={`w-[54px] h-full ${theme.sectionBarBg} rounded-tl-[4px] [clip-path:polygon(0_0,76%_0,100%_100%,0_100%)] flex items-center justify-center pr-2 shrink-0`}
              >
                <Building2 className="w-4 h-4 text-white stroke-[2.2]" />
              </div>
              <div className="flex items-center pl-2 gap-2">
                <label className="text-[13px] font-bold text-[#111827] uppercase tracking-[0.01em]">
                  NAME OF THE PARTICIPATING COMPANY
                </label>
                <span className="text-[13px] font-bold text-[#111827]">:</span>
              </div>
            </div>
            <input
              type="text"
              value={values.companyName}
              onChange={(e) => onChangeValue('companyName', e.target.value)}
              readOnly={!interactive}
              className={`w-full ${companyBoxHeightClass} rounded-b-[4px] rounded-tr-[4px] border ${theme.inputBorder} ${theme.inputBg} px-3 text-[13.5px] font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* Country & Stall No. Row */}
          <div className="flex items-center gap-3 pt-[1px]">
            <div className="flex items-center flex-1">
              <FieldIconBadge
                icon="globe"
                badgeBg={theme.iconBadgeBg}
                iconText={theme.iconText}
              />
              <label className="text-[12.5px] font-bold text-[#111827] ml-2.5 pr-2 shrink-0">
                Country:
              </label>
              <input
                type="text"
                value={values.country}
                onChange={(e) => onChangeValue('country', e.target.value)}
                readOnly={!interactive}
                className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600`}
              />
            </div>

            <div className="flex items-center w-[332px] shrink-0">
              <FieldIconBadge
                icon="store"
                badgeBg={theme.iconBadgeBg}
                iconText={theme.iconText}
              />
              <label className="text-[12.5px] font-bold text-[#111827] ml-2.5 pr-2.5 shrink-0">
                Stall No.:
              </label>
              <input
                type="text"
                value={values.topStallNo}
                onChange={(e) => onChangeValue('topStallNo', e.target.value)}
                readOnly={!interactive}
                className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-600`}
              />
            </div>
          </div>

          {/* 5 Icon Badge Rows */}
          <IconInputRow
            icon="map-pin"
            label="COMPANY ADDRESS"
            value={values.companyAddress}
            onChange={(v) => onChangeValue('companyAddress', v)}
            badgeBg={theme.iconBadgeBg}
            iconText={theme.iconText}
            inputBg={theme.inputBg}
            inputBorder={theme.inputBorder}
            inputHeightClass={inputHeightClass}
            interactive={interactive}
          />
          <IconInputRow
            icon="mail"
            label="EMAIL ADDRESS"
            value={values.emailAddress}
            onChange={(v) => onChangeValue('emailAddress', v)}
            badgeBg={theme.iconBadgeBg}
            iconText={theme.iconText}
            inputBg={theme.inputBg}
            inputBorder={theme.inputBorder}
            inputHeightClass={inputHeightClass}
            interactive={interactive}
          />
          <IconInputRow
            icon="package"
            label="PRODUCT TO EXHIBIT"
            value={values.productToExhibit}
            onChange={(v) => onChangeValue('productToExhibit', v)}
            badgeBg={theme.iconBadgeBg}
            iconText={theme.iconText}
            inputBg={theme.inputBg}
            inputBorder={theme.inputBorder}
            inputHeightClass={inputHeightClass}
            interactive={interactive}
          />
          <IconInputRow
            icon="phone"
            label="WHATSAPP NO."
            value={values.whatsappNo}
            onChange={(v) => onChangeValue('whatsappNo', v)}
            badgeBg={theme.iconBadgeBg}
            iconText={theme.iconText}
            inputBg={theme.inputBg}
            inputBorder={theme.inputBorder}
            inputHeightClass={inputHeightClass}
            interactive={interactive}
            tabular
          />
          <IconInputRow
            icon="globe"
            label="WEBSITE"
            value={values.website}
            onChange={(v) => onChangeValue('website', v)}
            badgeBg={theme.iconBadgeBg}
            iconText={theme.iconText}
            inputBg={theme.inputBg}
            inputBorder={theme.inputBorder}
            inputHeightClass={inputHeightClass}
            interactive={interactive}
          />

          {/* Custom Extra Company Fields */}
          {companyExtraFields.map((ef) => (
            <IconInputRow
              key={ef.id}
              icon={ef.icon}
              label={ef.label}
              value={ef.value}
              onChange={(v) => onUpdateExtraFieldValue?.(ef.id, v)}
              badgeBg={theme.iconBadgeBg}
              iconText={theme.iconText}
              inputBg={theme.inputBg}
              inputBorder={theme.inputBorder}
              inputHeightClass={inputHeightClass}
              interactive={interactive}
            />
          ))}

          {/* Type of Business Row */}
          <div className="flex items-center pt-[1px]">
            <div className="w-[214px] shrink-0 flex items-center justify-between pr-2.5">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="briefcase"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <span className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                  Type of Business
                </span>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>

            <div className="flex items-center flex-wrap gap-x-10 gap-y-1">
              {config.businessTypeOptions.map((type) => {
                const checked = values.businessTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleArrayItem('businessTypes', type)}
                    className="flex items-center group cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`${checkboxSizeClass} rounded-[3px] border ${theme.inputBorder} ${theme.inputBg} flex items-center justify-center transition-colors group-hover:brightness-95`}
                    >
                      {checked && (
                        <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                      )}
                    </span>
                    <span
                      className={`ml-2.5 text-[13px] font-bold ${theme.checkLabelText}`}
                    >
                      {type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Showcasing Sector Split Angled Card */}
          <div className="flex items-stretch pt-[2px] min-h-[64px]">
            {/* Left Angled Sector Header Card */}
            <div
              className={`w-[188px] shrink-0 ${theme.sectorCardBg} rounded-l-[10px] [clip-path:polygon(0_0,88%_0,100%_100%,0_100%)] flex items-center pl-3.5 pr-5 py-2`}
            >
              <div className="w-[34px] h-[34px] shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={EXHIBITION_ASSETS[config.logoType].sectorIcon} alt="" className="w-full h-full object-contain block" />
              </div>
              <div className="ml-2.5 flex flex-col leading-[1.14]">
                <span className="text-[14px] font-extrabold text-[#111827]">
                  Showcasing
                </span>
                <span className="text-[14px] font-extrabold text-[#111827]">
                  Sector:
                </span>
              </div>
            </div>

            {/* Right Angled Sector Checkboxes Card */}
            <div
              className={`flex-1 ${theme.sectorCardBg} rounded-r-[10px] [clip-path:polygon(0_0,100%_0,100%_100%,3.6%_100%)] -ml-2 pl-6 pr-3 py-2 flex items-center`}
            >
              {config.sectorLayout === 'grid-3' && (
                <div className="w-full grid grid-cols-3 gap-x-2 gap-y-[6px]">
                  {config.sectors.map((sector) => {
                    const checked = values.selectedSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() =>
                          toggleArrayItem('selectedSectors', sector)
                        }
                        className="flex items-center text-left group cursor-pointer focus:outline-none"
                      >
                        <span
                          className={`${checkboxSizeClass} shrink-0 rounded-[3px] border ${theme.inputBorder} ${theme.inputBg} flex items-center justify-center group-hover:brightness-95`}
                        >
                          {checked && (
                            <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                          )}
                        </span>
                        <span className="ml-2 text-[9.5px] leading-[1.12] font-bold text-[#111827] uppercase">
                          {sector}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {config.sectorLayout === 'grid-2' && (
                <div className="w-full grid grid-cols-2 gap-x-6 gap-y-2 py-1">
                  {config.sectors.map((sector) => {
                    const checked = values.selectedSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() =>
                          toggleArrayItem('selectedSectors', sector)
                        }
                        className="flex items-center text-left group cursor-pointer focus:outline-none"
                      >
                        <span
                          className={`${checkboxSizeClass} shrink-0 rounded-[3px] border ${theme.inputBorder} ${theme.inputBg} flex items-center justify-center group-hover:brightness-95`}
                        >
                          {checked && (
                            <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                          )}
                        </span>
                        <span className="ml-2.5 text-[10.5px] leading-tight font-bold text-[#111827] uppercase">
                          {sector}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {config.sectorLayout === 'stack-1' && (
                <div className="w-full flex flex-col gap-y-[4px]">
                  {config.sectors.map((sector) => {
                    const checked = values.selectedSectors.includes(sector);
                    return (
                      <button
                        key={sector}
                        type="button"
                        onClick={() =>
                          toggleArrayItem('selectedSectors', sector)
                        }
                        className="flex items-center text-left group cursor-pointer focus:outline-none"
                      >
                        <span
                          className={`${checkboxSizeClass} shrink-0 rounded-[3px] border ${theme.inputBorder} ${theme.inputBg} flex items-center justify-center group-hover:brightness-95`}
                        >
                          {checked && (
                            <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                          )}
                        </span>
                        <span className="ml-2 text-[9px] leading-[1.12] font-bold text-[#111827] uppercase whitespace-pre-line">
                          {sector}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: KEY EXHIBITOR CONTACT INFORMATION (Reduced Section Gap) */}
        <div className={`${sectionTopMarginClass} ${rowGapClass}`}>
          <SectionRibbonHeader
            icon="user"
            title="Key Exhibitor Contact Information :"
            sectionBarBg={theme.sectionBarBg}
          />

          {/* Name Row */}
          <div className="flex items-center pt-[1px]">
            <div className="w-[140px] shrink-0 flex items-center justify-between pr-2.5">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="user"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <label className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                  Name
                </label>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>
            <input
              type="text"
              value={values.contactName}
              onChange={(e) => onChangeValue('contactName', e.target.value)}
              readOnly={!interactive}
              className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* WhatsApp & 2nd Person WhatsApp Row */}
          <div className="flex items-center">
            <div className="w-[140px] shrink-0 flex items-center justify-between pr-2.5">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="phone"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <label className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                  WhatsApp
                </label>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>
            <input
              type="text"
              value={values.contactWhatsapp}
              onChange={(e) => onChangeValue('contactWhatsapp', e.target.value)}
              readOnly={!interactive}
              className={`w-[186px] ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-600 shrink-0`}
            />

            <div className="pl-5 pr-2.5 flex items-center justify-between w-[186px] shrink-0">
              <label className="text-[12.5px] font-bold text-[#111827]">
                2nd Person WhatsApp
              </label>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>
            <input
              type="text"
              value={values.secondPersonWhatsapp}
              onChange={(e) =>
                onChangeValue('secondPersonWhatsapp', e.target.value)
              }
              readOnly={!interactive}
              className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* No. Of Company Representative & E-Mail Row */}
          <div className="flex items-center">
            <div className="w-[214px] shrink-0 flex items-center pr-2">
              <FieldIconBadge
                icon="users"
                badgeBg={theme.iconBadgeBg}
                iconText={theme.iconText}
              />
              <div className="ml-2.5 leading-[1.18]">
                <span className="text-[10px] font-semibold text-[#111827] block">
                  No. Of Company Representative
                </span>
                <span className="text-[10px] font-semibold text-[#111827] block">
                  Participate in the Exhibition :
                </span>
              </div>
            </div>
            <input
              type="text"
              value={values.representativesCount}
              onChange={(e) =>
                onChangeValue('representativesCount', e.target.value)
              }
              readOnly={!interactive}
              className={`w-[112px] ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-600 shrink-0`}
            />

            <div className="pl-3 pr-2.5 w-[115px] shrink-0 flex items-center justify-between">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="mail"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <label className="ml-2 text-[12.5px] font-bold text-[#111827]">
                  E-Mail
                </label>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>
            <input
              type="text"
              value={values.contactEmail}
              onChange={(e) => onChangeValue('contactEmail', e.target.value)}
              readOnly={!interactive}
              className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* Custom Extra Contact Fields */}
          {contactExtraFields.map((ef) => (
            <IconInputRow
              key={ef.id}
              icon={ef.icon}
              label={ef.label}
              value={ef.value}
              onChange={(v) => onUpdateExtraFieldValue?.(ef.id, v)}
              badgeBg={theme.iconBadgeBg}
              iconText={theme.iconText}
              inputBg={theme.inputBg}
              inputBorder={theme.inputBorder}
              inputHeightClass={inputHeightClass}
              interactive={interactive}
            />
          ))}
        </div>

        {/* SECTION 3: OTHER DETAILS (Reduced Section Gap) */}
        <div className={`${sectionTopMarginClass} ${rowGapClass}`}>
          <SectionRibbonHeader
            icon="settings"
            title="Other Details :"
            sectionBarBg={theme.sectionBarBg}
          />

          {/* Stall Status Row */}
          <div className="flex items-center pt-[1px]">
            <div className="w-[186px] shrink-0 flex items-center justify-between pr-2.5">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="layers"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <span className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                  Stall Status
                </span>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>

            <div className="flex items-center flex-wrap gap-x-11 gap-y-1 pl-4">
              {config.stallStatusOptions.map((status) => {
                const checked = values.stallStatus.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleArrayItem('stallStatus', status)}
                    className="flex items-center group cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`${checkboxSizeClass} rounded-[3px] border ${theme.inputBorder} ${theme.inputBg} flex items-center justify-center group-hover:brightness-95`}
                    >
                      {checked && (
                        <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                      )}
                    </span>
                    <span
                      className={`ml-2.5 text-[13px] font-bold ${theme.checkLabelText}`}
                    >
                      {status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stall No. & Price of the Stall / Space Row */}
          <div className="flex items-center">
            <div className="w-[125px] shrink-0 flex items-center justify-between pr-2.5">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="store"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <label className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                  Stall No.
                </label>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>
            <input
              type="text"
              value={values.bottomStallNo}
              onChange={(e) => onChangeValue('bottomStallNo', e.target.value)}
              readOnly={!interactive}
              className={`w-[144px] ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-600 shrink-0`}
            />

            <div className="pl-3 pr-2.5 w-[228px] shrink-0 flex items-center justify-between">
              <div className="flex items-center">
                <FieldIconBadge
                  icon="banknote"
                  badgeBg={theme.iconBadgeBg}
                  iconText={theme.iconText}
                />
                <label className="ml-2 text-[12.5px] font-bold text-[#111827]">
                  Price of the Stall / Space
                </label>
              </div>
              <span className="text-[12.5px] font-bold text-[#111827]">:</span>
            </div>
            <input
              type="text"
              value={values.stallPrice}
              onChange={(e) => onChangeValue('stallPrice', e.target.value)}
              readOnly={!interactive}
              className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 tabular-nums focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* Extra Facilities Required, if Any: */}
          <div className="flex items-center">
            <div className="flex items-center pr-2.5 shrink-0">
              <FieldIconBadge
                icon="list"
                badgeBg={theme.iconBadgeBg}
                iconText={theme.iconText}
              />
              <label className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                Extra Facilities Required, if Any:
              </label>
            </div>
            <input
              type="text"
              value={values.extraFacilities}
              onChange={(e) => onChangeValue('extraFacilities', e.target.value)}
              readOnly={!interactive}
              className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* Competitor Do Not Want Nearby (Request Only): */}
          <div className="flex items-center">
            <div className="flex items-center pr-2.5 shrink-0">
              <FieldIconBadge
                icon="ban"
                badgeBg={theme.iconBadgeBg}
                iconText={theme.iconText}
              />
              <label className="ml-2.5 text-[12.5px] font-bold text-[#111827]">
                Competitor Do Not Want Nearby (Request Only):
              </label>
            </div>
            <input
              type="text"
              value={values.competitorRequest}
              onChange={(e) =>
                onChangeValue('competitorRequest', e.target.value)
              }
              readOnly={!interactive}
              className={`flex-1 ${inputHeightClass} rounded-[4px] border ${theme.inputBorder} ${theme.inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-600`}
            />
          </div>

          {/* Custom Extra Other Fields */}
          {otherExtraFields.map((ef) => (
            <IconInputRow
              key={ef.id}
              icon={ef.icon}
              label={ef.label}
              value={ef.value}
              onChange={(v) => onUpdateExtraFieldValue?.(ef.id, v)}
              badgeBg={theme.iconBadgeBg}
              iconText={theme.iconText}
              inputBg={theme.inputBg}
              inputBorder={theme.inputBorder}
              inputHeightClass={inputHeightClass}
              interactive={interactive}
            />
          ))}
        </div>

        {/* SECTION 4: TERMS & CONDITIONS (Reduced Section Gap) */}
        <div className={`${sectionTopMarginClass} space-y-[6px]`}>
          <SectionRibbonHeader
            icon="file-text"
            title={config.termsHeading}
            sectionBarBg={theme.sectionBarBg}
          />

          <div
            className={`w-full rounded-[5px] border ${theme.inputBorder} ${theme.inputBg} px-3.5 py-2`}
          >
            {templateEditMode ? (
              <textarea
                rows={3}
                value={config.termsText}
                onChange={(e) => onUpdateConfig({ termsText: e.target.value })}
                className="w-full bg-white/80 text-[10.5px] leading-[1.38] text-slate-900 font-medium p-1 rounded border border-slate-300 focus:outline-none"
              />
            ) : (
              <p className="text-[10.5px] leading-[1.38] text-slate-800 font-medium text-justify">
                {config.termsText}
              </p>
            )}
          </div>
        </div>

        {/* SIGNATURE ROW — Pushed to Bottom with mt-auto so Signatures Get Maximum Space */}
        <div className="mt-auto pt-[38px] pb-[4px] px-4 flex items-end justify-between">
          <div className="flex flex-col items-center">
            <div className="w-[205px] border-t border-slate-700 mb-1" />
            {templateEditMode ? (
              <input
                type="text"
                value={config.authoritySignLabel}
                onChange={(e) =>
                  onUpdateConfig({ authoritySignLabel: e.target.value })
                }
                className="text-[11px] font-bold text-black bg-slate-100 px-1 border border-slate-300 rounded w-[210px] text-center"
              />
            ) : (
              <span className="text-[11px] font-bold text-[#111827]">
                {config.authoritySignLabel}
              </span>
            )}
          </div>

          <div className="flex flex-col items-center">
            <div className="w-[205px] border-t border-slate-700 mb-1" />
            {templateEditMode ? (
              <input
                type="text"
                value={config.exhibitorSignLabel}
                onChange={(e) =>
                  onUpdateConfig({ exhibitorSignLabel: e.target.value })
                }
                className="text-[11px] font-bold text-black bg-slate-100 px-1 border border-slate-300 rounded w-[210px] text-center"
              />
            ) : (
              <span className="text-[11px] font-bold text-[#111827]">
                {config.exhibitorSignLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM GEOMETRIC FOOTER BAR (100% Logo Height with 2px Top/Bottom Padding) ==================== */}
      <div
        className={`relative w-full h-[50px] ${theme.footerLeftBg} flex items-stretch pl-[38px] overflow-hidden shrink-0`}
      >
        <div className="relative z-20 h-full flex items-center">
          <EcoExpoFooterLogo
            variant={theme.organizerLogoVariant}
            customLogoUrl={config.customFooterLogoUrl}
            onUploadLogo={(url) =>
              onUpdateConfig({ customFooterLogoUrl: url })
            }
            interactive={interactive}
          />
        </div>

        {/* Right Angled Geometric Layers */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-[34%] ${theme.footerMidSlopeBg} [clip-path:polygon(13%_0,100%_0,100%_100%,0_100%)]`}
        />
        <div
          className={`absolute right-0 top-0 bottom-0 w-[30.5%] ${theme.footerRightBg} [clip-path:polygon(15%_0,100%_0,100%_100%,0_100%)] overflow-hidden`}
        >
          <div className="w-full h-full bg-[radial-gradient(ellipse_at_70%_80%,rgba(255,255,255,0.16),transparent_65%)]" />
        </div>
      </div>
    </div>
  );
}

/* ==================== SUB-COMPONENTS ==================== */

function DefaultYarnSpoolsBackdrop({
  mode,
}: {
  mode: 'grayscale' | 'tinted';
}) {
  return (
    <div className="w-full h-full relative overflow-hidden select-none">
      <div
        className={`absolute left-[18%] top-[8px] w-[48px] h-[90px] rounded-t-[10px] ${
          mode === 'grayscale'
            ? 'bg-gradient-to-r from-[#383E42] via-[#5A6268] to-[#2F3538]'
            : 'bg-gradient-to-r from-black/35 via-white/20 to-black/35'
        }`}
      />
      <div
        className={`absolute left-[38%] -top-[6px] w-[54px] h-[115px] rounded-t-[12px] ${
          mode === 'grayscale'
            ? 'bg-gradient-to-r from-[#454C52] via-[#7A8288] to-[#3B4146]'
            : 'bg-gradient-to-r from-black/30 via-white/25 to-black/35'
        }`}
      >
        <div className="w-3 h-2 bg-black/40 mx-auto rounded-full" />
      </div>
      <div
        className={`absolute left-[31%] top-[36px] w-[72px] h-[125px] rounded-t-[16px] shadow-lg overflow-hidden ${
          mode === 'grayscale'
            ? 'bg-gradient-to-r from-[#4C5359] via-[#8E969D] to-[#3E444A]'
            : 'bg-gradient-to-r from-black/35 via-white/30 to-black/40'
        }`}
      >
        <div className="w-5 h-2.5 bg-[#23272A] mx-auto mt-0.5 rounded-full border border-white/20" />
        <div className="w-full h-full opacity-25 bg-[repeating-linear-gradient(35deg,transparent,transparent_3px,rgba(0,0,0,0.35)_3px,rgba(0,0,0,0.35)_5px)]" />
      </div>
      <div
        className={`absolute right-[10%] -top-[10px] w-[82px] h-[135px] rounded-t-[14px] overflow-hidden ${
          mode === 'grayscale'
            ? 'bg-gradient-to-r from-[#525A60] via-[#9EA6AD] to-[#42494F]'
            : 'bg-gradient-to-r from-black/25 via-white/35 to-black/30'
        }`}
      >
        <div className="w-full h-full opacity-30 bg-[repeating-linear-gradient(-35deg,transparent,transparent_3px,rgba(0,0,0,0.4)_3px,rgba(0,0,0,0.4)_5px)]" />
      </div>
    </div>
  );
}

function SectionRibbonHeader({
  icon,
  title,
  sectionBarBg,
}: {
  icon: 'user' | 'settings' | 'file-text';
  title: string;
  sectionBarBg: string;
}) {
  return (
    <div className="w-full h-[25px] bg-[#E8EDF3] rounded-[3px] flex items-stretch overflow-hidden">
      <div
        className={`w-[385px] h-full ${sectionBarBg} [clip-path:polygon(0_0,94%_0,100%_100%,0_100%)] flex items-center shrink-0`}
      >
        <div className="w-[44px] h-full flex items-center justify-center border-r border-white/75 shrink-0">
          {icon === 'user' && (
            <UserRound className="w-4 h-4 text-white fill-white" />
          )}
          {icon === 'settings' && (
            <Settings className="w-4 h-4 text-white stroke-[2.4]" />
          )}
          {icon === 'file-text' && (
            <FileText className="w-4 h-4 text-white stroke-[2.3]" />
          )}
        </div>
        <span className="pl-3 text-[13px] font-bold text-white tracking-[0.01em]">
          {title}
        </span>
      </div>
    </div>
  );
}

export function FieldIconBadge({
  icon,
  badgeBg,
  iconText,
}: {
  icon: FieldIconName;
  badgeBg: string;
  iconText: string;
}) {
  const iconClass = `w-[15px] h-[15px] ${iconText} stroke-[2.1]`;
  return (
    <span
      className={`w-[27px] h-[24px] rounded-[5px] ${badgeBg} inline-flex items-center justify-center shrink-0 relative`}
    >
      {icon === 'globe' && <Globe className={iconClass} />}
      {icon === 'store' && <Store className={iconClass} />}
      {icon === 'map-pin' && <MapPin className={iconClass} />}
      {icon === 'mail' && <Mail className={iconClass} />}
      {icon === 'package' && <Package className={iconClass} />}
      {icon === 'phone' && (
        /* Real WhatsApp Icon: Chat Bubble (MessageCircle) with Call Receiver (Phone) inside at consistent stroke */
        <span className="relative inline-flex items-center justify-center w-[16px] h-[16px]">
          <MessageCircle
            className={`w-[16px] h-[16px] ${iconText} stroke-[2.1]`}
          />
          <Phone
            className={`w-[7px] h-[7px] ${iconText} stroke-[2.2] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`}
          />
        </span>
      )}
      {icon === 'briefcase' && <Briefcase className={iconClass} />}
      {icon === 'user' && <UserRound className={iconClass} />}
      {icon === 'users' && <Users className={iconClass} />}
      {icon === 'layers' && <Layers className={iconClass} />}
      {icon === 'banknote' && <Banknote className={iconClass} />}
      {icon === 'list' && <ListFilter className={iconClass} />}
      {icon === 'ban' && <Ban className={iconClass} />}
      {icon === 'file-text' && <FileText className={iconClass} />}
      {icon === 'building' && <Building2 className={iconClass} />}
    </span>
  );
}

interface IconInputRowProps {
  icon: FieldIconName;
  label: string;
  value: string;
  onChange: (value: string) => void;
  badgeBg: string;
  iconText: string;
  inputBg: string;
  inputBorder: string;
  inputHeightClass: string;
  interactive: boolean;
  tabular?: boolean;
}

function IconInputRow({
  icon,
  label,
  value,
  onChange,
  badgeBg,
  iconText,
  inputBg,
  inputBorder,
  inputHeightClass,
  interactive,
  tabular = false,
}: IconInputRowProps) {
  return (
    <div className="flex items-center">
      <div className="w-[214px] shrink-0 flex items-center justify-between pr-2.5">
        <div className="flex items-center min-w-0">
          <FieldIconBadge icon={icon} badgeBg={badgeBg} iconText={iconText} />
          <label className="ml-2.5 text-[12.5px] font-bold text-[#111827] uppercase tracking-[0.01em] truncate">
            {label}
          </label>
        </div>
        <span className="text-[12.5px] font-bold text-[#111827]">:</span>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={!interactive}
        className={`flex-1 ${inputHeightClass} rounded-[4px] border ${inputBorder} ${inputBg} px-2.5 text-[12.5px] font-semibold text-slate-900 ${
          tabular ? 'tabular-nums' : ''
        } focus:outline-none focus:ring-1 focus:ring-sky-600`}
      />
    </div>
  );
}
