import type {Metadata} from 'next';
import {Open_Sans, Inter} from 'next/font/google';
import './globals.css';

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-open-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Exhibition Registration Form Studio',
  description:
    'Dynamic, customizable A4 exhibition registration forms for Dhaka International Expos built with Next.js, TypeScript, Tailwind CSS, Inter, and Open Sans.',
  openGraph: {
    title: 'Exhibition Registration Form Studio',
    description:
      'Dynamic, customizable A4 exhibition registration forms for Dhaka International Expos built with Next.js, TypeScript, Tailwind CSS, Inter, and Open Sans.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exhibition Registration Form Studio',
    description:
      'Dynamic, customizable A4 exhibition registration forms for Dhaka International Expos built with Next.js, TypeScript, Tailwind CSS, Inter, and Open Sans.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${openSans.variable} ${inter.variable}`}>
      <body
        className={`${inter.className} antialiased bg-slate-100 text-slate-900`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
