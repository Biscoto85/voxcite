import { useRef, useEffect, useCallback, useState } from 'react';
import type { Party, CompassPosition, AxisId } from '@partiprism/shared';
import { AXES, COMPASS_COLORS, COMPASS_SIZES } from '@partiprism/shared';

interface CompassCanvas3DProps {
  parties: Party[];
  userPosition?: CompassPosition;
  xAxis: AxisId;
  yAxis: AxisId;
  zAxis: AxisId;
  highlightedPartyId: string | null;
  onPartyHover: (id: string | null) => void;
}

// ── 3D math (isometric projection) ─────────────────────────────────

interface Vec3 { x: number; y: number; z: number }
interface Vec2 { x: number; y: number }

function rotateY(p: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x * c + p.z * s, y: p.y, z: -p.x * s + p.z * c };
}

function rotateX(p: Vec3, angle: number): Vec3 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

function project(p: Vec3, size: number, perspective: number): Vec2 {
  const factor = perspective / (perspective + p.z);
  return {
    x: size / 2 + p.x * factor,
    y: size / 2 - p.y * factor,
  };
}

function getDepth(p: Vec3): number {
  return p.z;
}

export function CompassCanvas3D({
  parties, userPosition, xAxis, yAxis, zAxis, highlightedPartyId, onPartyHover,
}: CompassCanvas3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotY, setRotY] = useState(-0.5);
  const [rotX, setRotX] = useState(0.4);
  const dragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const autoRotate = useRef(true);
  const animRef = useRef(0);

  const scale = 160;
  const perspective = 600;

  const posTo3D = useCallback((pos: CompassPosition): Vec3 => ({
    x: pos[xAxis] * scale,
    y: pos[yAxis] * scale,
    z: pos[zAxis] * scale,
  }), [xAxis, yAxis, zAxis]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const maxSize = window.innerWidth >= 1024 ? 700 : window.innerWidth >= 768 ? 600 : 500;
    const size = Math.min(container.clientWidth, maxSize);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const transform = (p: Vec3) => {
      let r = rotateY(p, rotY);
      r = rotateX(r, rotX);
      return r;
    };

    const proj = (p: Vec3) => project(transform(p), size, perspective);

    // Draw cube wireframe
    const corners: Vec3[] = [];
    for (const x of [-1, 1]) {
      for (const y of [-1, 1]) {
        for (const z of [-1, 1]) {
          corners.push({ x: x * scale, y: y * scale, z: z * scale });
        }
      }
    }

    const edges = [
      [0,1],[0,2],[0,4],[1,3],[1,5],[2,3],[2,6],[3,7],[4,5],[4,6],[5,7],[6,7],
    ];

    ctx.strokeStyle = '#1F2937';
    ctx.lineWidth = 0.5;
    for (const [a, b] of edges) {
      const pa = proj(corners[a]);
      const pb = proj(corners[b]);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    }

    // Draw main axes through center
    ctx.strokeStyle = '#4B5563';
    ctx.lineWidth = 1;
    const axisLen = scale * 1.1;
    for (const [axis, dir] of [
      [{x:1,y:0,z:0}, xAxis],
      [{x:0,y:1,z:0}, yAxis],
      [{x:0,y:0,z:1}, zAxis],
    ] as [Vec3, AxisId][]) {
      const neg = proj({ x: -axis.x * axisLen, y: -axis.y * axisLen, z: -axis.z * axisLen });
      const pos = proj({ x: axis.x * axisLen, y: axis.y * axisLen, z: axis.z * axisLen });
      ctx.beginPath();
      ctx.moveTo(neg.x, neg.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      // Labels at axis tips
      const info = AXES[dir];
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(info.positive, pos.x, pos.y - 8);
      ctx.fillText(info.negative, neg.x, neg.y + 16);
    }

    // Sort parties by depth (back to front)
    const partyData = parties.map((p) => {
      const raw = posTo3D(p.position);
      const rotated = rotateX(rotateY(raw, rotY), rotX);
      const screen = project(rotated, size, perspective);
      return { party: p, screen, depth: getDepth(rotated) };
    });
    partyData.sort((a, b) => a.depth - b.depth);

    // Draw parties
    for (const { party: p, screen, depth } of partyData) {
      const highlighted = p.id === highlightedPartyId;
      const depthFade = Math.max(0.3, Math.min(1, 1 - depth / (scale * 3)));
      const baseRadius = COMPASS_SIZES.partyDotRadius * (perspective / (perspective + depth)) * 0.8;
      const radius = highlighted ? baseRadius + 3 : baseRadius;
      const alpha = highlighted ? 1 : highlightedPartyId ? 0.2 : depthFade * 0.85;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, Math.max(3, radius), 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      if (!highlightedPartyId || highlighted) {
        ctx.fillStyle = highlighted ? '#FFFFFF' : '#D1D5DB';
        ctx.font = `${highlighted ? 'bold ' : ''}${COMPASS_SIZES.partyLabelFontSize}px system-ui`;
        ctx.textAlign = 'center';
        ctx.fillText(p.abbreviation, screen.x, screen.y - Math.max(3, radius) - 5);
      }
      ctx.globalAlpha = 1;
    }

    // User dot (with glow)
    if (userPosition) {
      const raw = posTo3D(userPosition);
      const rotated = rotateX(rotateY(raw, rotY), rotX);
      const screen = project(rotated, size, perspective);
      const r = COMPASS_SIZES.userDotRadius + 2;

      // Glow halo
      const glow = ctx.createRadialGradient(screen.x, screen.y, r, screen.x, screen.y, r * 3);
      glow.addColorStop(0, 'rgba(245, 183, 49, 0.4)');
      glow.addColorStop(1, 'rgba(245, 183, 49, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, r * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COMPASS_COLORS.userDot;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COMPASS_COLORS.userDotBorder;
      ctx.lineWidth = COMPASS_SIZES.userDotBorderWidth;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${COMPASS_SIZES.userLabelFontSize + 1}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('Toi', screen.x, screen.y - r - 8);
    }
  }, [parties, userPosition, xAxis, yAxis, zAxis, highlightedPartyId, rotX, rotY, posTo3D]);

  // Auto-rotation loop
  useEffect(() => {
    let last = performance.now();
    const loop = (now: number) => {
      if (autoRotate.current && !dragging.current) {
        const dt = (now - last) / 1000;
        setRotY((r) => r + dt * 0.15);
      }
      last = now;
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  // Drag handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    autoRotate.current = false;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) {
      // Hit test for hover
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const size = rect.width;

      let closest: string | null = null;
      let minDist = 25;
      for (const p of parties) {
        const raw = posTo3D(p.position);
        const rotated = rotateX(rotateY(raw, rotY), rotX);
        const screen = project(rotated, size, perspective);
        const dist = Math.sqrt((mx - screen.x) ** 2 + (my - screen.y) ** 2);
        if (dist < minDist) { minDist = dist; closest = p.id; }
      }
      onPartyHover(closest);
      return;
    }

    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setRotY((r) => r + dx * 0.008);
    setRotX((r) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, r + dy * 0.008)));
  }, [parties, posTo3D, rotX, rotY, onPartyHover]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div ref={containerRef} className="w-full flex justify-center">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={() => { handlePointerUp(); onPartyHover(null); }}
        className="cursor-grab active:cursor-grabbing touch-none"
      />
    </div>
  );
}
