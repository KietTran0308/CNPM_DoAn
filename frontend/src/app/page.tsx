'use client';
import dynamic from 'next/dynamic';

const BrewLiteApp = dynamic(() => import('../App'), { ssr: false, loading: () => (
  <div className="min-h-screen grid place-items-center text-emerald-900">Đang tải BrewLite...</div>
) });

export default function Home() { return <BrewLiteApp />; }
