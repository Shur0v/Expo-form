'use client';

import React, { useState, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { flushSync } from 'react-dom';
import { exportExhibitionPdf } from '@/lib/export-exhibition-pdf';
import { Printer, RotateCcw } from 'lucide-react';
import {
  DEFAULT_EXHIBITIONS,
  ExhibitionConfig,
  ExhibitionFormValues,
  SAMPLE_FORM_VALUES,
} from '@/lib/exhibition-data';
import { ExhibitionFormSheet } from '@/components/ExhibitionFormSheet';
import { FormCustomizerPanel } from '@/components/FormCustomizerPanel';
import { StudioNavigation } from '@/components/StudioNavigation';

const FloorplanPage = dynamic(() => import('@/components/floorplan'), {
  ssr: false,
  loading: () => <p role="status" className="p-8 text-sm text-slate-600">Loading floorplan…</p>,
});
const OfferletterPage = dynamic(() => import('@/components/offerletter'), {
  ssr: false,
  loading: () => <p role="status" className="p-8 text-sm text-slate-600">Loading offer letters…</p>,
});

const STORAGE_KEY_CONFIGS = 'ecoexpo_exhibitions_configs_v2';
const STORAGE_KEY_VALUES = 'ecoexpo_exhibitions_values_v2';
const STORAGE_KEY_UI = 'ecoexpo_exhibitions_ui_v2';

function subscribePage(listener: () => void) {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

function getFloorplanPageSnapshot() {
  return window.location.hash === '#floorplan';
}
function getOfferPageSnapshot() {
  return ['#offer-letter', '#offerletter'].includes(window.location.hash);
}

interface WorkspaceStoreState {
  exhibitions: ExhibitionConfig[];
  activeIndex: number;
  viewMode: 'single' | 'all-three';
}

function cloneDefaultExhibitions(): ExhibitionConfig[] {
  return DEFAULT_EXHIBITIONS.map((item) => ({
    ...item,
    businessTypeOptions: [...item.businessTypeOptions],
    sectors: [...item.sectors],
    stallStatusOptions: [...item.stallStatusOptions],
    extraFields: [...item.extraFields],
    values: {
      ...item.values,
      businessTypes: [...item.values.businessTypes],
      selectedSectors: [...item.values.selectedSectors],
      stallStatus: [...item.values.stallStatus],
    },
  }));
}

const SERVER_SNAPSHOT: WorkspaceStoreState = {
  exhibitions: cloneDefaultExhibitions(),
  activeIndex: 0,
  viewMode: 'single',
};

let clientStoreState: WorkspaceStoreState | null = null;
const storeListeners = new Set<() => void>();

function readStateFromLocalStorage(): WorkspaceStoreState {
  const base = cloneDefaultExhibitions();
  if (typeof window === 'undefined') {
    return {
      exhibitions: base,
      activeIndex: 0,
      viewMode: 'single',
    };
  }

  let activeIndex = 0;
  let viewMode: 'single' | 'all-three' = 'single';

  try {
    const uiRaw = window.localStorage.getItem(STORAGE_KEY_UI);
    if (uiRaw) {
      const parsedUi = JSON.parse(uiRaw);
      if (
        typeof parsedUi.activeIndex === 'number' &&
        parsedUi.activeIndex >= 0 &&
        parsedUi.activeIndex < base.length
      ) {
        activeIndex = parsedUi.activeIndex;
      }
      if (
        parsedUi.viewMode === 'single' ||
        parsedUi.viewMode === 'all-three'
      ) {
        viewMode = parsedUi.viewMode;
      }
    }
  } catch {
    // Ignore UI parse error
  }

  try {
    const savedConfigsRaw =
      window.localStorage.getItem(STORAGE_KEY_CONFIGS) ||
      window.localStorage.getItem('ecoexpo_exhibitions_configs_v1');
    const savedValuesRaw =
      window.localStorage.getItem(STORAGE_KEY_VALUES) ||
      window.localStorage.getItem('ecoexpo_exhibitions_values_v1');

    if (!savedConfigsRaw && !savedValuesRaw) {
      return {
        exhibitions: base,
        activeIndex,
        viewMode,
      };
    }

    const savedConfigs: Record<string, Partial<ExhibitionConfig>> =
      savedConfigsRaw ? JSON.parse(savedConfigsRaw) : {};
    const savedValues: Record<string, ExhibitionFormValues> = savedValuesRaw
      ? JSON.parse(savedValuesRaw)
      : {};

    const mergedExhibitions = base.map((item) => {
      const cfg = savedConfigs[item.id];
      const val = savedValues[item.id] || cfg?.values;
      return {
        ...item,
        ...(cfg || {}),
        businessTypeOptions: Array.isArray(cfg?.businessTypeOptions)
          ? [...cfg.businessTypeOptions]
          : [...item.businessTypeOptions],
        sectors: Array.isArray(cfg?.sectors)
          ? [...cfg.sectors]
          : [...item.sectors],
        stallStatusOptions: Array.isArray(cfg?.stallStatusOptions)
          ? [...cfg.stallStatusOptions]
          : [...item.stallStatusOptions],
        extraFields: Array.isArray(cfg?.extraFields)
          ? cfg.extraFields.map((ef) => ({ ...ef }))
          : [...item.extraFields],
        values: val
          ? {
              ...item.values,
              ...val,
              businessTypes: Array.isArray(val.businessTypes)
                ? [...val.businessTypes]
                : [...item.values.businessTypes],
              selectedSectors: Array.isArray(val.selectedSectors)
                ? [...val.selectedSectors]
                : [...item.values.selectedSectors],
              stallStatus: Array.isArray(val.stallStatus)
                ? [...val.stallStatus]
                : [...item.values.stallStatus],
            }
          : item.values,
      };
    });

    return {
      exhibitions: mergedExhibitions,
      activeIndex,
      viewMode,
    };
  } catch {
    return {
      exhibitions: base,
      activeIndex,
      viewMode,
    };
  }
}

function writeStateToLocalStorage(state: WorkspaceStoreState): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY_UI,
      JSON.stringify({
        activeIndex: state.activeIndex,
        viewMode: state.viewMode,
      })
    );
  } catch {
    // Ignore quota errors
  }

  try {
    const valuesMap: Record<string, ExhibitionFormValues> = {};
    state.exhibitions.forEach((item) => {
      valuesMap[item.id] = item.values;
    });
    window.localStorage.setItem(STORAGE_KEY_VALUES, JSON.stringify(valuesMap));
  } catch {
    // Ignore quota errors
  }

  try {
    const configsMap: Record<string, ExhibitionConfig> = {};
    state.exhibitions.forEach((item) => {
      configsMap[item.id] = item;
    });
    window.localStorage.setItem(
      STORAGE_KEY_CONFIGS,
      JSON.stringify(configsMap)
    );
  } catch {
    // Fallback if huge base64 images exceed quota: persist all non-image editor settings
    try {
      const lightConfigsMap: Record<string, Partial<ExhibitionConfig>> = {};
      state.exhibitions.forEach((item) => {
        lightConfigsMap[item.id] = {
          ...item,
          customMainLogoUrl: null,
          customHeaderBgUrl: null,
          customFooterLogoUrl: null,
        };
      });
      window.localStorage.setItem(
        STORAGE_KEY_CONFIGS,
        JSON.stringify(lightConfigsMap)
      );
    } catch {
      // Ignore fallback error
    }
  }
}

