import React, { useState, useRef, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Html, TransformControls, useGLTF, Sphere, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Lightbulb, Download, Plus, Trash2, RotateCcw, Eye, EyeOff, 
  ChevronLeft, Layers, RotateCw, Box as BoxIcon, User, Circle
} from 'lucide-react';

// --- Types ---
interface Light3D {
  id: string;
  type: 'key' | 'fill' | 'rim' | 'background' | 'hair' | 'accent';
  position: [number, number, number];
  intensity: number;
  color: string;
  distance: number;
  angle: number; // spotlight angle
  penumbra: number;
  castShadow: boolean;
  enabled: boolean;
  modifier: 'spot' | 'point' | 'directional';
  name: string;
}

interface ScenePreset {
  name: string;
  lights: Omit<Light3D, 'id'>[];
}

const LIGHT_TYPES: { value: Light3D['type']; label: string; color: string }[] = [
  { value: 'key', label: '主燈', color: '#FFD700' },
  { value: 'fill', label: '補光', color: '#87CEEB' },
  { value: 'rim', label: '輪廓', color: '#FF6B6B' },
  { value: 'background', label: '背景', color: '#9B59B6' },
  { value: 'hair', label: '髮燈', color: '#F39C12' },
  { value: 'accent', label: '重點', color: '#1ABC9C' },
];

const PRESETS: ScenePreset[] = [
  {
    name: '經典倫勃朗',
    lights: [
      { type: 'key', position: [-3, 4, 2], intensity: 2.5, color: '#FFF5E6', distance: 15, angle: 0.5, penumbra: 0.5, castShadow: true, enabled: true, modifier: 'spot', name: '主燈' },
      { type: 'fill', position: [3, 2, 3], intensity: 0.8, color: '#E8F4FF', distance: 12, angle: 0.8, penumbra: 0.8, castShadow: false, enabled: true, modifier: 'spot', name: '補光' },
    ]
  },
  {
    name: '高調人像',
    lights: [
      { type: 'key', position: [0, 5, 3], intensity: 3, color: '#FFFFFF', distance: 20, angle: 0.6, penumbra: 0.7, castShadow: true, enabled: true, modifier: 'spot', name: '主燈' },
      { type: 'fill', position: [-4, 3, 2], intensity: 1.5, color: '#FFFFFF', distance: 15, angle: 0.7, penumbra: 0.8, castShadow: false, enabled: true, modifier: 'spot', name: '左補' },
      { type: 'fill', position: [4, 3, 2], intensity: 1.5, color: '#FFFFFF', distance: 15, angle: 0.7, penumbra: 0.8, castShadow: false, enabled: true, modifier: 'spot', name: '右補' },
    ]
  },
  {
    name: '戲劇低調',
    lights: [
      { type: 'key', position: [-4, 5, 1], intensity: 4, color: '#FFE4B5', distance: 20, angle: 0.3, penumbra: 0.2, castShadow: true, enabled: true, modifier: 'spot', name: '主燈' },
      { type: 'rim', position: [3, 4, -2], intensity: 2, color: '#ADD8E6', distance: 15, angle: 0.4, penumbra: 0.3, castShadow: true, enabled: true, modifier: 'spot', name: '輪廓' },
    ]
  },
  {
    name: '三點佈光',
    lights: [
      { type: 'key', position: [-3, 4, 3], intensity: 2.5, color: '#FFF8DC', distance: 15, angle: 0.5, penumbra: 0.5, castShadow: true, enabled: true, modifier: 'spot', name: '主燈' },
      { type: 'fill', position: [3, 3, 2], intensity: 1, color: '#F0F8FF', distance: 12, angle: 0.6, penumbra: 0.7, castShadow: false, enabled: true, modifier: 'spot', name: '補光' },
      { type: 'rim', position: [0, 4, -3], intensity: 1.8, color: '#FFFAF0', distance: 15, angle: 0.4, penumbra: 0.4, castShadow: true, enabled: true, modifier: 'spot', name: '背光' },
    ]
  },
];

