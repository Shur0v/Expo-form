'use client';

import React, { useRef, useState } from 'react';
import {
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  FileCheck2,
  Eraser,
  Sliders,
  Image as ImageIcon,
  Layers,
  FileText,
  Edit3,
  FileSpreadsheet,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CustomExtraField,
  ExhibitionConfig,
  FieldIconName,
  SectorLayoutType,
  THEME_PRESETS,
  ThemePresetId,
} from '@/lib/exhibition-data';

interface FormCustomizerPanelProps {
  config: ExhibitionConfig;
  viewMode: 'single' | 'all-three';
  onChangeViewMode: (mode: 'single' | 'all-three') => void;
  templateEditMode: boolean;
  onToggleTemplateEditMode: () => void;
  onUpdateConfig: (partial: Partial<ExhibitionConfig>) => void;
  onFillSampleData: () => void;
  onClearFormValues: () => void;
  onCopyValuesToAll: () => void;
  onResetCurrentTemplate: () => void;
}

type SectionTab = 'logo' | 'header' | 'sectors' | 'data';

const ICON_OPTIONS: { id: FieldIconName; label: string }[] = [
  { id: 'list', label: 'List / Details' },
  { id: 'building', label: 'Building / Company' },
  { id: 'globe', label: 'Globe / Country / Web' },
  { id: 'store', label: 'Booth / Stall' },
  { id: 'map-pin', label: 'Location / Address' },
  { id: 'mail', label: 'Email' },
  { id: 'package', label: 'Product / Box' },
  { id: 'phone', label: 'WhatsApp / Phone' },
  { id: 'briefcase', label: 'Business / Briefcase' },
  { id: 'user', label: 'Person / Contact' },
  { id: 'users', label: 'Team / Representatives' },
  { id: 'banknote', label: 'Price / Currency' },
  { id: 'layers', label: 'Layers / Status' },
  { id: 'ban', label: 'Restriction / Ban' },
];

