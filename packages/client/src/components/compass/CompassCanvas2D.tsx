import { useRef, useEffect, useCallback, useState } from 'react';
import type { Party, CompassPosition, AxisId } from '@partiprism/shared';
import { AXES, COMPASS_COLORS, COMPASS_SIZES } from '@partiprism/shared';

interface NebulaData {
  mode: 'points' | 'kde';
  totalResponses: number;
  orphanStats?: { total: number; orphanCount: number; orphanPct: number };
  points?: Array<{ x: number; y: number; isOrphan?: boolean | null }>;
  grid?: number[][];
  gridOrphan?: number[][];
  gridSize?: number;
}

interface CompassCanvas2DProps {
  parties: Party[];
  userPosition?: CompassPosition;
  challengerPosition?: CompassPosition | null;
  xAxis: AxisId;
  yAxis: AxisId;
  highlightedPartyId: string | null;
  onPartyHover: (id: string | null) => void;
}

interface HoveredPole {
  axisId: AxisId;
  side: 'negative' | 'positive';
  x: number; // canvas CSS px
  y: number;
}

export function CompassCanvas2D({
  parties, userPosition, challengerPosition, xAxis, yAxis, highlightedPartyId, onPartyHover,
}: CompassCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nebula, setNebula] = useState<NebulaData | null>(null);
  const [hoveredPole, setHoveredPole] = useState<HoveredPole | null>(null);

  // Fetch nebula data when axes change
  useEffect(() => {
    fetch(`/api/nebula?xAxis=${xAxis}&yAxis=${yAxis}`)
      .then((r) => r.json())
      .then(setNebula)
      .catch(() => setNebula(null));
  }, [xAxis, yAxis]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    // Scale up on larger screens: 500px on mobile, up to 600px on tablet, 700px on desktop
    const maxSize = window.innerWidth >= 1024 ? 700 : window.innerWidth >= 768 ? 600 : 500;
    const size = Math.min(container.clientWidth, maxSize);
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

    // Nebula layer — amber for all/non-orphelins, indigo for orphelins
    if (nebula) {
      if (nebula.mode === 'points' && nebula.points) {
        for (const pt of nebula.points) {
          const nx = toCanvas(pt.x, false);
          const ny = toCanvas(pt.y, true);
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = pt.isOrphan === true ? '#818CF8' : COMPASS_COLORS.nebula;
          ctx.beginPath();
          ctx.arc(nx, ny, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      } else if (nebula.mode === 'kde' && nebula.grid && nebula.gridSize) {
        const gs = nebula.gridSize;
        const cellW = (extent * 2) / gs;
        const cellH = (extent * 2) / gs;
        // Draw all-users layer (amber)
        for (let i = 0; i < gs; i++) {
          for (let j = 0; j < gs; j++) {
            const density = nebula.grid[i][j];
            if (density < 0.02) continue;
            const cx = margin + j * cellW;
            const cy = margin + (gs - 1 - i) * cellH; // flip Y
            ctx.globalAlpha = density * 0.3;
            ctx.fillStyle = COMPASS_COLORS.nebula;
            ctx.fillRect(cx, cy, cellW + 1, cellH + 1);
          }
        }
        // Draw orphelins overlay (indigo) if available
        if (nebula.gridOrphan) {
          for (let i = 0; i < gs; i++) {
            for (let j = 0; j < gs; j++) {
              const density = nebula.gridOrphan[i][j];
              if (density < 0.02) continue;
              const cx = margin + j * cellW;
              const cy = margin + (gs - 1 - i) * cellH;
              ctx.globalAlpha = density * 0.4;
              ctx.fillStyle = '#818CF8';
              ctx.fillRect(cx, cy, cellW + 1, cellH + 1);
            }
          }
        }
        ctx.globalAlpha = 1;
      }
    }

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

    // User dot (drawn last, with glow for visibility)
    if (userPosition) {
      const ux = toX(userPosition);
      const uy = toY(userPosition);
      const r = COMPASS_SIZES.userDotRadius + 2;

      // Glow halo
      const glow = ctx.createRadialGradient(ux, uy, r, ux, uy, r * 3);
      glow.addColorStop(0, 'rgba(245, 183, 49, 0.4)');
      glow.addColorStop(1, 'rgba(245, 183, 49, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ux, uy, r * 3, 0, Math.PI * 2);
      ctx.fill();

      // Dot
      ctx.fillStyle = COMPASS_COLORS.userDot;
      ctx.beginPath();
      ctx.arc(ux, uy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COMPASS_COLORS.userDotBorder;
      ctx.lineWidth = COMPASS_SIZES.userDotBorderWidth;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${COMPASS_SIZES.userLabelFontSize + 1}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('Toi', ux, uy - r - 8);
    }
    // Challenger dot (indigo) — drawn after parties, before user dot
    if (challengerPosition) {
      const cx = toX(challengerPosition);
      const cy = toY(challengerPosition);
      const cr = COMPASS_SIZES.userDotRadius + 1;

      // Indigo glow
      const glow = ctx.createRadialGradient(cx, cy, cr, cx, cy, cr * 3);
      glow.addColorStop(0, 'rgba(129, 140, 248, 0.35)');
      glow.addColorStop(1, 'rgba(129, 140, 248, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, cr * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#818CF8';
      ctx.beginPath();
      ctx.arc(cx, cy, cr, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#C7D2FE';
      ctx.font = `bold ${COMPASS_SIZES.userLabelFontSize}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('Challenger', cx, cy - cr - 8);
    }
  }, [parties, userPosition, challengerPosition, xAxis, yAxis, highlightedPartyId, nebula]);

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

      // Pole label hover detection (reuse margin/center already declared above)
      const hitW = 80; // horizontal hit half-width for centered labels
      const hitH = 20; // vertical hit half-height

      type PoleHit = { axisId: AxisId; side: 'negative' | 'positive'; cx: number; cy: number };
      const poleHits: PoleHit[] = [
        { axisId: xAxis, side: 'negative', cx: margin + 40, cy: center - 14 },
        { axisId: xAxis, side: 'positive', cx: size - margin - 40, cy: center - 14 },
        { axisId: yAxis, side: 'positive', cx: center, cy: margin - 14 },
        { axisId: yAxis, side: 'negative', cx: center, cy: size - margin + 14 },
      ];

      let pole: HoveredPole | null = null;
      for (const h of poleHits) {
        if (Math.abs(mx - h.cx) < hitW && Math.abs(my - h.cy) < hitH) {
          pole = { axisId: h.axisId, side: h.side, x: mx, y: my };
          break;
        }
      }
      setHoveredPole(pole);
    },
    [parties, xAxis, yAxis, onPartyHover],
  );

  const poleTooltip = hoveredPole ? AXES[hoveredPole.axisId].poles[hoveredPole.side] : null;

  return (
    <div ref={containerRef} className="w-full flex justify-center relative">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { onPartyHover(null); setHoveredPole(null); }}
        className="cursor-crosshair"
      />
      {/* Pole tooltip */}
      {poleTooltip && hoveredPole && (
        <div
          role="tooltip"
          className="absolute z-20 pointer-events-none bg-gray-900 border border-gray-700 rounded-xl p-3 shadow-xl text-xs max-w-[220px]"
          style={{
            left: Math.min(hoveredPole.x + 12, (containerRef.current?.clientWidth ?? 500) - 230),
            top: Math.max(hoveredPole.y - 60, 4),
          }}
        >
          <p className="font-semibold text-amber-300 mb-1">{poleTooltip.label}</p>
          <p className="text-gray-300 leading-relaxed">{poleTooltip.definition}</p>
          <p className="text-gray-600 mt-1 italic">{poleTooltip.source}</p>
        </div>
      )}
    </div>
  );
}