const SUBJECT_TYPES = [
  { id: 'bust', label: '石膏像', icon: User },
  { id: 'sphere', label: '球體', icon: Circle },
  { id: 'cube', label: '方塊', icon: BoxIcon },
];

// --- Utility ---
const generateId = () => Math.random().toString(36).substring(2, 9);

const createLight = (type: Light3D['type'], position?: [number, number, number]): Light3D => {
  const typeInfo = LIGHT_TYPES.find(t => t.value === type) || LIGHT_TYPES[0];
  const defaultPositions: Record<Light3D['type'], [number, number, number]> = {
    key: [-3, 4, 3],
    fill: [3, 2, 2],
    rim: [0, 3, -3],
    background: [0, 2, -5],
    hair: [0, 5, -1],
    accent: [2, 1, 2],
  };
  return {
    id: generateId(),
    type,
    position: position || defaultPositions[type],
    intensity: type === 'key' ? 2.5 : type === 'fill' ? 1 : 1.5,
    color: typeInfo.color,
    distance: 15,
    angle: 0.5,
    penumbra: 0.5,
    castShadow: type === 'key' || type === 'rim',
    enabled: true,
    modifier: 'spot',
    name: typeInfo.label,
  };
};

// --- 3D Light Component ---
const SceneLight = ({ light, isSelected, onClick }: { light: Light3D; isSelected: boolean; onClick: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.SpotLight>(null);
  
  // Create spotlight helper line
  const targetPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  
  if (!light.enabled) return null;

  const typeInfo = LIGHT_TYPES.find(t => t.value === light.type);
  const helperColor = typeInfo?.color || '#ffffff';

  return (
    <group position={light.position}>
      {/* Light source */}
      {light.modifier === 'spot' && (
        <spotLight
          ref={lightRef}
          color={light.color}
          intensity={light.intensity}
          distance={light.distance}
          angle={light.angle}
          penumbra={light.penumbra}
          castShadow={light.castShadow}
          target-position={[0, 0, 0]}
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />
      )}
      {light.modifier === 'point' && (
        <pointLight
          color={light.color}
          intensity={light.intensity}
          distance={light.distance}
          castShadow={light.castShadow}
          shadow-mapSize={[1024, 1024]}
        />
      )}
      
      {/* Visual representation */}
      <mesh ref={meshRef} onClick={(e) => { e.stopPropagation(); onClick(); }}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color={helperColor} 
          emissive={helperColor}
          emissiveIntensity={isSelected ? 2 : 0.8}
        />
      </mesh>
      
      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
        </mesh>
      )}
      
      {/* Light direction line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, 0, ...targetPos.clone().sub(new THREE.Vector3(...light.position)).normalize().multiplyScalar(1.5).toArray()])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={helperColor} opacity={0.5} transparent />
      </line>
      
      {/* Label */}
      <Html position={[0, 0.4, 0]} center distanceFactor={8}>
        <div className={`px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap transition-all ${isSelected ? 'bg-white text-black' : 'bg-black/70 text-white'}`}>
          {light.name}
        </div>
      </Html>
    </group>
  );
};

// --- Draggable Light (with TransformControls) ---
interface DraggableLightProps {
  light: Light3D;
  isSelected: boolean;
  onClick: () => void;
  onPositionChange: (pos: [number, number, number]) => void;
}

const DraggableLight: React.FC<DraggableLightProps> = ({ light, isSelected, onClick, onPositionChange }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  if (!light.enabled) return null;

  return (
    <>
      <group ref={groupRef} position={light.position}>
        <SceneLight light={{...light, position: [0,0,0]}} isSelected={isSelected} onClick={onClick} />
      </group>
      {isSelected && groupRef.current && (
        <TransformControls 
          object={groupRef.current} 
          mode="translate"
          onObjectChange={() => {
            if (groupRef.current) {
              const pos = groupRef.current.position;
              onPositionChange([pos.x, pos.y, pos.z]);
            }
          }}
        />
      )}
    </>
  );
};

