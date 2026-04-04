import { useRef, useEffect, useCallback } from 'react';
import type { Party, CompassPosition, AxisId } from '@voxcite/shared';
import { AXES, COMPASS_COLORS, COMPASS_SIZES } from '@voxcite/shared';

interface CompassCanvas2DProps {
  parties: Party[];
  userPosition?: CompassPosition;
  xAxis: AxisId;
  yAxis: AxisId;
  highlightedPartyId: string | null;
  onPartyHover: (id: string | null) => void;
}

export function CompassCanvas2D({
  parties, userPosition, xAxis, yAxis, highlightedPartyId, onPartyHover,
}: CompassCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(container.clientWidth, 500);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const margin = 50;
    const center = size / 2;
    const extent = size / 2 - margin;

    const toCanvas = (val: number, invert: boolean) =>
      center + val * extent * (invert ? -1 : 1);

    const toX = (pos: CompassPosition) => toCanvas(pos[xAxis], false);
    const toY = (pos: CompassPosition) => toCanvas(pos[yAxis], true); // Y inverted (up = positive)

    // Grid lines
    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i += 0.5) {
      const x = toCanvas(i, false);
      const y = toCanvas(i, true);
      ctx.beginPath(); ctx.moveTo(x, margin); ctx.lineTo(x, size - margin); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(size - margin, y); ctx.stroke();
    }

    // Main axes (thicker)
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(margin, center); ctx.lineTo(size - margin, center); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(center, margin); ctx.lineTo(center, size - margin); ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px system-ui';
    const xInfo = AXES[xAxis];
    const yInfo = AXES[yAxis];

    ctx.textAlign = 'left'; ctx.fillText(xInfo.negative, margin, center - 8);
    ctx.textAlign = 'right'; ctx.fillText(xInfo.positive, size - margin, center - 8);
    ctx.textAlign = 'center';
    ctx.fillText(yInfo.positive, center, margin - 8);
    ctx.fillText(yInfo.negative, center, size - margin + 18);

    // Party dots
    for (const p of parties) {
      const px = toX(p.position);
      const py = toY(p.position);
      const highlighted = p.id === highlightedPartyId;
      const radius = highlighted ? COMPASS_SIZES.partyDotRadius + 3 : COMPASS_SIZES.partyDotRadius;
      const alpha = highlighted ? 1 : highlightedPartyId ? 0.25 : 0.85;

      ctx.globalAlpha = alpha;

      // Dot
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();

      // Border for visibility
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = highlighted ? '#FFFFFF' : '#D1D5DB';
      ctx.font = `${highlighted ? 'bold ' : ''}${COMPASS_SIZES.partyLabelFontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(p.abbreviation, px, py - radius - 5);

      ctx.globalAlpha = 1;
    }

    // User dot
    if (userPosition) {
      const ux = toX(userPosition);
      const uy = toY(userPosition);

      ctx.fillStyle = COMPASS_COLORS.userDot;
      ctx.beginPath();
      ctx.arc(ux, uy, COMPASS_SIZES.userDotRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COMPASS_COLORS.userDotBorder;
      ctx.lineWidth = COMPASS_SIZES.userDotBorderWidth;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${COMPASS_SIZES.userLabelFontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('Toi', ux, uy - COMPASS_SIZES.userDotRadius - 8);
    }
  }, [parties, userPosition, xAxis, yAxis, highlightedPartyId]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const size = rect.width;
      const margin = 50;
      const center = size / 2;
      const extent = size / 2 - margin;

      const toX = (pos: CompassPosition) => center + pos[xAxis] * extent;
      const toY = (pos: CompassPosition) => center - pos[yAxis] * extent;

      let closest: string | null = null;
      let minDist = 25;

      for (const p of parties) {
        const px = toX(p.position);
        const py = toY(p.position);
        const dist = Math.sqrt((mx - px) ** 2 + (my - py) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = p.id;
        }
      }

      onPartyHover(closest);
    },
    [parties, xAxis, yAxis, onPartyHover],
  );

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onPartyHover(null)}
        className="cursor-crosshair"
      />
    </div>
  );
}
