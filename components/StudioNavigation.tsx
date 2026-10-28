'use client';

import { useEffect, useRef } from 'react';
import { Menu } from 'lucide-react';
import type { ExhibitionConfig } from '@/lib/exhibition-data';
import styles from './studio-navigation.module.css';

type StudioPage = 'register' | 'offer' | 'floorplan';
export function StudioNavigation({ page, exhibitions, activeIndex, onSelectForm }: {
  page: StudioPage; exhibitions: ExhibitionConfig[]; activeIndex: number;
  onSelectForm: (index: number) => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  const tabs = useRef<HTMLElement>(null);
  useEffect(() => {
    const strip = tabs.current, active = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (strip && active && strip.scrollWidth > strip.clientWidth) strip.scrollLeft = active.offsetLeft - strip.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
  }, [page]);
  useEffect(() => {
    const close = (event: PointerEvent) => { if (menu.current && !menu.current.contains(event.target as Node)) menu.current.open = false; };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && menu.current?.open) { menu.current.open = false; menu.current.querySelector('summary')?.focus(); } };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
  }, []);
  const close = () => { if (menu.current) menu.current.open = false; };
  return <header data-studio-navigation className={styles.header}>
    <div className={styles.inner}>
      <nav ref={tabs} aria-label="Studio pages" className={styles.tabs}>
        {[
          ['register', '#top', 'Register form'],
          ['offer', '#offer-letter', 'Offer letter'],
          ['floorplan', '#floorplan', 'Floor map'],
        ].map(([key, href, label]) => <a key={key} href={href}
          className={`${styles.tab} ${key === 'floorplan' ? styles.mapTab : ''}`}
          aria-current={page === key ? 'page' : undefined}>{label}</a>)}
      </nav>
      <details ref={menu} className={styles.menu}>
        <summary aria-label="Open studio menu" title="Menu"><Menu size={29} strokeWidth={2.7} /></summary>
        <nav className={styles.dropdown} aria-label="Studio menu">
          <span className={styles.menuTitle}>Registration forms</span>
          {exhibitions.map((exhibition, index) => <button key={exhibition.id} type="button"
            aria-current={page === 'register' && activeIndex === index ? 'page' : undefined}
            onClick={() => { onSelectForm(index); close(); }}>{exhibition.shortCode}</button>)}
          <span className={styles.separator} />
          <a href="#offer-letter" onClick={close}>Offer letter</a>
          <a href="#floorplan" onClick={close}>Floor map</a>
        </nav>
      </details>
    </div>
  </header>;
}