// --- Bust/Statue Model ---
const BustModel = () => {
  // Create a stylized bust geometry
  return (
    <group>
      {/* Head */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Neck */}
      <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 16]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Shoulders/Chest */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.45, 1, 16]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Base */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.6, 0.3, 16]} />
        <meshStandardMaterial color="#d4d0cb" roughness={0.8} metalness={0.05} />
      </mesh>
      
      {/* Nose hint */}
      <mesh position={[0, 1.55, 0.4]} castShadow>
        <coneGeometry args={[0.08, 0.15, 8]} />
        <meshStandardMaterial color="#e8e4df" roughness={0.7} metalness={0.1} />
      </mesh>
      
      {/* Eye sockets */}
      <mesh position={[-0.15, 1.65, 0.35]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ccc8c3" roughness={0.9} />
      </mesh>
      <mesh position={[0.15, 1.65, 0.35]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#ccc8c3" roughness={0.9} />
      </mesh>
    </group>
  );
};

// --- Subject Component ---
const Subject = ({ type }: { type: string }) => {
  switch (type) {
    case 'sphere':
      return (
        <mesh position={[0, 1, 0]} castShadow receiveShadow>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#e8e4df" roughness={0.5} metalness={0.1} />
        </mesh>
      );
    case 'cube':
      return (
        <mesh position={[0, 1, 0]} castShadow receiveShadow rotation={[0, Math.PI / 6, 0]}>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial color="#e8e4df" roughness={0.6} metalness={0.1} />
        </mesh>
      );
    case 'bust':
    default:
      return <BustModel />;
  }
};

// --- Floor ---
const Floor = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
    <planeGeometry args={[20, 20]} />
    <meshStandardMaterial color="#2a2a2a" roughness={0.9} metalness={0} />
  </mesh>
);

// --- Slider Component ---
const Slider = ({ label, value, onChange, min = 0, max = 100, step = 1, unit = '' }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) => (
  <div className="mb-4">
    <div className="flex justify-between text-xs mb-1">
      <span className="text-slate-400">{label}</span>
      <span className="font-mono text-white">{value.toFixed(step < 1 ? 1 : 0)}{unit}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer
        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
        [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
    />
  </div>
);

// --- Main Scene ---
const Scene = ({ lights, selectedId, onSelectLight, onPositionChange, subjectType, showHelpers }: {
  lights: Light3D[];
  selectedId: string | null;
  onSelectLight: (id: string) => void;
  onPositionChange: (id: string, pos: [number, number, number]) => void;
  subjectType: string;
  showHelpers: boolean;
}) => {
  return (
    <>
      {/* Camera controls */}
      <OrbitControls 
        makeDefault 
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.1}
        minDistance={3}
        maxDistance={15}
        target={[0, 1, 0]}
      />
      
      {/* Ambient light (very dim) */}
      <ambientLight intensity={0.15} />
      
      {/* Lights */}
      {lights.map((light) => (
        <DraggableLight
          key={light.id}
          light={light}
          isSelected={selectedId === light.id}
          onClick={() => onSelectLight(light.id)}
          onPositionChange={(pos) => onPositionChange(light.id, pos)}
        />
      ))}
      
      {/* Subject */}
      <Subject type={subjectType} />
      
      {/* Floor */}
      <Floor />
      
      {/* Contact shadows */}
      <ContactShadows 
        position={[0, -0.24, 0]} 
        opacity={0.5} 
        scale={10} 
        blur={2} 
        far={4}
      />
      
      {/* Grid helper */}
      {showHelpers && (
        <gridHelper args={[10, 10, '#333', '#222']} position={[0, -0.23, 0]} />
      )}
    </>
  );
};

