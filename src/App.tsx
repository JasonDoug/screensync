/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { DesktopViewer } from './components/DesktopViewer';
import { ChatbotSidecar } from './components/ChatbotSidecar';
import {
  AssistantMode,
  DesktopScenario,
  VisualPin,
  PrivacyMask
} from './types';
import { captureVideoFrame } from './utils/screenCapture';
import {
  Monitor,
  HelpCircle,
  Sparkles,
  Info,
  X,
  ExternalLink,
  Shield,
  Layers
} from 'lucide-react';

export default function App() {
  const [ratio, setRatio] = useState<'1/5' | '1/4' | '1/3'>('1/4');
  const [scenario, setScenario] = useState<DesktopScenario>('vscode_error');
  const [mode, setMode] = useState<AssistantMode>('chat');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pins, setPins] = useState<VisualPin[]>([]);
  const [privacyMasks, setPrivacyMasks] = useState<PrivacyMask[]>([]);
  const [lastCapturedFrame, setLastCapturedFrame] = useState<string | null>(null);
  const [autoObserveActive, setAutoObserveActive] = useState<boolean>(false);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [customRatioPercent, setCustomRatioPercent] = useState<number>(25);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Start real browser screen capture
  const handleStartShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen capture API is not supported in this browser environment.');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      setStream(mediaStream);

      // Listen for when user clicks "Stop Sharing" on browser's native banner
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setStream(null);
        };
      }
    } catch (err: any) {
      console.warn('Screen share cancelled or not allowed:', err);
      // Fallback seamlessly to the mock desktop
    }
  };

  const handleStopShare = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Capture current frame on demand
  const handleCaptureFrame = useCallback(() => {
    if (stream && videoRef.current) {
      const frame = captureVideoFrame(videoRef.current, privacyMasks);
      if (frame) {
        setLastCapturedFrame(frame);
        return frame;
      }
    }
    return lastCapturedFrame;
  }, [stream, privacyMasks, lastCapturedFrame]);

  // Handle ratio switcher
  const handleRatioChange = (newRatio: '1/5' | '1/4' | '1/3') => {
    setRatio(newRatio);
    if (newRatio === '1/5') setCustomRatioPercent(20);
    else if (newRatio === '1/4') setCustomRatioPercent(25);
    else if (newRatio === '1/3') setCustomRatioPercent(33.33);
  };

  // Draggable divider handler
  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const windowWidth = window.innerWidth;
      const newSidecarWidth = windowWidth - moveEvent.clientX;
      const newPercent = (newSidecarWidth / windowWidth) * 100;

      // Constrain between 18% (approx 1/5) and 35% (approx 1/3)
      if (newPercent >= 18 && newPercent <= 36) {
        setCustomRatioPercent(newPercent);
        if (newPercent < 22) setRatio('1/5');
        else if (newPercent < 29) setRatio('1/4');
        else setRatio('1/3');
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-[#070a12] text-slate-100 overflow-hidden font-sans select-none">
      {/* Top Application Global Header */}
      <header className="h-10 bg-[#090d16] border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 text-xs z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold tracking-tight text-white text-sm">
            <span className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs shadow-md shadow-blue-500/30">
              <Monitor className="w-3.5 h-3.5" />
            </span>
            <span>ScreenSight AI</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-800 text-[11px] text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-blue-300 font-mono">
              Desktop Vision Co-Pilot
            </span>
            <span>&bull;</span>
            <span className="text-slate-400">
              Sidecar Docked on Right ({Math.round(customRatioPercent)}% width)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowInfoModal(true)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Split: Left = Desktop Screen (2/3 - 4/5), Right = Chatbot Sidecar Window (1/3 - 1/5) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Desktop Screen Area */}
        <div
          style={{ width: `calc(100% - ${customRatioPercent}%)` }}
          className="h-full flex flex-col overflow-hidden relative transition-all duration-75"
        >
          <DesktopViewer
            scenario={scenario}
            onSelectScenario={setScenario}
            pins={pins}
            onClearPins={() => setPins([])}
            onFrameCaptured={(base64) => setLastCapturedFrame(base64)}
            videoRef={videoRef}
            stream={stream}
            onStartShare={handleStartShare}
            onStopShare={handleStopShare}
            privacyMasks={privacyMasks}
            onAddPrivacyMask={(mask) => setPrivacyMasks((prev) => [...prev, mask])}
            onClearPrivacyMasks={() => setPrivacyMasks([])}
            autoObserveActive={autoObserveActive}
            onToggleAutoObserve={() => setAutoObserveActive(!autoObserveActive)}
          />
        </div>

        {/* Draggable Splitter Divider */}
        <div
          onMouseDown={handleDividerMouseDown}
          className={`w-1.5 hover:w-2 bg-slate-900 hover:bg-blue-600 transition-all cursor-col-resize z-40 relative group flex items-center justify-center shrink-0 border-x border-slate-800/80 ${
            isResizing ? 'bg-blue-600 w-2' : ''
          }`}
          title="Drag to adjust window width (1/5 to 1/3)"
        >
          <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full"></div>
        </div>

        {/* Right-Hand Chatbot Sidecar Window (1/3 to 1/5 desktop width) */}
        <div
          style={{ width: `${customRatioPercent}%` }}
          className="h-full flex flex-col overflow-hidden relative transition-all duration-75 shrink-0"
        >
          <ChatbotSidecar
            ratio={ratio}
            onChangeRatio={handleRatioChange}
            lastCapturedFrame={lastCapturedFrame}
            onCaptureFrame={handleCaptureFrame}
            onNewPins={(newPins) => setPins(newPins)}
            streamActive={!!stream}
            onStartShare={handleStartShare}
            mode={mode}
            onChangeMode={setMode}
          />
        </div>
      </div>

      {/* Info & Instructions Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0e1320] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">How ScreenSight AI Works</h3>
                <p className="text-slate-400 text-xs">Desktop Vision Co-Pilot & Interactive Guide</p>
              </div>
            </div>

            <div className="space-y-3.5 text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-semibold text-blue-400 flex items-center gap-1.5 mb-1">
                  <Monitor className="w-3.5 h-3.5" /> 1. Desktop Screen Context
                </div>
                <div>
                  Your desktop screen (or the built-in demo scenarios) is captured and streamed to Gemini 3.8 Flash Vision. The AI inspects what you see, identifying UI elements, menus, code lines, or errors.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5" /> 2. Observer-Only Security
                </div>
                <div>
                  The AI is strictly an **observer**. It CANNOT click, type, or interact with your desktop directly. You remain in full control of every click and keystroke.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> 3. Visual Radar Pins
                </div>
                <div>
                  Whenever the AI instructs you to click or look at a button, it attaches visual coordinates (e.g. [pin: 85%, 15%]) that project glowing target rings directly on your screen.
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="font-semibold text-purple-400 flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5" /> 4. Tutorials & Verification
                </div>
                <div>
                  Switch to **Tutorial Mode** to break any workflow into numbered steps. As you complete each step, click **Verify** and ScreenSight will verify your progress on screen!
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-semibold transition"
              >
                Got It, Let's Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
