import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { CompassPosition, Party } from '@partiprism/shared';
import { SharePanel } from './SharePanel';

interface ShareButtonProps {
  userPosition: CompassPosition;
  parties: Party[];
}

export function ShareButton({ userPosition, parties }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label="Partager PartiPrism"
        aria-expanded={open}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors focus-ring ${
          open
            ? 'bg-amber-500 text-white'
            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700'
        }`}
      >
        {/* Share icon — box with arrow */}
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        <span className="hidden sm:inline">Partager</span>
      </button>

      {open && (
        <>
          {/* Backdrop (mobile full-screen feel) */}
          <div className="fixed inset-0 z-40 bg-black/30 sm:hidden" onClick={() => setOpen(false)} aria-hidden="true" />

          {/* Floating panel */}
          <div
            ref={panelRef}
            role="dialog"
            aria-label="Partager PartiPrism"
            className="absolute right-0 top-full mt-2 z-50 w-[min(92vw,380px)] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white">Partager PartiPrism</p>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-300 text-lg leading-none focus-ring rounded p-1"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>
            <SharePanel userPosition={userPosition} parties={parties} />
          </div>
        </>
      )}
    </div>
  );
}