// --- Main Component ---
export default function LightingSimulator3D() {
  const [lights, setLights] = useState<Light3D[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [subjectType, setSubjectType] = useState('bust');
  const [showHelpers, setShowHelpers] = useState(true);
  const [projectName, setProjectName] = useState('燈光配置方案');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [showExportPanel, setShowExportPanel] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const selectedLight = lights.find(l => l.id === selectedId) || null;

  // Update light
  const updateLight = useCallback((id: string, updates: Partial<Light3D>) => {
    setLights(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // Add light
  const addLight = (type: Light3D['type']) => {
    const light = createLight(type);
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
  };

  // Handle position change from 3D
  const handlePositionChange = (id: string, pos: [number, number, number]) => {
    updateLight(id, { position: pos });
  };

  // Export
  const exportScene = () => {
    // Get canvas and create download
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `${projectName}_燈位圖_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    
    // Also export JSON
    const data = {
      projectName,
      clientName,
      notes,
      subjectType,
      lights: lights.map(l => ({
        name: l.name,
        type: LIGHT_TYPES.find(t => t.value === l.type)?.label,
        position: `X:${l.position[0].toFixed(1)} Y:${l.position[1].toFixed(1)} Z:${l.position[2].toFixed(1)}`,
        intensity: l.intensity.toFixed(1),
        modifier: l.modifier,
        color: l.color,
        angle: `${(l.angle * 180 / Math.PI).toFixed(0)}°`,
      })),
      exportDate: new Date().toLocaleString('zh-TW'),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const jsonLink = document.createElement('a');
    jsonLink.download = `${projectName}_燈位配置.json`;
    jsonLink.href = URL.createObjectURL(blob);
    jsonLink.click();
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
          <h1 className="font-bold text-lg">3D 燈位模擬器</h1>
          <p className="text-xs text-slate-500 mt-1">拖曳燈光 · 即時光影 · 匯出報價</p>
        </div>

        {/* Subject Selection */}
        <div className="p-4 border-b border-white/10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">拍攝主體</h3>
          <div className="flex gap-2">
            {SUBJECT_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSubjectType(id)}
                className={`flex-1 flex flex-col items-center gap-1 text-xs py-2 px-3 rounded-lg border transition-colors
                  ${subjectType === id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
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
                {label}
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

      {/* Main 3D Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-12 bg-[#111] border-b border-white/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowHelpers(!showHelpers)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors
                ${showHelpers ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
            >
              <Layers size={14} /> 網格輔助
            </button>
          </div>
          <div className="text-xs text-slate-500">
            <span className="mr-4">🖱️ 左鍵旋轉</span>
            <span className="mr-4">🖱️ 右鍵平移</span>
            <span>🔄 滾輪縮放</span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <Canvas
            ref={canvasRef}
            shadows
            camera={{ position: [5, 4, 5], fov: 50 }}
            gl={{ preserveDrawingBuffer: true }}
            style={{ background: '#0a0a0a' }}
          >
            <Suspense fallback={null}>
              <Scene
                lights={lights}
                selectedId={selectedId}
                onSelectLight={setSelectedId}
                onPositionChange={handlePositionChange}
                subjectType={subjectType}
                showHelpers={showHelpers}
              />
            </Suspense>
          </Canvas>
          
          {/* Instructions overlay */}
          {lights.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb size={32} className="text-white/30" />
                </div>
                <p className="text-slate-500 text-sm">從左側面板新增燈光<br/>或選擇快速配置開始</p>
              </div>
            </div>
          )}
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
              <h3 className="font-bold">燈光屬性</h3>
              <input
                type="text"
                value={selectedLight.name}
                onChange={(e) => updateLight(selectedLight.id, { name: e.target.value })}
                className="w-full bg-transparent border-b border-white/20 text-sm py-1 mt-2 focus:outline-none focus:border-white/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Position */}
              <div>
                <label className="text-xs text-slate-400 block mb-2">位置 (拖曳 3D 物件調整)</label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white/5 rounded px-2 py-1.5">
                    <span className="text-slate-500">X</span> {selectedLight.position[0].toFixed(1)}
                  </div>
                  <div className="bg-white/5 rounded px-2 py-1.5">
                    <span className="text-slate-500">Y</span> {selectedLight.position[1].toFixed(1)}
                  </div>
                  <div className="bg-white/5 rounded px-2 py-1.5">
                    <span className="text-slate-500">Z</span> {selectedLight.position[2].toFixed(1)}
                  </div>
                </div>
              </div>

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
                      {label}
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
                <label className="text-xs text-slate-400 block mb-2">光源類型</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'spot', label: '聚光燈' },
                    { value: 'point', label: '點光源' },
                  ].map(m => (
                    <button
                      key={m.value}
                      onClick={() => updateLight(selectedLight.id, { modifier: m.value as Light3D['modifier'] })}
                      className={`text-xs py-2 px-3 rounded-lg transition-colors
                        ${selectedLight.modifier === m.value ? 'bg-white text-black' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <Slider
                label="強度"
                value={selectedLight.intensity}
                onChange={(v) => updateLight(selectedLight.id, { intensity: v })}
                min={0}
                max={5}
                step={0.1}
              />
              <Slider
                label="距離"
                value={selectedLight.distance}
                onChange={(v) => updateLight(selectedLight.id, { distance: v })}
                min={5}
                max={30}
                step={1}
              />
              {selectedLight.modifier === 'spot' && (
                <>
                  <Slider
                    label="光束角度"
                    value={selectedLight.angle}
                    onChange={(v) => updateLight(selectedLight.id, { angle: v })}
                    min={0.1}
                    max={1.2}
                    step={0.05}
                  />
                  <Slider
                    label="邊緣柔化"
                    value={selectedLight.penumbra}
                    onChange={(v) => updateLight(selectedLight.id, { penumbra: v })}
                    min={0}
                    max={1}
                    step={0.05}
                  />
                </>
              )}
              
              {/* Shadow toggle */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">投射陰影</span>
                <button
                  onClick={() => updateLight(selectedLight.id, { castShadow: !selectedLight.castShadow })}
                  className={`w-12 h-6 rounded-full transition-colors relative
                    ${selectedLight.castShadow ? 'bg-white' : 'bg-white/20'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full transition-all
                      ${selectedLight.castShadow ? 'left-7 bg-black' : 'left-1 bg-white/50'}`}
                  />
                </button>
              </div>
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
              className="bg-[#111] rounded-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold">匯出報價圖</h2>
                <p className="text-xs text-slate-500 mt-1">將 3D 場景截圖與燈光配置匯出</p>
              </div>

              <div className="p-6 space-y-4">
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
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white/30 resize-none"
                  />
                </div>

                {/* Light summary */}
                <div className="bg-white/5 rounded-lg p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">燈光配置摘要</h4>
                  <div className="space-y-2">
                    {lights.map(light => {
                      const typeInfo = LIGHT_TYPES.find(t => t.value === light.type);
                      return (
                        <div key={light.id} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: typeInfo?.color }} />
                          <span className="flex-1">{light.name}</span>
                          <span className="text-slate-500">強度 {light.intensity.toFixed(1)}</span>
                        </div>
                      );
                    })}
                    {lights.length === 0 && (
                      <p className="text-xs text-slate-600">尚未添加燈光</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => setShowExportPanel(false)}
                  className="flex-1 text-sm text-slate-400 hover:text-white py-2.5 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => { exportScene(); setShowExportPanel(false); }}
                  className="flex-1 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-lg px-4 py-2.5 hover:bg-white/90 transition-colors"
                >
                  <Download size={16} /> 下載
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
