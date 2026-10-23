import type { LogoPresetType } from './exhibition-data';

const ASSET_ROOT = '/assets/eco-expo';

export const EXHIBITION_ASSETS: Record<LogoPresetType, { logo: string; sectorIcon: string }> = {
  dta: {
    logo: `${ASSET_ROOT}/DTA-form-logo.png`,
    sectorIcon: `${ASSET_ROOT}/DTA-showcasing-sector-icon.png`,
  },
  dcc: {
    logo: `${ASSET_ROOT}/DCC-form-logo.png`,
    sectorIcon: `${ASSET_ROOT}/DCC-showcasing-sector-icon.png`,
  },
  dme: {
    logo: `${ASSET_ROOT}/DIDMEE-form-logo.png`,
    sectorIcon: `${ASSET_ROOT}/DIDMEE-showcasing-sector-icon.png`,
  },
};

export const FOOTER_LOGO = `${ASSET_ROOT}/Footer-eco-expo-logo.png`;
