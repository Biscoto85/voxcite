import { useRef, useEffect, useCallback } from 'react';
import type { Party, CompassPosition } from '@partiprism/shared';
import { COMPASS_COLORS, COMPASS_SIZES } from '@partiprism/shared';

interface CompassCanvas1DProps {
  parties: Party[];
  userPosition?: CompassPosition;
  highlightedPartyId: string | null;
  onPartyHover: (id: string | null) => void;
}

export function CompassCanvas1D({ parties, userPosition, highlightedPartyId, onPartyHover }: CompassCanvas1DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth;
    const h = 120;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const margin = 60;
    const barY = h / 2;
    const barLeft = margin;
    const barRight = w - margin;
    const barWidth = barRight - barLeft;

    // Axis line
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(barLeft, barY);
    ctx.lineTo(barRight, barY);
    ctx.stroke();

    // Tick marks
    for (let i = 0; i <= 4; i++) {
      const x = barLeft + (barWidth * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, barY - 6);
      ctx.lineTo(x, barY + 6);
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '11px system-ui';
    ctx.textAlign = 'left';
    ctx.fillText('Gauche', barLeft, barY + 24);
    ctx.textAlign = 'right';
    ctx.fillText('Droite', barRight, barY + 24);
    ctx.textAlign = 'center';
    ctx.fillText('Centre', barLeft + barWidth / 2, barY + 24);

    const toX = (val: number) => barLeft + ((val + 1) / 2) * barWidth;

    // Party dots
    for (const p of parties) {
      const x = toX(p.position1d);
      const highlighted = p.id === highlightedPartyId;
      const radius = highlighted ? COMPASS_SIZES.partyDotRadius + 3 : COMPASS_SIZES.partyDotRadius;
      const alpha = highlighted ? 1 : highlightedPartyId ? 0.3 : 0.85;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(x, barY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = highlighted ? '#FFFFFF' : '#D1D5DB';
      ctx.font = `${highlighted ? 'bold ' : ''}${COMPASS_SIZES.partyLabelFontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(p.abbreviation, x, barY - radius - 6);
      ctx.globalAlpha = 1;
    }

    // User dot (with glow)
    if (userPosition) {
      const x = toX(userPosition.societal * 0.4 + userPosition.economic * -0.6); // projection 1D
      const r = COMPASS_SIZES.userDotRadius + 2;

      // Glow halo
      const glow = ctx.createRadialGradient(x, barY, r, x, barY, r * 3);
      glow.addColorStop(0, 'rgba(245, 183, 49, 0.4)');
      glow.addColorStop(1, 'rgba(245, 183, 49, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, barY, r * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COMPASS_COLORS.userDot;
      ctx.beginPath();
      ctx.arc(x, barY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COMPASS_COLORS.userDotBorder;
      ctx.lineWidth = COMPASS_SIZES.userDotBorderWidth;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${COMPASS_SIZES.userLabelFontSize + 1}px system-ui`;
      ctx.fillText('Toi', x, barY - r - 8);
    }
  }, [parties, userPosition, highlightedPartyId]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(draw);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const margin = 60;
      const barY = 60;
      const barLeft = margin;
      const barRight = container.clientWidth - margin;
      const barWidth = barRight - barLeft;

      const toX = (val: number) => barLeft + ((val + 1) / 2) * barWidth;

      let closest: string | null = null;
      let minDist = 20;

      for (const p of parties) {
        const x = toX(p.position1d);
        const dist = Math.sqrt((mx - x) ** 2 + (my - barY) ** 2);
        if (dist < minDist) {
          minDist = dist;
          closest = p.id;
        }
      }

      onPartyHover(closest);
    },
    [parties, onPartyHover],
  );

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => onPartyHover(null)}
        className="cursor-crosshair"
      />
    </div>
  );
}
