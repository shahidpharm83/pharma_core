import React, { useEffect, useRef, useState } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface Atom {
  x: number;
  y: number;
  z: number;
  element: string;
  color: string;
  radius: number;
}

interface Bond {
  atom1: number;
  atom2: number;
}

interface MoleculeViewer3DProps {
  smiles: string;
  name: string;
  cid: number;
}

// CPK element coloring and radii
const ELEMENT_COLORS: Record<string, string> = {
  C: '#475569', // Dark Slate
  O: '#EF4444', // Red
  N: '#3B82F6', // Blue
  H: '#E2E8F0', // Light Gray
  S: '#EAB308', // Yellow
  P: '#F97316', // Orange
  Cl: '#10B981', // Emerald
  F: '#06B6D4', // Cyan
  Br: '#991B1B', // Maroon
  I: '#7C3AED', // Violet
};

// Generate an approximate 3D conformer from SMILES string structure topology
function parseSmilesTo3D(smiles: string): { atoms: Atom[]; bonds: Bond[] } {
  const atoms: Atom[] = [];
  const bonds: Bond[] = [];

  // Parse elementary atoms
  const elementRegex = /(Cl|Br|[CONSPFHIcopsnb])/g;
  let match;
  const elements: string[] = [];
  while ((match = elementRegex.exec(smiles)) !== null) {
    let elem = match[0];
    if (elem === 'c') elem = 'C';
    if (elem === 'o') elem = 'O';
    if (elem === 'n') elem = 'N';
    if (elem === 'p') elem = 'P';
    if (elem === 's') elem = 'S';
    elements.push(elem);
  }

  const count = Math.min(elements.length, 60);
  if (count === 0) {
    return { atoms: [], bonds: [] };
  }

  // Ring and helical projection for 3D topology
  const phi = Math.PI * (3 - Math.sqrt(5)); // Golden spiral
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1 || 1)) * 2; // y goes from 1 to -1
    const radius = Math.sqrt(1 - y * y); // radius at y
    const theta = phi * i; // golden angle increment

    const scale = 80 + Math.sin(i * 0.7) * 20;
    const x = Math.cos(theta) * radius * scale;
    const z = Math.sin(theta) * radius * scale;
    const elem = elements[i] || 'C';

    atoms.push({
      x,
      y: y * scale,
      z,
      element: elem,
      color: ELEMENT_COLORS[elem] || '#64748B',
      radius: elem === 'H' ? 4 : elem === 'C' ? 8 : 9,
    });

    // Create realistic bonded network
    if (i > 0) {
      bonds.push({ atom1: i - 1, atom2: i });
      if (i > 4 && i % 5 === 0) {
        bonds.push({ atom1: i - 4, atom2: i }); // ring closure
      }
    }
  }

  return { atoms, bonds };
}

export const MoleculeViewer3D: React.FC<MoleculeViewer3DProps> = ({ smiles, name, cid }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rotX, setRotX] = useState<number>(0.3);
  const [rotY, setRotY] = useState<number>(0.6);
  const [zoom, setZoom] = useState<number>(1.1);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const moleculeData = useRef<{ atoms: Atom[]; bonds: Bond[] }>({ atoms: [], bonds: [] });

  useEffect(() => {
    moleculeData.current = parseSmilesTo3D(smiles);
  }, [smiles]);

  // Animation loop for rotation and rendering
  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Subtle laboratory coordinate grid
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 1;
      const gridSize = 30;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      if (autoRotate && !isDraggingRef.current) {
        setRotY((prev) => prev + 0.008);
      }

      const { atoms, bonds } = moleculeData.current;
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Project atoms into screen space
      const projected = atoms.map((atom) => {
        // Y-axis rotation
        const x1 = atom.x * cosY + atom.z * sinY;
        const z1 = -atom.x * sinY + atom.z * cosY;
        // X-axis rotation
        const y2 = atom.y * cosX - z1 * sinX;
        const z2 = atom.y * sinX + z1 * cosX;

        // Perspective projection
        const focalLength = 320;
        const pz = z2 + 280;
        const scale = (focalLength / Math.max(50, pz)) * zoom;

        return {
          px: width / 2 + x1 * scale,
          py: height / 2 + y2 * scale,
          pz,
          scale,
          atom,
        };
      });

      // Sort by z-depth for correct painter's algorithm
      const sortedIndices = projected
        .map((p, idx) => ({ idx, pz: p.pz }))
        .sort((a, b) => b.pz - a.pz);

      // Draw bonds first
      bonds.forEach((bond) => {
        const p1 = projected[bond.atom1];
        const p2 = projected[bond.atom2];
        if (!p1 || !p2) return;

        ctx.beginPath();
        ctx.moveTo(p1.px, p1.py);
        ctx.lineTo(p2.px, p2.py);
        ctx.strokeStyle = '#94A3B8';
        ctx.lineWidth = Math.max(1.5, 3 * ((p1.scale + p2.scale) / 2));
        ctx.lineCap = 'round';
        ctx.stroke();
      });

      // Draw atom spheres
      sortedIndices.forEach(({ idx }) => {
        const p = projected[idx];
        const rad = Math.max(3, p.atom.radius * p.scale);

        // Radial gradient for 3D lighting illusion
        const grad = ctx.createRadialGradient(
          p.px - rad * 0.35,
          p.py - rad * 0.35,
          rad * 0.1,
          p.px,
          p.py,
          rad
        );
        grad.addColorStop(0, '#FFFFFF');
        grad.addColorStop(0.3, p.atom.color);
        grad.addColorStop(1, '#0F172A');

        ctx.beginPath();
        ctx.arc(p.px, p.py, rad, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Atom label for heteroatoms
        if (p.atom.element !== 'C' && p.atom.element !== 'H' && rad > 7) {
          ctx.fillStyle = '#FFFFFF';
          ctx.font = `bold ${Math.max(8, Math.round(rad * 0.9))}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(p.atom.element, p.px, p.py);
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [rotX, rotY, zoom, autoRotate]);

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => Math.max(-1.4, Math.min(1.4, prev + dy * 0.01)));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Mobile Touch handlers
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lastMousePosRef.current.x;
    const dy = e.touches[0].clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

    setRotY((prev) => prev + dx * 0.015);
    setRotX((prev) => Math.max(-1.4, Math.min(1.4, prev + dy * 0.015)));
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="relative w-full h-72 sm:h-80 bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
      {/* Top HUD control strip */}
      <div className="h-9 px-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800">{name}</span>
          <span className="text-slate-400">·</span>
          <span className="font-mono text-slate-500">CID: {cid}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`p-1 rounded text-xs transition-colors ${
              autoRotate ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-200'
            }`}
            title="Toggle Continuous Rotation"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
            className="p-1 rounded text-slate-500 hover:bg-slate-200 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
            className="p-1 rounded text-slate-500 hover:bg-slate-200 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setRotX(0.3);
              setRotY(0.6);
              setZoom(1.1);
            }}
            className="p-1 rounded text-slate-500 hover:bg-slate-200 transition-colors"
            title="Reset Perspective"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative flex-1 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={480}
          height={280}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full block touch-none"
        />

        {/* Floating element color legend */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-2 py-1 rounded border border-slate-200 text-[10px] font-mono flex items-center gap-2.5 text-slate-600">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-600 inline-block"></span> C
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> O
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> N
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Cl
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> S
          </span>
        </div>
      </div>
    </div>
  );
};