export function FormCustomizerPanel({
  config,
  viewMode,
  onChangeViewMode,
  templateEditMode,
  onToggleTemplateEditMode,
  onUpdateConfig,
  onFillSampleData,
  onClearFormValues,
  onCopyValuesToAll,
  onResetCurrentTemplate,
}: FormCustomizerPanelProps) {
  const [activeTab, setActiveTab] = useState<SectionTab>('logo');
  const [newSectorText, setNewSectorText] = useState('');
  const [newBusinessType, setNewBusinessType] = useState('');
  const [newStallStatus, setNewStallStatus] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [headerBgUrlInput, setHeaderBgUrlInput] = useState('');

  // State for adding a custom extra field
  const [extraFieldLabel, setExtraFieldLabel] = useState('');
  const [extraFieldSection, setExtraFieldSection] = useState<
    'company' | 'contact' | 'other'
  >('other');
  const [extraFieldIcon, setExtraFieldIcon] = useState<FieldIconName>('list');

  const mainLogoInputRef = useRef<HTMLInputElement>(null);
  const headerBgInputRef = useRef<HTMLInputElement>(null);
  const footerLogoInputRef = useRef<HTMLInputElement>(null);

  const effectiveTab: SectionTab =
    viewMode === 'all-three' ? 'data' : activeTab;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'customMainLogoUrl' | 'customHeaderBgUrl' | 'customFooterLogoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUpdateConfig({ [target]: reader.result });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddSector = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSectorText.trim().toUpperCase();
    if (!trimmed) return;
    onUpdateConfig({
      sectors: [...config.sectors, trimmed],
    });
    setNewSectorText('');
  };

  const handleRemoveSector = (idx: number) => {
    const updated = config.sectors.filter((_, i) => i !== idx);
    onUpdateConfig({ sectors: updated });
  };

  const handleUpdateSector = (idx: number, val: string) => {
    const updated = [...config.sectors];
    updated[idx] = val;
    onUpdateConfig({ sectors: updated });
  };

  const handleAddExtraField = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = extraFieldLabel.trim();
    if (!trimmed) return;
    const newField: CustomExtraField = {
      id: `extra-${Date.now()}`,
      section: extraFieldSection,
      label: trimmed,
      icon: extraFieldIcon,
      value: '',
    };
    onUpdateConfig({
      extraFields: [...config.extraFields, newField],
    });
    setExtraFieldLabel('');
  };

  const handleRemoveExtraField = (id: string) => {
    onUpdateConfig({
      extraFields: config.extraFields.filter((f) => f.id !== id),
    });
  };

  const handleAddBusinessType = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newBusinessType.trim();
    if (!trimmed) return;
    onUpdateConfig({
      businessTypeOptions: [...config.businessTypeOptions, trimmed],
    });
    setNewBusinessType('');
  };

  const handleAddStallStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newStallStatus.trim();
    if (!trimmed) return;
    onUpdateConfig({
      stallStatusOptions: [...config.stallStatusOptions, trimmed],
    });
    setNewStallStatus('');
  };

  return (
    <aside className="w-full lg:w-[380px] shrink-0 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col overflow-hidden print:hidden">
      {/* Panel Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">
            Form Studio Customizer
          </h2>
          <p className="text-xs text-slate-500">
            Active:{' '}
            <span className="font-semibold text-slate-700">
              {config.shortCode}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onResetCurrentTemplate}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          title="Reset this exhibition form to default design"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default</span>
        </button>
      </div>

      {/* Segmented Navigation with Smooth Hide/Show Animation on View Mode Change */}
      <div className="flex items-center p-1.5 bg-slate-100 border-b border-slate-200 overflow-hidden">
        <AnimatePresence initial={false}>
          {viewMode === 'single' && (
            <motion.div
              key="single-form-tabs"
              initial={{ width: 0, opacity: 0, scale: 0.92, marginRight: 0 }}
              animate={{
                width: '75%',
                opacity: 1,
                scale: 1,
                marginRight: 4,
              }}
              exit={{ width: 0, opacity: 0, scale: 0.92, marginRight: 0 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-3 gap-1 overflow-hidden shrink-0"
            >
              <button
                type="button"
                onClick={() => setActiveTab('logo')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  effectiveTab === 'logo'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                <span>Bg/Notice</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('header')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  effectiveTab === 'header'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 shrink-0" />
                <span>Header</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sectors')}
                className={`py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  effectiveTab === 'sectors'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Fields</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          layout
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          type="button"
          onClick={() => setActiveTab('data')}
          className={`flex-1 py-1.5 px-2 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            effectiveTab === 'data'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" />
          <span>Actions</span>
        </motion.button>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-5 text-xs overflow-y-auto max-h-[820px]">
        {effectiveTab === 'logo' && (
          <div className="space-y-4">
            {/* 1. Topper Geometric Background Image Upload */}
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg space-y-2.5">
              <div>
                <label className="block font-bold text-slate-900">
                  1. Topper Geometric Background Image
                </label>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Upload any background image to sit behind the geometric top
                  banner shapes with automatic gradient opacity.
                </p>
              </div>

              <input
                ref={headerBgInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'customHeaderBgUrl')}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => headerBgInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-[#F05A0B] text-white font-semibold rounded-lg hover:bg-[#d94e07] transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Header Background</span>
                </button>
                {config.customHeaderBgUrl && (
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ customHeaderBgUrl: null })}
                    className="py-2 px-2.5 bg-white text-rose-700 border border-rose-200 font-semibold rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={headerBgUrlInput}
                  onChange={(e) => setHeaderBgUrlInput(e.target.value)}
                  placeholder="Or paste background image URL..."
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (headerBgUrlInput.trim()) {
                      onUpdateConfig({
                        customHeaderBgUrl: headerBgUrlInput.trim(),
                      });
                      setHeaderBgUrlInput('');
                    }
                  }}
                  className="px-2.5 py-1.5 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* 2. Top-Right Exhibition Logo Upload Box */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block font-bold text-slate-800 mb-1">
                2. Top-Right Exhibition Logo (100% Width/Height Fit)
              </label>
              <p className="text-slate-500 mb-2 leading-relaxed">
                Upload your PNG logo (automatically takes 100% width with 8px
                right padding, or 100% height with 8px top/bottom padding).
              </p>

              <input
                ref={mainLogoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'customMainLogoUrl')}
                className="hidden"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => mainLogoInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Main Logo</span>
                </button>
                {config.customMainLogoUrl && (
                  <button
                    type="button"
                    onClick={() => onUpdateConfig({ customMainLogoUrl: null })}
                    className="py-2 px-3 bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded-lg hover:bg-rose-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center gap-1.5">
                <input
                  type="url"
                  value={logoUrlInput}
                  onChange={(e) => setLogoUrlInput(e.target.value)}
                  placeholder="Or paste logo image URL..."
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (logoUrlInput.trim()) {
                      onUpdateConfig({
                        customMainLogoUrl: logoUrlInput.trim(),
                      });
                      setLogoUrlInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Apply
                </button>
              </div>
            </div>

            {/* 3. Footer Logo Upload (100% Height with 2px Top/Bottom Padding) */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <label className="block font-bold text-slate-800">
                3. Footer Bar Organizer PNG Logo (2px Top/Bottom Gap)
              </label>
              <p className="text-slate-500 leading-relaxed">
                Upload your footer PNG logo. It automatically fills 100% height
                with only a 2px gap on top and bottom.
              </p>

              <input
                ref={footerLogoInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'customFooterLogoUrl')}
                className="hidden"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => footerLogoInputRef.current?.click()}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Footer PNG Logo</span>
                </button>
                {config.customFooterLogoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConfig({ customFooterLogoUrl: null })
                    }
                    className="py-2 px-2.5 bg-rose-50 text-rose-700 border border-rose-200 font-semibold rounded-lg cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* 4. Terms & Conditions Paragraph (Moved to Bg/Notice Tab) */}
            <div className="pt-3 border-t border-slate-200 space-y-1.5">
              <label className="block font-bold text-slate-800">
                4. Terms &amp; Conditions Paragraph
              </label>
              <textarea
                rows={4}
                value={config.termsText}
                onChange={(e) => onUpdateConfig({ termsText: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 leading-relaxed"
              />
            </div>
          </div>
        )}

        {effectiveTab === 'header' && (
          <div className="space-y-3.5">
            {/* Color Theme Palette */}
            <div>
              <label className="block font-bold text-slate-800 mb-1.5">
                Color Theme Palette
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(THEME_PRESETS) as ThemePresetId[]).map((key) => {
                  const preset = THEME_PRESETS[key];
                  const active = config.themePresetId === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onUpdateConfig({ themePresetId: key })}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors cursor-pointer ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-sm shrink-0 ${preset.swatchBg} border border-white/20`}
                      />
                      <span className="truncate font-semibold text-[11px]">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Header Titles */}
            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Top Prefix Line
                </label>
                <input
                  type="text"
                  value={config.topPrefix}
                  onChange={(e) =>
                    onUpdateConfig({ topPrefix: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Exhibition Title (Line 1)
                </label>
                <input
                  type="text"
                  value={config.titleLine1}
                  onChange={(e) =>
                    onUpdateConfig({ titleLine1: e.target.value })
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Line 2 Prefix
                  </label>
                  <input
                    type="text"
                    value={config.titleLine2Prefix}
                    onChange={(e) =>
                      onUpdateConfig({ titleLine2Prefix: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Colored Year
                  </label>
                  <input
                    type="text"
                    value={config.titleYearHighlight}
                    onChange={(e) =>
                      onUpdateConfig({ titleYearHighlight: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-bold focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Edition
                  </label>
                  <input
                    type="text"
                    value={config.edition}
                    onChange={(e) =>
                      onUpdateConfig({ edition: e.target.value })
                    }
                    placeholder="(3rd Edition)"
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>

              {/* 4 Icon Metadata Fields */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Date (Calendar Icon)
                  </label>
                  <input
                    type="text"
                    value={config.eventDate}
                    onChange={(e) =>
                      onUpdateConfig({ eventDate: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Venue (Pin Icon)
                  </label>
                  <input
                    type="text"
                    value={config.eventVenue}
                    onChange={(e) =>
                      onUpdateConfig({ eventVenue: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Time (Clock Icon)
                  </label>
                  <input
                    type="text"
                    value={config.eventTime}
                    onChange={(e) =>
                      onUpdateConfig({ eventTime: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Website (Globe Icon)
                  </label>
                  <input
                    type="text"
                    value={config.eventWebsite}
                    onChange={(e) =>
                      onUpdateConfig({ eventWebsite: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* Signature Labels */}
            <div className="pt-2 border-t border-slate-200 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Left Signature Label
                  </label>
                  <input
                    type="text"
                    value={config.authoritySignLabel}
                    onChange={(e) =>
                      onUpdateConfig({ authoritySignLabel: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Right Signature Label
                  </label>
                  <input
                    type="text"
                    value={config.exhibitorSignLabel}
                    onChange={(e) =>
                      onUpdateConfig({ exhibitorSignLabel: e.target.value })
                    }
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {effectiveTab === 'sectors' && (
          <div className="space-y-4">
            {/* Field Box Size & Signature Space (Moved to Top of Fields Tab) */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
              <label className="block font-bold text-slate-800 mb-1.5">
                Field Box Size &amp; Signature Space
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'ultra-compact', label: 'Max Sign Space' },
                    { id: 'compact', label: 'Balanced (-2px)' },
                    { id: 'standard', label: 'Standard Size' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onUpdateConfig({ compactLevel: item.id })}
                    className={`py-1.5 px-2 rounded-md border text-[11px] font-semibold transition-colors cursor-pointer ${
                      config.compactLevel === item.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. Add Custom Extra Field */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
              <label className="block font-bold text-slate-900">
                Add Custom Extra Field
              </label>
              <form onSubmit={handleAddExtraField} className="space-y-2">
                <input
                  type="text"
                  value={extraFieldLabel}
                  onChange={(e) => setExtraFieldLabel(e.target.value)}
                  placeholder="Field label (e.g., TIN / VAT No., Hall Name)..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={extraFieldSection}
                    onChange={(e) =>
                      setExtraFieldSection(
                        e.target.value as 'company' | 'contact' | 'other'
                      )
                    }
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold"
                  >
                    <option value="company">In Company Details</option>
                    <option value="contact">In Contact Info</option>
                    <option value="other">In Other Details</option>
                  </select>
                  <select
                    value={extraFieldIcon}
                    onChange={(e) =>
                      setExtraFieldIcon(e.target.value as FieldIconName)
                    }
                    className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold"
                  >
                    {ICON_OPTIONS.map((ico) => (
                      <option key={ico.id} value={ico.id}>
                        Icon: {ico.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 px-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Extra Field to Form</span>
                </button>
              </form>

              {config.extraFields.length > 0 && (
                <div className="pt-2 border-t border-slate-200 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Active Extra Fields ({config.extraFields.length})
                  </span>
                  {config.extraFields.map((ef) => (
                    <div
                      key={ef.id}
                      className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200"
                    >
                      <span className="font-semibold text-slate-800 truncate">
                        {ef.label}{' '}
                        <span className="text-slate-400 font-normal">
                          ({ef.section})
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveExtraField(ef.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Showcasing Sector Layout & Checkboxes */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block font-bold text-slate-800 mb-1.5">
                Showcasing Sector Grid Layout
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {(
                  [
                    { id: 'grid-3', label: '3 Columns' },
                    { id: 'grid-2', label: '2 Columns' },
                    { id: 'stack-1', label: '1 Col Stack' },
                  ] as { id: SectorLayoutType; label: string }[]
                ).map((layout) => (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => onUpdateConfig({ sectorLayout: layout.id })}
                    className={`py-1.5 px-2 rounded-lg border font-semibold transition-colors cursor-pointer ${
                      config.sectorLayout === layout.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {layout.label}
                  </button>
                ))}
              </div>

              <label className="block font-bold text-slate-800 mb-1.5">
                Showcasing Sector Options ({config.sectors.length})
              </label>
              <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                {config.sectors.map((sector, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={sector}
                      onChange={(e) => handleUpdateSector(idx, e.target.value)}
                      className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] font-semibold focus:outline-none focus:border-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSector(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete sector"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSector} className="mt-2 flex gap-1.5">
                <input
                  type="text"
                  value={newSectorText}
                  onChange={(e) => setNewSectorText(e.target.value)}
                  placeholder="Add new showcasing sector..."
                  className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>

            {/* 3. Customize Type of Business & Stall Status Options */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Type of Business Options
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {config.businessTypeOptions.map((opt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[11px] font-semibold text-slate-800"
                    >
                      {opt}
                      {config.businessTypeOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              businessTypeOptions:
                                config.businessTypeOptions.filter(
                                  (_, i) => i !== idx
                                ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddBusinessType} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newBusinessType}
                    onChange={(e) => setNewBusinessType(e.target.value)}
                    placeholder="Add option (e.g. Exporter)..."
                    className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
                  >
                    + Add
                  </button>
                </form>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Stall Status Options
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {config.stallStatusOptions.map((opt, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-[11px] font-semibold text-slate-800"
                    >
                      {opt}
                      {config.stallStatusOptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateConfig({
                              stallStatusOptions:
                                config.stallStatusOptions.filter(
                                  (_, i) => i !== idx
                                ),
                            })
                          }
                          className="text-slate-400 hover:text-rose-600 ml-0.5 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <form onSubmit={handleAddStallStatus} className="flex gap-1.5">
                  <input
                    type="text"
                    value={newStallStatus}
                    onChange={(e) => setNewStallStatus(e.target.value)}
                    placeholder="Add option (e.g. Pavilion)..."
                    className="flex-1 px-2.5 py-1 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-slate-900 text-white font-semibold rounded-lg cursor-pointer"
                  >
                    + Add
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {effectiveTab === 'data' && (
          <div className="space-y-3">
            {/* View Mode Switcher */}
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <label className="block font-bold text-slate-800">
                Page View Mode
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onChangeViewMode('single')}
                  className={`py-2 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'single'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Single Form</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeViewMode('all-three')}
                  className={`py-2 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 cursor-pointer ${
                    viewMode === 'all-three'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>All 3 Forms</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={onToggleTemplateEditMode}
              className={`w-full py-2.5 px-3 font-semibold rounded-lg border transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                templateEditMode
                  ? 'bg-amber-500 text-white border-amber-600'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Edit3 className="w-4 h-4" />
              <span>
                {templateEditMode
                  ? 'Done Inline Header Editing'
                  : 'Edit Header & Terms Directly on Form'}
              </span>
            </button>

            <button
              type="button"
              onClick={onFillSampleData}
              className="w-full py-2.5 px-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Fill Realistic Sample Data</span>
            </button>

            <button
              type="button"
              onClick={onCopyValuesToAll}
              className="w-full py-2.5 px-3 bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Exhibitor Info to All 3 Forms</span>
            </button>

            <button
              type="button"
              onClick={onClearFormValues}
              className="w-full py-2.5 px-3 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Eraser className="w-4 h-4" />
              <span>Clear Active Form Inputs</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
