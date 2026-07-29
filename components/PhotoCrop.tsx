'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const OUT = 800; // exported square, same size the admin reference photos use

interface Props {
  hint: string;
  zoomLabel: string;
  onReady: (blob: Blob | null) => void;
}

// Square cropper: drag to pan, slider to zoom, exported through a canvas.
// Deliberately no pinch-to-zoom — a slider behaves identically on every phone and
// avoids fighting the browser's own gesture handling.
export default function PhotoCrop({ hint, zoomLabel, onReady }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // The viewport is square and fluid, so measure it. Measure synchronously first:
  // ResizeObserver callbacks are frame-driven and never arrive in a background tab,
  // which would leave the crop maths running against a width of 0.
  const [view, setView] = useState(0);
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    setView(box.clientWidth);
    const ro = new ResizeObserver(() => setView(box.clientWidth)); // later: rotation, keyboard
    ro.observe(box);
    return () => ro.disconnect();
  }, [src]);

  const base = nat && view ? view / Math.min(nat.w, nat.h) : 1;
  const dispW = nat ? nat.w * base * zoom : 0;
  const dispH = nat ? nat.h * base * zoom : 0;

  const clamp = useCallback(
    (x: number, y: number) => ({
      x: Math.min(0, Math.max(view - dispW, x)),
      y: Math.min(0, Math.max(view - dispH, y)),
    }),
    [view, dispW, dispH],
  );

  // keep the crop inside the image whenever zoom or measurements change
  useEffect(() => {
    if (nat && view) setOffset((o) => clamp(o.x, o.y));
  }, [zoom, view, nat, clamp]);

  const emit = useCallback(() => {
    const img = imgRef.current;
    if (!img || !nat || !view) return onReady(null);
    const scale = base * zoom;
    const canvas = document.createElement('canvas');
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return onReady(null);
    const sSize = view / scale; // source pixels visible in the square viewport
    ctx.drawImage(img, -offset.x / scale, -offset.y / scale, sSize, sSize, 0, 0, OUT, OUT);
    canvas.toBlob((b) => onReady(b), 'image/webp', 0.9);
  }, [base, zoom, offset, nat, view, onReady]);

  // re-export on every adjustment so the parent always holds the current crop
  useEffect(() => {
    if (src && nat && view) emit();
  }, [src, nat, view, zoom, offset, emit]);

  // A blob URL can finish loading before React attaches onLoad, so the event is missed.
  // Read the dimensions off the element too whenever it is already complete.
  useLayoutEffect(() => {
    const img = imgRef.current;
    if (src && img?.complete && img.naturalWidth) setNat({ w: img.naturalWidth, h: img.naturalHeight });
  }, [src]);

  function pick(file: File) {
    setSrc((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNat(null);
  }

  if (!src) {
    return (
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center transition hover:border-accent">
        <span className="text-3xl" aria-hidden>📷</span>
        <span className="font-semibold text-accent">{hint}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) pick(f);
          }}
        />
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={boxRef}
        className="relative aspect-square w-full touch-none overflow-hidden rounded-2xl bg-surface-2 select-none"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const d = drag.current;
          setOffset(clamp(d.ox + (e.clientX - d.x), d.oy + (e.clientY - d.y)));
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const el = e.currentTarget;
            setNat({ w: el.naturalWidth, h: el.naturalHeight });
          }}
          style={{
            position: 'absolute',
            left: offset.x,
            top: offset.y,
            width: dispW || undefined,
            height: dispH || undefined,
            maxWidth: 'none',
            cursor: 'grab',
          }}
        />
        {/* face guide: a soft circle showing where faces should land */}
        <div className="pointer-events-none absolute inset-[8%] rounded-full border-2 border-white/50" />
      </div>

      <label className="flex items-center gap-3 text-sm text-ink-muted">
        {zoomLabel}
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="flex-1 cursor-pointer accent-accent"
        />
      </label>

      <label className="cursor-pointer text-center text-sm text-ink-muted underline">
        {hint}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) pick(f);
          }}
        />
      </label>
    </div>
  );
}
