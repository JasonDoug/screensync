import React, { useRef, useEffect, useState } from 'react';
import {
  Monitor,
  Video,
  VideoOff,
  Camera,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  Maximize2,
  RefreshCw,
  Sparkles,
  Layers,
  MapPin,
  Sliders,
  Check
} from 'lucide-react';
import { VisualPin, PrivacyMask, DesktopScenario } from '../types';
import { MockDesktop } from './scenarios/MockDesktop';
import { captureVideoFrame } from '../utils/screenCapture';

interface DesktopViewerProps {
  scenario: DesktopScenario;
  onSelectScenario: (scen: DesktopScenario) => void;
  pins: VisualPin[];
  onClearPins: () => void;
  onFrameCaptured: (base64: string) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  onStartShare: () => Promise<void>;
  onStopShare: () => void;
  privacyMasks: PrivacyMask[];
  onAddPrivacyMask: (mask: PrivacyMask) => void;
  onClearPrivacyMasks: () => void;
  autoObserveActive: boolean;
  onToggleAutoObserve: () => void;
}

export const DesktopViewer: React.FC<DesktopViewerProps> = ({
  scenario,
  onSelectScenario,
  pins,
  onClearPins,
  onFrameCaptured,
  videoRef,
  stream,
  onStartShare,
  onStopShare,
  privacyMasks,
  onAddPrivacyMask,
  onClearPrivacyMasks,
  autoObserveActive,
  onToggleAutoObserve,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [streamResolution, setStreamResolution] = useState<{ w: number; h: number } | null>(null);
  const [isDrawingMask, setIsDrawingMask] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [tempMask, setTempMask] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [activePinDetails, setActivePinDetails] = useState<VisualPin | null>(null);
  const [flashEffect, setFlashEffect] = useState(false);

  // Update stream resolution when video metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setStreamResolution({ w: video.videoWidth, h: video.videoHeight });
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef, stream]);

  // Periodic frame grabber when auto-observe is enabled
  useEffect(() => {
    if (!autoObserveActive || !stream) return;

    const interval = setInterval(() => {
      if (videoRef.current) {
        const frame = captureVideoFrame(videoRef.current, privacyMasks);
        if (frame) {
          onFrameCaptured(frame);
        }
      }
    }, 6000);

    return () => clearInterval(interval);
  }, [autoObserveActive, stream, privacyMasks, onFrameCaptured]);

  const handleManualSnap = () => {
    setFlashEffect(true);
    setTimeout(() => setFlashEffect(false), 300);

    if (stream && videoRef.current) {
      const frame = captureVideoFrame(videoRef.current, privacyMasks);
      if (frame) {
        onFrameCaptured(frame);
      }
    } else {
      // Create SVG representation of mock desktop
      const mockElem = containerRef.current?.querySelector('.mock-desktop-container') as HTMLElement;
      if (mockElem) {
        // Fallback canvas generator for mock desktop
        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 1280, 720);
          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 28px sans-serif';
          ctx.fillText(`Screen Frame Context: ${scenario.toUpperCase()}`, 60, 80);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '20px monospace';
          if (scenario === 'vscode_error') {
            ctx.fillText("File: ProductList.tsx | Error: 'products' is possibly undefined", 60, 130);
            ctx.fillStyle = '#ef4444';
            ctx.fillText("Line 48: {products.map((item) => (", 60, 180);
            ctx.fillText("Terminal: TypeError: Cannot read properties of undefined (reading 'map')", 60, 240);
          } else if (scenario === 'terminal_crash') {
            ctx.fillStyle = '#ef4444';
            ctx.fillText("Error: listen EADDRINUSE: address already in use :::3000", 60, 140);
            ctx.fillText("Port 3000 occupied by another background node process", 60, 190);
          } else if (scenario === 'cloud_console') {
            ctx.fillStyle = '#ef4444';
            ctx.fillText("Kubernetes Pod: payment-gateway | Status: CrashLoopBackOff", 60, 140);
            ctx.fillText("Container Exit: FATAL: Missing environment variable: STRIPE_SECRET_KEY", 60, 190);
          } else if (scenario === 'blender_3d') {
            ctx.fillStyle = '#d946ef';
            ctx.fillText("3D Viewport: Missing Texture (Magenta error shader)", 60, 140);
            ctx.fillText("Base color texture missing / unlinked image node", 60, 190);
          }
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          onFrameCaptured(base64);
        }
      }
    }
  };

  // Mask drawing handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawingMask || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDragStart({ x, y });
    setTempMask({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingMask || !dragStart || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;

    const x = Math.min(dragStart.x, currentX);
    const y = Math.min(dragStart.y, currentY);
    const width = Math.abs(currentX - dragStart.x);
    const height = Math.abs(currentY - dragStart.y);

    setTempMask({ x, y, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawingMask || !tempMask) return;
    if (tempMask.width > 2 && tempMask.height > 2) {
      onAddPrivacyMask({
        id: Math.random().toString(36).substring(7),
        ...tempMask,
      });
    }
    setDragStart(null);
    setTempMask(null);
    setIsDrawingMask(false);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-[#070a12] border-r border-slate-800/80 overflow-hidden relative select-none">
      {/* Top Desktop Navigation & Controls Bar */}
      <div className="h-13 bg-slate-950/90 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  stream ? 'bg-emerald-400' : 'bg-blue-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  stream ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
              ></span>
            </span>
            <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
              <Monitor className="w-4 h-4 text-blue-400" />
              {stream ? 'Live Desktop Feed' : 'Desktop Preview'}
            </span>
          </div>

          {streamResolution && stream && (
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              {streamResolution.w}x{streamResolution.h}
            </span>
          )}

          {pins.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs">
              <MapPin className="w-3 h-3 animate-bounce" />
              <span>{pins.length} AI visual radar pin{pins.length > 1 ? 's' : ''} active</span>
              <button
                onClick={onClearPins}
                className="ml-1 text-[10px] text-slate-400 hover:text-white underline"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Screen Share Button */}
          {!stream ? (
            <button
              onClick={onStartShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition shadow-md shadow-blue-500/20 cursor-pointer"
              title="Share your entire screen, an application window, or a browser tab"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Share My Desktop</span>
            </button>
          ) : (
            <button
              onClick={onStopShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white font-semibold text-xs transition cursor-pointer"
            >
              <VideoOff className="w-3.5 h-3.5" />
              <span>Stop Sharing</span>
            </button>
          )}

          {/* Privacy Redaction Tool */}
          <button
            onClick={() => setIsDrawingMask(!isDrawingMask)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              isDrawingMask
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : privacyMasks.length > 0
                ? 'bg-slate-900 border-slate-700 text-emerald-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Draw a box to mask sensitive passwords/tokens from the LLM"
          >
            {privacyMasks.length > 0 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {isDrawingMask ? 'Drawing Mask...' : privacyMasks.length > 0 ? `${privacyMasks.length} Redacted` : 'Redact Area'}
            </span>
          </button>

          {privacyMasks.length > 0 && (
            <button
              onClick={onClearPrivacyMasks}
              className="text-[11px] text-slate-400 hover:text-rose-400 transition"
              title="Clear all redacted areas"
            >
              Clear Masks
            </button>
          )}

          {/* Continuous Auto-Observe Toggle */}
          <button
            onClick={onToggleAutoObserve}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
              autoObserveActive
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400'
            }`}
            title="Automatically pulse and stream frames every few seconds"
          >
            <Eye className={`w-3.5 h-3.5 ${autoObserveActive ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{autoObserveActive ? 'Auto-Streaming' : 'Auto Stream'}</span>
          </button>

          {/* Snap Frame Button */}
          <button
            onClick={handleManualSnap}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer"
            title="Capture current desktop frame as immediate LLM vision context"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Snap Frame</span>
          </button>
        </div>
      </div>

      {/* Main Desktop Display Screen */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className={`flex-1 p-3 overflow-hidden flex items-center justify-center relative bg-gradient-to-b from-[#070a12] to-[#04060a] ${
          isDrawingMask ? 'cursor-crosshair' : ''
        }`}
      >
        {/* Flash animation on capture */}
        {flashEffect && (
          <div className="absolute inset-0 bg-white/30 z-50 pointer-events-none transition-opacity duration-300"></div>
        )}

        {/* Real Live Video Feed or Demo Scenario */}
        {stream ? (
          <div className="w-full h-full relative flex items-center justify-center rounded-lg overflow-hidden border border-slate-800 bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain pointer-events-none"
            />
          </div>
        ) : (
          <div className="w-full h-full mock-desktop-container">
            <MockDesktop
              scenario={scenario}
              onSelectScenario={onSelectScenario}
            />
          </div>
        )}

        {/* Visual AI Pin Radars Overlaid onto Screen */}
        {pins.map((pin, idx) => (
          <div
            key={idx}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-30 pointer-events-auto cursor-pointer group"
            onClick={() => setActivePinDetails(pin)}
          >
            {/* Pulsing Outer Radar Ring */}
            <span className="absolute -inset-4 rounded-full bg-blue-500/40 radar-ping pointer-events-none"></span>
            
            {/* Glowing Center Target Reticle */}
            <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600/90 text-white font-bold text-xs shadow-lg shadow-blue-500/50 border-2 border-white ring-2 ring-blue-400 animate-bounce">
              <span>{idx + 1}</span>
            </div>

            {/* Hover Tooltip Card */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900/95 text-slate-100 text-xs px-2.5 py-1.5 rounded-md shadow-xl border border-blue-500/50 min-w-32 whitespace-nowrap z-40 backdrop-blur-md">
              <span className="font-semibold text-blue-400">Target #{idx + 1}</span>
              <span className="text-[11px] text-slate-300">
                {pin.label || `Target coordinates (${Math.round(pin.x)}%, ${Math.round(pin.y)}%)`}
              </span>
            </div>
          </div>
        ))}

        {/* Privacy Mask Bounding Boxes */}
        {privacyMasks.map((mask) => (
          <div
            key={mask.id}
            style={{
              left: `${mask.x}%`,
              top: `${mask.y}%`,
              width: `${mask.width}%`,
              height: `${mask.height}%`,
            }}
            className="absolute z-25 bg-slate-950/90 border-2 border-dashed border-rose-500/80 rounded flex items-center justify-center pointer-events-none"
          >
            <span className="text-[10px] font-mono text-rose-400 bg-rose-950/80 px-1 rounded">
              [REDACTED FROM VISION]
            </span>
          </div>
        ))}

        {/* Active Temp Mask while dragging */}
        {tempMask && (
          <div
            style={{
              left: `${tempMask.x}%`,
              top: `${tempMask.y}%`,
              width: `${tempMask.width}%`,
              height: `${tempMask.height}%`,
            }}
            className="absolute z-25 bg-blue-500/20 border-2 border-dashed border-blue-400 pointer-events-none"
          />
        )}
      </div>

      {/* Screen Mode Indicator / Helper Banner at bottom */}
      <div className="h-8 bg-slate-950/95 border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-400"></span>
          <span>
            {stream
              ? 'Screen stream actively projected to vision-capable Gemini LLM'
              : 'Streaming interactive demo desktop. Click "Share My Desktop" above to stream your actual screen.'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          Observer-Only Vision Co-Pilot &bull; No direct OS clicks
        </div>
      </div>
    </div>
  );
};
