'use client';

import { EXHIBITION_ASSETS, FOOTER_LOGO } from '@/lib/exhibition-assets';
import React, { useRef, useState } from 'react';
import { Upload, RotateCcw } from 'lucide-react';
import {
  LogoPresetType,
  readAndOptimizeImageFile,
} from '@/lib/exhibition-data';

interface MainLogoProps {
  logoType: LogoPresetType;
  customLogoUrl: string | null;
  onUploadLogo: (dataUrl: string | null) => void;
  interactive?: boolean;
}

export function ExhibitionMainLogo({
  logoType,
  customLogoUrl,
  onUploadLogo,
  interactive = true,
}: MainLogoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTallImage, setIsTallImage] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndOptimizeImageFile(file, (dataUrl) => {
      onUploadLogo(dataUrl);
    });
    e.target.value = '';
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setIsTallImage(img.naturalHeight > img.naturalWidth);
    }
  };

  return (
    <div className="relative w-full h-full p-0 flex items-center justify-center group select-none overflow-hidden">
      {interactive && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {customLogoUrl ? (
        <div
          className={`w-full h-full flex items-center justify-center overflow-hidden pr-[8px] ${
            isTallImage ? 'py-[8px]' : ''
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customLogoUrl}
            alt="Exhibition Logo"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            className={
              isTallImage
                ? 'h-full w-auto max-w-full object-contain block'
                : 'w-full h-auto max-h-full object-contain block'
            }
          />
        </div>
      ) : (
        <div className="w-full h-full pr-[8px] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={EXHIBITION_ASSETS[logoType].logo} alt="Exhibition Logo" className="w-full h-full object-contain block" />
        </div>
      )}

      {interactive && (
        <div className="print:hidden absolute inset-0 bg-slate-900/75 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-white text-slate-900 rounded text-[11px] font-semibold flex items-center gap-1 shadow hover:bg-slate-100 cursor-pointer whitespace-nowrap shrink-0"
            title="Upload custom logo image"
          >
            <Upload className="w-3 h-3" />
            <span>Replace Logo</span>
          </button>
          {customLogoUrl && (
            <button
              type="button"
              onClick={() => onUploadLogo(null)}
              className="p-1 bg-rose-600 text-white rounded text-[11px] hover:bg-rose-500 cursor-pointer"
              title="Reset to default logo"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface FooterLogoProps {
  variant: 'light' | 'dark';
  customLogoUrl: string | null;
  onUploadLogo: (dataUrl: string | null) => void;
  interactive?: boolean;
}

export function EcoExpoFooterLogo({
  customLogoUrl,
  onUploadLogo,
  interactive = true,
}: FooterLogoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWideImage, setIsWideImage] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readAndOptimizeImageFile(file, (dataUrl) => {
      onUploadLogo(dataUrl);
    });
    e.target.value = '';
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setIsWideImage(img.naturalWidth > img.naturalHeight * 3.5);
    }
  };

  return (
    <div className="relative h-full py-[2px] inline-flex items-center group select-none">
      {interactive && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {customLogoUrl ? (
        <div className="h-full w-auto max-w-[220px] flex items-center justify-start overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={customLogoUrl}
            alt="Organizer Logo"
            referrerPolicy="no-referrer"
            onLoad={handleImageLoad}
            className={
              isWideImage
                ? 'w-full h-auto max-h-full object-contain block'
                : 'h-full w-auto max-w-full object-contain block'
            }
          />
        </div>
      ) : (
        <div className="h-full flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FOOTER_LOGO} alt="Organized by ECOEXPO" className="h-full w-auto object-contain block" />
        </div>
      )}

      {interactive && (
        <div className="print:hidden ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-black/75 text-white text-[9.5px] font-semibold px-2 py-1 rounded flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
            title="Replace footer organizer logo"
          >
            <Upload className="w-2.5 h-2.5" />
            <span>Replace Logo</span>
          </button>
          {customLogoUrl && (
            <button
              type="button"
              onClick={() => onUploadLogo(null)}
              className="p-1 bg-rose-600 text-white rounded hover:bg-rose-500 cursor-pointer"
              title="Reset footer logo"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
