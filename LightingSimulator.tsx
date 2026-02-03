import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Moon, Lightbulb, Square, Circle, Triangle, Download, Plus, Trash2,
  RotateCcw, Eye, EyeOff, Copy, Settings, ChevronLeft, Layers, Move, ZoomIn, ZoomOut
} from 'lucide-react';

// --- Types ---
interface Light {
  id: string;
  type: 'key' | 'fill' | 'rim' | 'background' | 'hair' | 'accent';
  x: number; // percentage 0-100
  y: number;
  intensity: number; // 0-100
  color: string;
  angle: number; // degrees
  spread: number; // beam angle
  softness: number; // 0-100
  enabled: boolean;
  modifier: 'none' | 'softbox' | 'umbrella' | 'beauty-dish' | 'grid' | 'snoot' | 'reflector';
  name: string;
}

interface ScenePreset {
  name: string;
  lights: Omit<Light, 'id'>[];
}

const LIGHT_TYPES: { value: Light['type']; label: string; color: string }[] = [
  { value: 'key', label: '主燈 Key', color: '#FFD700' },
  { value: 'fill', label: '補光 Fill', color: '#87CEEB' },
  { value: 'rim', label: '輪廓光 Rim', color: '#FF6B6B' },
  { value: 'background', label: '背景燈', color: '#9B59B6' },
  { value: 'hair', label: '髮燈 Hair', color: '#F39C12' },
  { value: 'accent', label: '重點光', color: '#1ABC9C' },
];

const MODIFIERS: { value: Light['modifier']; label: string }[] = [
  { value: 'none', label: '無' },
  { value: 'softbox', label: '柔光箱' },
  { value: 'umbrella', label: '反射傘' },
  { value: 'beauty-dish', label: '雷達罩' },
  { value: 'grid', label: '蜂巢' },
  { value: 'snoot', label: '束光筒' },
  { value: 'reflector', label: '反光板' },
];

const PRESETS: ScenePreset[] = [
  {
    name: '經典倫勃朗',
    lights: [
      { type: 'key', x: 25, y: 30, intensity: 85, color: '#FFF5E6', angle: 45, spread: 60, softness: 40, enabled: true, modifier: 'softbox', name: '主燈' },
      { type: 'fill', x: 75, y: 40, intensity: 30, color: '#E8F4FF', angle: -30, spread: 90, softness: 80, enabled: true, modifier: 'umbrella', name: '補光' },
    ]
  },
  {
    name: '高調人像',
    lights: [
      { type: 'key', x: 50, y: 20, intensity: 90, color: '#FFFFFF', angle: 0, spread: 120, softness: 90, enabled: true, modifier: 'beauty-dish', name: '主燈' },
      { type: 'fill', x: 20, y: 50, intensity: 60, color: '#FFFFFF', angle: 45, spread: 90, softness: 85, enabled: true, modifier: 'softbox', name: '左補' },
      { type: 'fill', x: 80, y: 50, intensity: 60, color: '#FFFFFF', angle: -45, spread: 90, softness: 85, enabled: true, modifier: 'softbox', name: '右補' },
      { type: 'background', x: 50, y: 85, intensity: 100, color: '#FFFFFF', angle: 0, spread: 180, softness: 100, enabled: true, modifier: 'none', name: '背景' },
    ]
  },
  {
    name: '戲劇低調',
    lights: [
      { type: 'key', x: 15, y: 25, intensity: 100, color: '#FFE4B5', angle: 60, spread: 30, softness: 20, enabled: true, modifier: 'grid', name: '主燈' },
      { type: 'rim', x: 85, y: 20, intensity: 70, color: '#ADD8E6', angle: -120, spread: 25, softness: 10, enabled: true, modifier: 'snoot', name: '輪廓' },
    ]
  },
  {
    name: '時尚雜誌',
    lights: [
      { type: 'key', x: 50, y: 15, intensity: 95, color: '#FFFFFF', angle: 0, spread: 80, softness: 60, enabled: true, modifier: 'beauty-dish', name: '主燈' },
      { type: 'fill', x: 10, y: 60, intensity: 40, color: '#F0F0FF', angle: 45, spread: 120, softness: 90, enabled: true, modifier: 'reflector', name: '左反' },
      { type: 'fill', x: 90, y: 60, intensity: 40, color: '#F0F0FF', angle: -45, spread: 120, softness: 90, enabled: true, modifier: 'reflector', name: '右反' },
      { type: 'hair', x: 50, y: 5, intensity: 60, color: '#FFF8DC', angle: 180, spread: 40, softness: 30, enabled: true, modifier: 'grid', name: '髮燈' },
      { type: 'background', x: 50, y: 90, intensity: 50, color: '#E0E0E0', angle: 0, spread: 180, softness: 100, enabled: true, modifier: 'none', name: '背景' },
    ]
  },
];