function getClientSnapshot(): WorkspaceStoreState {
  if (!clientStoreState) {
    clientStoreState = readStateFromLocalStorage();
  }
  return clientStoreState;
}

function getServerSnapshot(): WorkspaceStoreState {
  return SERVER_SNAPSHOT;
}

function subscribeStore(listener: () => void): () => void {
  storeListeners.add(listener);
  const handleStorage = (e: StorageEvent) => {
    if (
      e.key === STORAGE_KEY_CONFIGS ||
      e.key === STORAGE_KEY_VALUES ||
      e.key === STORAGE_KEY_UI
    ) {
      clientStoreState = readStateFromLocalStorage();
      storeListeners.forEach((l) => l());
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  return () => {
    storeListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

function updateWorkspaceStore(
  updater: (prev: WorkspaceStoreState) => WorkspaceStoreState
): void {
  const current = getClientSnapshot();
  const next = updater(current);
  clientStoreState = next;
  writeStateToLocalStorage(next);
  storeListeners.forEach((listener) => listener());
}

export function ExhibitionWorkspace() {
  const { exhibitions, activeIndex, viewMode } = useSyncExternalStore(
    subscribeStore,
    getClientSnapshot,
    getServerSnapshot
  );
  const [templateEditMode, setTemplateEditMode] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const isFloorplanActive = useSyncExternalStore(subscribePage, getFloorplanPageSnapshot, () => false);
  const isOfferActive = useSyncExternalStore(subscribePage, getOfferPageSnapshot, () => false);
  const selectRegistrationForm = (index: number) => {
    window.location.assign('#top');
    updateWorkspaceStore(previous => ({ ...previous, activeIndex: index, viewMode: 'single' }));
  };

  const activeConfig = exhibitions[activeIndex] || exhibitions[0];

  const setActiveIndex = (nextIndex: number) => {
    updateWorkspaceStore((prev) => ({
      ...prev,
      activeIndex: nextIndex,
    }));
  };

  const setViewMode = (nextMode: 'single' | 'all-three') => {
    updateWorkspaceStore((prev) => ({
      ...prev,
      viewMode: nextMode,
    }));
  };

  const handleUpdateConfig = (
    index: number,
    partial: Partial<ExhibitionConfig>
  ) => {
    updateWorkspaceStore((prev) => ({
      ...prev,
      exhibitions: prev.exhibitions.map((item, idx) =>
        idx === index ? { ...item, ...partial } : item
      ),
    }));
  };

  const handleChangeValue = <K extends keyof ExhibitionFormValues>(
    index: number,
    field: K,
    value: ExhibitionFormValues[K]
  ) => {
    updateWorkspaceStore((prev) => ({
      ...prev,
      exhibitions: prev.exhibitions.map((item, idx) =>
        idx === index
          ? {
              ...item,
              values: {
                ...item.values,
                [field]: value,
              },
            }
          : item
      ),
    }));
  };

  const handleUpdateExtraFieldValue = (
    index: number,
    extraFieldId: string,
    value: string
  ) => {
    updateWorkspaceStore((prev) => ({
      ...prev,
      exhibitions: prev.exhibitions.map((item, idx) =>
        idx === index
          ? {
              ...item,
              extraFields: item.extraFields.map((ef) =>
                ef.id === extraFieldId ? { ...ef, value } : ef
              ),
            }
          : item
      ),
    }));
  };

  const handleFillSampleData = (index: number) => {
    const targetId = exhibitions[index].id;
    const sample = SAMPLE_FORM_VALUES[targetId];
    if (!sample) return;
    updateWorkspaceStore((prev) => ({
      ...prev,
      exhibitions: prev.exhibitions.map((item, idx) =>
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
      ),
    }));
  };

  const handleCopyValuesToAll = () => {
    const sourceValues = activeConfig.values;
    updateWorkspaceStore((prev) => ({
      ...prev,
      exhibitions: prev.exhibitions.map((item) => ({
        ...item,
        values: {
          ...sourceValues,
          businessTypes: [...sourceValues.businessTypes],
          selectedSectors: item.sectors.filter((s) =>
            sourceValues.selectedSectors.includes(s)
          ),
          stallStatus: [...sourceValues.stallStatus],
        },
      })),
    }));
  };

  // Reset only colors, Field Box Size ("Balanced (-2px)"), default pictures/logos, icons, and form fields while keeping all written form data unchanged
  const handleResetTemplate = (index: number) => {
    const original = DEFAULT_EXHIBITIONS[index];
    updateWorkspaceStore((prev) => ({
      ...prev,
      exhibitions: prev.exhibitions.map((item, idx) =>
        idx === index
          ? {
              ...original,
              themePresetId: original.themePresetId,
              compactLevel: 'compact',
              logoType: original.logoType,
              customMainLogoUrl: null,
              customHeaderBgUrl: null,
              customFooterLogoUrl: null,
              sectorLayout: original.sectorLayout,
              businessTypeOptions: [...original.businessTypeOptions],
              sectors: [...original.sectors],
              stallStatusOptions: [...original.stallStatusOptions],
              extraFields: [],
              values: {
                ...item.values,
                businessTypes: [...item.values.businessTypes],
                selectedSectors: [...item.values.selectedSectors],
                stallStatus: [...item.values.stallStatus],
              },
            }
          : item
      ),
    }));
  };

  const handleResetTopBar = () => {
    if (viewMode === 'all-three') {
      updateWorkspaceStore((prev) => ({
        ...prev,
        exhibitions: prev.exhibitions.map((item, idx) => {
          const original = DEFAULT_EXHIBITIONS[idx];
          return {
            ...original,
            themePresetId: original.themePresetId,
            compactLevel: 'compact',
            logoType: original.logoType,
            customMainLogoUrl: null,
            customHeaderBgUrl: null,
            customFooterLogoUrl: null,
            sectorLayout: original.sectorLayout,
            businessTypeOptions: [...original.businessTypeOptions],
            sectors: [...original.sectors],
            stallStatusOptions: [...original.stallStatusOptions],
            extraFields: [],
            values: {
              ...item.values,
              businessTypes: [...item.values.businessTypes],
              selectedSectors: [...item.values.selectedSectors],
              stallStatus: [...item.values.stallStatus],
            },
          };
        }),
      }));
    } else {
      handleResetTemplate(activeIndex);
    }
  };

  const handlePrint = async () => {
    if (isExporting) return;
    // Commit the final inline edit and remove editor decoration before capture.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    flushSync(() => {
      setTemplateEditMode(false);
      setIsExporting(true);
      setExportError(null);
    });
    try {
      const sheets = Array.from(document.querySelectorAll<HTMLElement>('[data-exhibition-sheet]'));
      const name = viewMode === 'all-three' ? 'ECO-Expo-All-Forms' : activeConfig.id;
      await exportExhibitionPdf(sheets, `${name}.pdf`);
    } catch (error) {
      console.error('PDF export failed', error);
      setExportError('Unable to download the PDF. Please check that all images have loaded and try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white print:min-h-0 print:bg-white print:block print:m-0 print:p-0">
      <StudioNavigation page={isFloorplanActive ? 'floorplan' : isOfferActive ? 'offer' : 'register'}
        exhibitions={exhibitions} activeIndex={activeIndex} onSelectForm={selectRegistrationForm} />
      {!isFloorplanActive && !isOfferActive && <div className="flex flex-wrap items-center justify-between gap-4 w-full max-w-[1440px] mx-auto px-4 sm:px-8 py-4 border-b border-slate-100 print:hidden">
        <nav aria-label="Registration form templates" className="flex flex-wrap items-center gap-2">
          {exhibitions.map((exhibition, index) => <button key={exhibition.id} type="button" onClick={() => selectRegistrationForm(index)}
            aria-current={viewMode === 'single' && activeIndex === index ? 'page' : undefined}
            className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${viewMode === 'single' && activeIndex === index ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}>{exhibition.shortCode}</button>)}
        </nav>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetTopBar}
            className="px-3.5 py-2 text-xs font-bold text-black bg-white border border-black rounded-lg hover:bg-amber-100/80 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
            title="Reset default colors, Balanced (-2px) field size, pictures, icons, and fields while keeping all written form data unchanged"
          >
            <RotateCcw className="w-3.5 h-3.5 text-black" />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={isExporting}
            aria-busy={isExporting}
            title="Download a fillable PDF. Recipients can type, tick options, and save their completed copy in a PDF reader."
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Preparing PDF…' : 'Print / Export PDF'}</span>
          </button>
        </div>
      </div>}
      {exportError && <p role="alert" className="px-6 py-2 text-sm text-red-700 print:hidden">{exportError}</p>}

      {/* ==================== MAIN WORKSPACE AREA ==================== */}
      {isOfferActive ? <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 sm:p-8 bg-[#f7f7fc] mt-6 mb-8">
        <OfferletterPage exhibitions={exhibitions} />
      </main> : isFloorplanActive ? <main className="flex-1 w-full min-w-0 p-4 sm:p-8">
        <FloorplanPage />
      </main> : <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 flex flex-col lg:flex-row items-start justify-center gap-6 print:p-0 print:m-0 print:max-w-none print:w-[210mm] print:block">
        {/* Left/Center A4 Form Viewport */}
        <div className="w-full flex-1 flex flex-col items-center overflow-x-auto pb-8 print:pb-0 print:m-0 print:p-0 print:w-[210mm] print:block print:overflow-visible">
          {viewMode === 'single' ? (
            <div className="flex flex-col items-center print:block print:m-0 print:p-0 print:w-[210mm]">
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
            <div className="flex flex-col items-center gap-10 print:gap-0 print:block print:m-0 print:p-0 print:w-[210mm]">
              {exhibitions.map((expo, idx) => (
                <div
                  key={expo.id}
                  id={`form-page-${expo.id}`}
                  className="flex flex-col items-center print:block print:m-0 print:p-0 print:w-[210mm] print:break-after-page print:last:break-after-auto"
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
                    <div className="flex items-center gap-2.5">
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
                        className="px-2.5 py-1 text-xs font-bold text-black bg-white border border-black rounded-lg hover:bg-amber-100/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-black" />
                        <span>Reset Default</span>
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
          onCopyValuesToAll={handleCopyValuesToAll}
          onResetCurrentTemplate={() => handleResetTemplate(activeIndex)}
        />
      </main>}
    </div>
  );
}

