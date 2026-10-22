'use client';

import React, { useState } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import {
  DEFAULT_EXHIBITIONS,
  ExhibitionConfig,
  ExhibitionFormValues,
  INITIAL_FORM_VALUES,
  SAMPLE_FORM_VALUES,
} from '@/lib/exhibition-data';
import { ExhibitionFormSheet } from '@/components/ExhibitionFormSheet';
import { FormCustomizerPanel } from '@/components/FormCustomizerPanel';

export function ExhibitionWorkspace() {
  const [exhibitions, setExhibitions] = useState<ExhibitionConfig[]>(() =>
    DEFAULT_EXHIBITIONS.map((item) => ({
      ...item,
      businessTypeOptions: [...item.businessTypeOptions],
      sectors: [...item.sectors],
      stallStatusOptions: [...item.stallStatusOptions],
      extraFields: [...item.extraFields],
      values: { ...item.values },
    }))
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all-three'>('single');
  const [templateEditMode, setTemplateEditMode] = useState<boolean>(false);

  const activeConfig = exhibitions[activeIndex];

  const handleUpdateConfig = (
    index: number,
    partial: Partial<ExhibitionConfig>
  ) => {
    setExhibitions((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, ...partial } : item))
    );
  };

  const handleChangeValue = <K extends keyof ExhibitionFormValues>(
    index: number,
    field: K,
    value: ExhibitionFormValues[K]
  ) => {
    setExhibitions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              values: {
                ...item.values,
                [field]: value,
              },
            }
          : item
      )
    );
  };

  const handleUpdateExtraFieldValue = (
    index: number,
    extraFieldId: string,
    value: string
  ) => {
    setExhibitions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              extraFields: item.extraFields.map((ef) =>
                ef.id === extraFieldId ? { ...ef, value } : ef
              ),
            }
          : item
      )
    );
  };

  const handleFillSampleData = (index: number) => {
    const targetId = exhibitions[index].id;
    const sample = SAMPLE_FORM_VALUES[targetId];
    if (!sample) return;
    setExhibitions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              values: {
                ...sample,
                businessTypes: [...sample.businessTypes],
                selectedSectors: [...sample.selectedSectors],
                stallStatus: [...sample.stallStatus],
              },
            }
          : item
      )
    );
  };

  const handleClearValues = (index: number) => {
    setExhibitions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              extraFields: item.extraFields.map((ef) => ({ ...ef, value: '' })),
              values: { ...INITIAL_FORM_VALUES },
            }
          : item
      )
    );
  };

  const handleCopyValuesToAll = () => {
    const sourceValues = activeConfig.values;
    setExhibitions((prev) =>
      prev.map((item) => ({
        ...item,
        values: {
          ...sourceValues,
          businessTypes: [...sourceValues.businessTypes],
          selectedSectors: item.sectors.filter((s) =>
            sourceValues.selectedSectors.includes(s)
          ),
          stallStatus: [...sourceValues.stallStatus],
        },
      }))
    );
  };

  const handleResetTemplate = (index: number) => {
    const original = DEFAULT_EXHIBITIONS[index];
    setExhibitions((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...original,
              businessTypeOptions: [...original.businessTypeOptions],
              sectors: [...original.sectors],
              stallStatusOptions: [...original.stallStatusOptions],
              extraFields: [],
              values: { ...INITIAL_FORM_VALUES },
            }
          : item
      )
    );
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 print:bg-white">
      {/* ==================== TOP BAR (3-Zone Contract) ==================== */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-slate-200 print:hidden">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="text-lg font-extrabold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
        >
          EcoExpo Form Studio
        </a>

        {/* Zone 2: 3 concise single-line text navigation links */}
        <nav className="flex items-center gap-6 text-sm font-semibold text-slate-600 overflow-x-auto">
          {exhibitions.map((expo, idx) => (
            <button
              key={expo.id}
              type="button"
              onClick={() => {
                setActiveIndex(idx);
                setViewMode('single');
              }}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer pb-0.5 border-b-2 ${
                viewMode === 'single' && activeIndex === idx
                  ? 'text-slate-900 border-slate-900'
                  : 'border-transparent'
              }`}
            >
              {expo.shortCode}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN WORKSPACE AREA ==================== */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row items-start justify-center gap-6 print:p-0 print:m-0 print:max-w-none print:block">
        {/* Left/Center A4 Form Viewport */}
        <div className="w-full flex-1 flex flex-col items-center overflow-x-auto pb-8 print:pb-0 print:overflow-visible">
          {viewMode === 'single' ? (
            <div className="flex flex-col items-center">
              <ExhibitionFormSheet
                config={activeConfig}
                onChangeValue={(field, value) =>
                  handleChangeValue(activeIndex, field, value)
                }
                onUpdateConfig={(partial) =>
                  handleUpdateConfig(activeIndex, partial)
                }
                onUpdateExtraFieldValue={(id, val) =>
                  handleUpdateExtraFieldValue(activeIndex, id, val)
                }
                templateEditMode={templateEditMode}
                interactive={true}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-10 print:gap-0">
              {exhibitions.map((expo, idx) => (
                <div
                  key={expo.id}
                  id={`form-page-${expo.id}`}
                  className="flex flex-col items-center print:break-after-page print:last:break-after-auto"
                >
                  <div className="w-[794px] mb-2 flex items-center justify-between text-xs text-slate-600 print:hidden">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <span>Page {idx + 1} of 3</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {expo.topPrefix} {expo.titleLine1}{' '}
                        {expo.titleLine2Prefix}
                        {expo.titleYearHighlight}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveIndex(idx);
                          setViewMode('single');
                        }}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                      >
                        Focus &amp; Customize Page {idx + 1}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetTemplate(idx)}
                        className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>

                  <ExhibitionFormSheet
                    config={expo}
                    onChangeValue={(field, value) =>
                      handleChangeValue(idx, field, value)
                    }
                    onUpdateConfig={(partial) =>
                      handleUpdateConfig(idx, partial)
                    }
                    onUpdateExtraFieldValue={(id, val) =>
                      handleUpdateExtraFieldValue(idx, id, val)
                    }
                    templateEditMode={templateEditMode}
                    interactive={true}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Customizer Panel */}
        <FormCustomizerPanel
          config={activeConfig}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          templateEditMode={templateEditMode}
          onToggleTemplateEditMode={() => setTemplateEditMode((v) => !v)}
          onUpdateConfig={(partial) => handleUpdateConfig(activeIndex, partial)}
          onFillSampleData={() => handleFillSampleData(activeIndex)}
          onClearFormValues={() => handleClearValues(activeIndex)}
          onCopyValuesToAll={handleCopyValuesToAll}
          onResetCurrentTemplate={() => handleResetTemplate(activeIndex)}
        />
      </main>
    </div>
  );
}
