'use client';

import { Instrument_Sans } from 'next/font/google';
import PreviewViewer from './preview';
import { standaloneFloorplan } from './context';
import styles from './host.module.css';

const instrument = Instrument_Sans({ subsets: ['latin'], display: 'swap' });

export default function FloorplanPage() {
  return <section aria-label="Floorplan" data-floorplan-page className={`${instrument.className} ${styles.host}`}
    style={{ width: '100%', minWidth: 0, fontSize: 16, lineHeight: 1.625 }}>
    <PreviewViewer {...standaloneFloorplan} />
  </section>;
}
