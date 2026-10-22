'use client';

import React, { useRef, useState } from 'react';
import { Globe, Upload, RotateCcw } from 'lucide-react';
import { LogoPresetType } from '@/lib/exhibition-data';

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
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
          {logoType === 'dta' && <DtaPresetLogo />}
          {logoType === 'dcc' && <DccPresetLogo />}
          {logoType === 'dme' && <DmePresetLogo />}
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

function DtaPresetLogo() {
  return (
    <div className="w-full h-full flex items-center justify-center gap-3.5">
      {/* Exact DTA Diagonal Bars + Orange Scalloped L-Border Emblem */}
      <div className="relative w-[54px] h-[54px] shrink-0">
        {/* Diagonal dark charcoal rounded bars in top-left */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="w-[8px] h-[8px] rounded-full bg-[#1C252C] absolute top-[2px] left-[2px]" />
          <div className="w-[29px] h-[5.5px] rounded-full bg-[#1C252C] -rotate-45 absolute top-[8px] -left-[3px]" />
          <div className="w-[43px] h-[5.5px] rounded-full bg-[#1C252C] -rotate-45 absolute top-[14px] -left-[4px]" />
          <div className="w-[50px] h-[5.5px] rounded-full bg-[#1C252C] -rotate-45 absolute top-[22px] -left-[2px]" />
          <div className="w-[36px] h-[5.5px] rounded-full bg-[#1C252C] -rotate-45 absolute top-[31px] left-[7px]" />
          {/* Inner dark dots along bottom/right of diagonal bars */}
          <div className="w-[6px] h-[6px] rounded-full bg-[#1C252C] absolute top-[21px] right-[11px]" />
          <div className="w-[6px] h-[6px] rounded-full bg-[#1C252C] absolute bottom-[11px] right-[11px]" />
          <div className="w-[6px] h-[6px] rounded-full bg-[#1C252C] absolute bottom-[11px] left-[21px]" />
        </div>

        {/* Orange Scalloped L-Border on Right & Bottom */}
        <div className="absolute right-[1px] top-[12px] bottom-[2px] w-[7.5px] bg-[#F05A0B] rounded-full" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute right-[0px] top-[11px]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute right-[0px] top-[21px]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute right-[0px] top-[31px]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute right-[0px] bottom-[0px]" />

        <div className="absolute bottom-[1px] left-[12px] right-[2px] h-[7.5px] bg-[#F05A0B] rounded-full" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute bottom-[0px] left-[11px]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute bottom-[0px] left-[21px]" />
        <div className="w-[10px] h-[10px] rounded-full bg-[#F05A0B] absolute bottom-[0px] left-[31px]" />
      </div>

      {/* Exact DTA Typography: Stenciled D + Dark-Top/Orange-Stem T + Sharp Lambda */}
      <div className="relative flex items-center h-[42px] gap-[7px]">
        {/* Stenciled D */}
        <div className="relative w-[30px] h-[40px]">
          <div className="absolute left-0 top-0 w-[7px] h-[17px] bg-[#1C252C]" />
          <div className="absolute left-0 bottom-0 w-[7px] h-[17px] bg-[#1C252C]" />
          <div className="absolute inset-0 rounded-r-[20px] border-[7px] border-l-0 border-[#1C252C]" />
        </div>

        {/* Split T (Dark crossbar + Orange vertical stem) */}
        <div className="relative w-[28px] h-[40px] flex flex-col items-center justify-between">
          <div className="w-full h-[7px] bg-[#1C252C]" />
          <div className="w-[7.5px] h-[28px] bg-[#F05A0B]" />
        </div>

        {/* Sharp Lambda (Λ) */}
        <div className="relative w-[33px] h-[40px] [clip-path:polygon(40%_0,60%_0,100%_100%,76%_100%,50%_28%,24%_100%,0_100%)] bg-[#1C252C]" />

        {/* TM Badge */}
        <span className="-mt-8 -ml-1 w-[14px] h-[14px] rounded-full border border-[#1C252C] text-[#1C252C] text-[6px] font-bold flex items-center justify-center leading-none">
          TM
        </span>
      </div>
    </div>
  );
}

function DccPresetLogo() {
  return (
    <div className="w-full h-full flex items-center justify-center gap-2.5">
      {/* Molecular node icon */}
      <div className="relative w-[56px] h-[56px] flex items-center justify-center shrink-0">
        <div className="w-3 h-3 rounded-full bg-[#231F20] absolute left-0.5 top-1/2 -translate-y-1/2" />
        <div className="w-3 h-3 rounded-full bg-[#F5A800] absolute right-0.5 top-1/2 -translate-y-1/2" />
        <div className="w-3 h-3 rounded-full bg-[#231F20] absolute top-0.5 left-1/2 -translate-x-1/2" />
        <div className="w-3 h-3 rounded-full bg-[#231F20] absolute bottom-0.5 left-1/2 -translate-x-1/2" />
        <div className="w-3 h-3 rounded-full bg-[#231F20] absolute left-3.5 top-3.5" />
        <div className="w-3 h-3 rounded-full bg-[#231F20] absolute left-3.5 bottom-3.5" />
        <div className="w-3 h-3 rounded-full bg-[#F5A800] absolute right-3.5 top-3.5" />
        <div className="w-3 h-3 rounded-full bg-[#F5A800] absolute right-3.5 bottom-3.5" />
        <div className="w-[3.5px] h-10 bg-[#231F20] rounded-full" />
      </div>

      {/* DCC Split Color Typography */}
      <div className="relative flex items-center font-black text-[46px] leading-none tracking-tight">
        {['D', 'C', 'C'].map((letter, idx) => (
          <div key={idx} className="relative leading-none">
            <span className="text-[#231F20] block">{letter}</span>
            <span className="text-[#F5A800] block absolute inset-0 overflow-hidden [clip-path:inset(52%_0_0_0)]">
              {letter}
            </span>
          </div>
        ))}
        <span className="ml-0.5 self-start mt-1 w-3.5 h-3.5 rounded-full border border-[#231F20] text-[#231F20] text-[6px] font-bold flex items-center justify-center">
          TM
        </span>
      </div>
    </div>
  );
}

function DmePresetLogo() {
  return (
    <div className="w-full h-full flex items-center justify-center gap-2">
      {/* Medical Cross Emblem */}
      <div className="relative w-[56px] h-[56px] shrink-0 flex items-center justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[24px] h-[22px] rounded-t-full border-[4px] border-b-0 border-[#0A3D6A]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[24px] h-[22px] rounded-b-full border-[4px] border-t-0 border-[#0A3D6A]" />
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[22px] h-[24px] rounded-l-full border-[4px] border-r-0 border-[#0A3D6A]" />
        <div className="absolute right-0 top-[15px] w-[20px] h-[4px] bg-[#0A3D6A] rounded-r" />
        <div className="absolute right-0 bottom-[15px] w-[20px] h-[4px] bg-[#0A3D6A] rounded-r" />
        <div className="w-3 h-3 rounded-full bg-[#E1251B] z-10" />
      </div>

      {/* Text stack */}
      <div className="flex flex-col leading-none">
        <span className="text-[7.5px] font-bold tracking-[0.06em] text-[#0A3D6A] uppercase">
          DHAKA INTERNATIONAL
        </span>
        <span className="text-[13px] font-extrabold tracking-[0.04em] text-[#E1251B] uppercase mt-[1px]">
          DIAGNOSTIC
        </span>
        <span className="text-[19px] font-normal tracking-[0.03em] text-[#1A659E] uppercase leading-[0.95]">
          MEDICAL
        </span>
        <span className="text-[12.5px] font-bold tracking-[0.05em] text-[#E1251B] uppercase">
          EQUIPMENT
        </span>
      </div>

      {/* Vertical EXPO badge */}
      <div className="bg-[#1A659E] text-white text-[7.5px] font-bold px-[3px] py-1.5 rounded-[1px] flex flex-col items-center justify-center leading-[1.05] uppercase">
        <span>E</span>
        <span>X</span>
        <span>P</span>
        <span>O</span>
      </div>
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
  variant,
  customLogoUrl,
  onUploadLogo,
  interactive = true,
}: FooterLogoProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isWideImage, setIsWideImage] = useState<boolean>(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadLogo(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
        <div className="flex items-stretch h-full">
          <div className="bg-[#1C6BA0] text-white text-[6px] font-semibold px-[3px] flex items-center justify-center rounded-l-[2px]">
            <span className="[writing-mode:vertical-rl] rotate-180 tracking-wider uppercase leading-none">
              Organized By
            </span>
          </div>
          <div className="flex flex-col items-center justify-between px-2 py-[1px] h-full">
            <div className="w-7 h-[20px] rounded-t-full bg-[#2A85C6] flex items-center justify-center overflow-hidden">
              <Globe className="w-[18px] h-[18px] text-white/95" />
            </div>
            <div
              className={`text-[10.5px] font-extrabold tracking-tight leading-none ${
                variant === 'dark' ? 'text-[#3898EC]' : 'text-[#1C6BA0]'
              }`}
            >
              ECO<span className="font-normal">EXPO</span>
            </div>
            <span
              className={`text-[5px] leading-none ${
                variant === 'dark' ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Together we win
            </span>
          </div>
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