// --- Utility ---
const generateId = () => Math.random().toString(36).substring(2, 9);

const createLight = (type: Light['type'], x = 50, y = 50): Light => {
  const typeInfo = LIGHT_TYPES.find(t => t.value === type) || LIGHT_TYPES[0];
  return {
    id: generateId(),
    type,
    x,
    y,
    intensity: type === 'key' ? 80 : type === 'fill' ? 40 : 60,
    color: typeInfo.color,
    angle: 0,
    spread: 60,
    softness: 50,
    enabled: true,
    modifier: type === 'key' ? 'softbox' : 'none',
    name: typeInfo.label,
  };
};

// --- Light Icon Component ---
interface LightIconProps {
  light: Light;
  isSelected: boolean;
  onSelect: () => void;
  onDrag: (x: number, y: number) => void;
}

const LightIcon: React.FC<LightIconProps> = ({ light, isSelected, onSelect, onDrag }) => {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onSelect();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    onDrag(x, y);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  const typeInfo = LIGHT_TYPES.find(t => t.value === light.type);
  const IconComponent = light.type === 'key' ? Sun : light.type === 'rim' ? Moon : Lightbulb;

  return (
    <div
      ref={containerRef}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move z-20
        ${isSelected ? 'z-30' : ''} ${!light.enabled ? 'opacity-40' : ''}`}
      style={{ left: `${light.x}%`, top: `${light.y}%` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Beam visualization */}
      {light.enabled && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: `${light.spread * 3}px`,
            height: `${light.spread * 4}px`,
            transform: `translate(-50%, 0) rotate(${light.angle}deg)`,
            background: `linear-gradient(to bottom, ${light.color}${Math.round(light.intensity * 0.6).toString(16).padStart(2, '0')}, transparent)`,
            filter: `blur(${light.softness / 5}px)`,
            borderRadius: '0 0 50% 50%',
            transformOrigin: 'top center',
          }}
        />
      )}
      {/* Light icon */}
      <motion.div
        animate={{ scale: isSelected ? 1.2 : 1 }}
        className={`relative w-12 h-12 rounded-full flex items-center justify-center
          ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}
          transition-shadow`}
        style={{ backgroundColor: typeInfo?.color || '#888' }}
      >
        <IconComponent size={20} className="text-black/70" />
        <span className="absolute -bottom-5 text-[10px] font-mono text-white whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
          {light.name}
        </span>
      </motion.div>
    </div>
  );
};

// --- Slider Component ---
const Slider = ({ label, value, onChange, min = 0, max = 100, unit = '' }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-white">{value}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
    />
  </div>
);

// --- Main Component ---
export default function LightingSimulator() {
  const [lights, setLights] = useState<Light[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a1a');
  const [subjectImage, setSubjectImage] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('燈光配置方案');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [showExportPanel, setShowExportPanel] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);

  const selectedLight = lights.find(l => l.id === selectedId) || null;

  // Update selected light
  const updateLight = useCallback((id: string, updates: Partial<Light>) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // Add light
  const addLight = (type: Light['type']) => {
    const light = createLight(type, 30 + Math.random() * 40, 30 + Math.random() * 40);
    setLights(prev => [...prev, light]);
    setSelectedId(light.id);
  };

  // Remove light
  const removeLight = (id: string) => {
    setLights(prev => prev.filter(l => l.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Load preset
  const loadPreset = (preset: ScenePreset) => {
    const newLights = preset.lights.map(l => ({ ...l, id: generateId() }));
    setLights(newLights);
    setSelectedId(newLights[0]?.id || null);
  };

  // Reset
  const reset = () => {
    setLights([]);
    setSelectedId(null);
    setSubjectImage(null);
  };

  // Duplicate light
  const duplicateLight = (light: Light) => {
    const dup: Light = { ...light, id: generateId(), x: light.x + 5, y: light.y + 5, name: light.name + ' 複製' };
    setLights(prev => [...prev, dup]);
    setSelectedId(dup.id);
  };

  // Handle subject image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSubjectImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Export as image
  const exportAsImage = async () => {
    if (!exportRef.current) return;
    
    // Use html2canvas if available, otherwise create a simple summary
    try {
      // @ts-ignore - dynamic ESM import
      const html2canvas = (await import('https://esm.sh/html2canvas@1.4.1')).default;
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#000',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${projectName}_燈位圖_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      // Fallback: export as JSON
      const data = {
        projectName,
        clientName,
        notes,
        lights: lights.map(l => ({
          name: l.name,
          type: LIGHT_TYPES.find(t => t.value === l.type)?.label,
          position: `X:${l.x.toFixed(0)}% Y:${l.y.toFixed(0)}%`,
          intensity: `${l.intensity}%`,
          modifier: MODIFIERS.find(m => m.value === l.modifier)?.label,
          color: l.color,
          angle: `${l.angle}°`,
          spread: `${l.spread}°`,
        })),
        exportDate: new Date().toLocaleString('zh-TW'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.download = `${projectName}_燈位配置.json`;
      link.href = URL.createObjectURL(blob);
      link.click();
    }
  };

  // Compute combined lighting effect
  const computeLightingEffect = () => {
    const activeLights = lights.filter(l => l.enabled);
    if (activeLights.length === 0) return {};

    const gradients = activeLights.map(l => {
      const size = l.spread * 2;
      return `radial-gradient(ellipse ${size}% ${size * 1.5}% at ${l.x}% ${l.y}%, ${l.color}${Math.round(l.intensity * 0.7).toString(16).padStart(2, '0')}, transparent)`;
    });

    return {
      background: `${backgroundColor}, ${gradients.join(', ')}`,
    };
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Left Panel - Tools */}
      <div className="w-72 bg-[#111] border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <a href="#/" className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-4 transition-colors">
            <ChevronLeft size={16} /> 返回首頁
          </a>
          <h1 className="font-bold text-lg">燈位模擬器</h1>
          <p className="text-xs text-slate-500 mt-1">拖曳燈光・即時預覽・匯出報價</p>
        </div>

        {/* Presets */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">快速配置</h3>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-left transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Add Lights */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">新增燈光</h3>
          <div className="flex flex-wrap gap-2">
            {LIGHT_TYPES.map(({ value, label, color }) => (
              <button
                key={value}
                onClick={() => addLight(value)}
                className="flex items-center gap-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1.5 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                {label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Light List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">燈光列表</h3>
            <span className="text-[10px] font-mono text-slate-500">{lights.length} 盞</span>
          </div>
          {lights.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">點擊上方新增燈光<br/>或選擇快速配置</p>
          ) : (
            <div className="space-y-1">
              {lights.map((light) => {
                const typeInfo = LIGHT_TYPES.find(t => t.value === light.type);
                return (
                  <div
                    key={light.id}
                    onClick={() => setSelectedId(light.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors
                      ${selectedId === light.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: typeInfo?.color }} />
                    <span className={`text-sm flex-1 truncate ${!light.enabled ? 'line-through opacity-50' : ''}`}>
                      {light.name}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateLight(light.id, { enabled: !light.enabled }); }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      {light.enabled ? <Eye size={14} /> : <EyeOff size={14} className="opacity-50" />}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeLight(light.id); }}
                      className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-4 py-2 transition-colors"
          >
            <RotateCcw size={14} /> 重置場景
          </button>
          <button
            onClick={() => setShowExportPanel(true)}
            className="w-full flex items-center justify-center gap-2 text-xs bg-white hover:bg-white/90 text-black font-bold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Download size={14} /> 匯出報價圖
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-[#111] border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors
                ${showGrid ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Layers size={14} /> 網格
            </button>
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-white transition-colors">
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Plus size={14} /> 上傳主體
            </label>
            {subjectImage && (
              <button
                onClick={() => setSubjectImage(null)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                移除主體
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 hover:bg-white/10 rounded">
              <ZoomOut size={16} />
            </button>
            <span className="text-xs font-mono w-12 text-center">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="p-1.5 hover:bg-white/10 rounded">
              <ZoomIn size={16} />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-[#080808]">
          <div
            ref={canvasRef}
            className="relative bg-neutral-900 rounded-2xl overflow-hidden shadow-2xl"
            style={{
              width: `${zoom * 8}px`,
              height: `${zoom * 6}px`,
              ...computeLightingEffect(),
            }}
            onClick={() => setSelectedId(null)}
          >
            {/* Grid */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, white 1px, transparent 1px),
                    linear-gradient(to bottom, white 1px, transparent 1px)
                  `,
                  backgroundSize: '10% 10%',
                }}
              />
            )}

            {/* Subject placeholder or image */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {subjectImage ? (
                <img src={subjectImage} alt="Subject" className="max-w-[60%] max-h-[80%] object-contain opacity-80" />
              ) : (
                <div className="flex flex-col items-center text-slate-600">
                  <div className="w-24 h-32 border-2 border-dashed border-current rounded-t-full mb-2" />
                  <span className="text-xs">主體位置</span>
                </div>
              )}
            </div>

            {/* Lights */}
            {lights.map((light) => (
              <LightIcon
                key={light.id}
                light={light}
                isSelected={selectedId === light.id}
                onSelect={() => setSelectedId(light.id)}
                onDrag={(x, y) => updateLight(light.id, { x, y })}
              />
            ))}

            {/* Position indicator for selected */}
            {selectedLight && (
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono">
                X: {selectedLight.x.toFixed(0)}% Y: {selectedLight.y.toFixed(0)}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <AnimatePresence>
        {selectedLight && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-80 bg-[#111] border-l border-white/10 flex flex-col"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="font-bold">燈光屬性</h3>
                <button
                  onClick={() => duplicateLight(selectedLight)}
                  className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                  title="複製"
                >
                  <Copy size={16} />
                </button>
              </div>
              <input
                type="text"
                value={selectedLight.name}
                onChange={(e) => updateLight(selectedLight.id, { name: e.target.value })}
                className="w-full bg-transparent border-b border-white/20 text-sm py-1 mt-2 focus:outline-none focus:border-white/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Type */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">燈光類型</label>
                <div className="grid grid-cols-3 gap-1">
                  {LIGHT_TYPES.map(({ value, label, color }) => (
                    <button
                      key={value}
                      onClick={() => updateLight(selectedLight.id, { type: value, color })}
                      className={`text-[10px] py-1.5 px-2 rounded transition-colors
                        ${selectedLight.type === value ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      {label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">燈光色溫</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={selectedLight.color}
                    onChange={(e) => updateLight(selectedLight.id, { color: e.target.value })}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent"
                  />
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {['#FFE4C4', '#FFF8DC', '#FFFFFF', '#E0FFFF', '#B0E0E6'].map(c => (
                      <button
                        key={c}
                        onClick={() => updateLight(selectedLight.id, { color: c })}
                        className={`w-full aspect-square rounded-full border-2 transition-colors
                          ${selectedLight.color === c ? 'border-white' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Modifier */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">光型調節器</label>
                <select
                  value={selectedLight.modifier}
                  onChange={(e) => updateLight(selectedLight.id, { modifier: e.target.value as Light['modifier'] })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                >
                  {MODIFIERS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Sliders */}
              <Slider
                label="強度 Intensity"
                value={selectedLight.intensity}
                onChange={(v) => updateLight(selectedLight.id, { intensity: v })}
                unit="%"
              />
              <Slider
                label="角度 Angle"
                value={selectedLight.angle}
                onChange={(v) => updateLight(selectedLight.id, { angle: v })}
                min={-180}
                max={180}
                unit="°"
              />
              <Slider
                label="擴散 Spread"
                value={selectedLight.spread}
                onChange={(v) => updateLight(selectedLight.id, { spread: v })}
                min={10}
                max={180}
                unit="°"
              />
              <Slider
                label="柔度 Softness"
                value={selectedLight.softness}
                onChange={(v) => updateLight(selectedLight.id, { softness: v })}
                unit="%"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Export Panel Modal */}
      <AnimatePresence>
        {showExportPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
            onClick={() => setShowExportPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111] rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex"
            >
              {/* Preview */}
              <div ref={exportRef} className="flex-1 bg-black p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold">{projectName || '燈光配置方案'}</h2>
                  {clientName && <p className="text-slate-400 mt-1">客戶：{clientName}</p>}
                  <p className="text-xs text-slate-500 mt-2">HENG STUDIO · {new Date().toLocaleDateString('zh-TW')}</p>
                </div>

                {/* Mini preview */}
                <div
                  className="relative aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden mb-6"
                  style={computeLightingEffect()}
                >
                  {showGrid && (
                    <div
                      className="absolute inset-0 pointer-events-none opacity-10"
                      style={{
                        backgroundImage: `linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)`,
                        backgroundSize: '10% 10%',
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {subjectImage ? (
                      <img src={subjectImage} alt="Subject" className="max-w-[50%] max-h-[70%] object-contain opacity-70" />
                    ) : (
                      <div className="w-16 h-24 border border-dashed border-slate-600 rounded-t-full" />
                    )}
                  </div>
                  {lights.filter(l => l.enabled).map(light => {
                    const typeInfo = LIGHT_TYPES.find(t => t.value === light.type);
                    return (
                      <div
                        key={light.id}
                        className="absolute w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-black transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${light.x}%`, top: `${light.y}%`, backgroundColor: typeInfo?.color }}
                      >
                        {light.name.charAt(0)}
                      </div>
                    );
                  })}
                </div>

                {/* Equipment list */}
                <div>
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-slate-400">器材清單</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {lights.map(light => {
                      const typeInfo = LIGHT_TYPES.find(t => t.value === light.type);
                      const modInfo = MODIFIERS.find(m => m.value === light.modifier);
                      return (
                        <div key={light.id} className="flex items-start gap-3 bg-white/5 rounded-lg p-3">
                          <span className="w-4 h-4 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: typeInfo?.color }} />
                          <div className="text-xs">
                            <p className="font-bold">{light.name}</p>
                            <p className="text-slate-500">
                              {modInfo?.label !== '無' ? modInfo?.label + ' · ' : ''}
                              {light.intensity}% · {light.spread}°
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="mt-6 bg-white/5 rounded-lg p-4">
                    <h3 className="font-bold text-sm mb-2 text-slate-400">備註</h3>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{notes}</p>
                  </div>
                )}
              </div>

              {/* Settings */}
              <div className="w-80 bg-[#0a0a0a] border-l border-white/10 p-6 flex flex-col">
                <h3 className="font-bold mb-6">匯出設定</h3>
                
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">專案名稱</label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">客戶名稱</label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="選填"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">備註說明</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="拍攝注意事項、器材需求..."
                      rows={4}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <button
                    onClick={exportAsImage}
                    className="w-full flex items-center justify-center gap-2 bg-white text-black font-bold rounded-lg px-4 py-3 hover:bg-white/90 transition-colors"
                  >
                    <Download size={16} /> 下載燈位圖
                  </button>
                  <button
                    onClick={() => setShowExportPanel(false)}
                    className="w-full text-sm text-slate-400 hover:text-white py-2 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
