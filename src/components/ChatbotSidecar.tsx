import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Wrench,
  HelpCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  MapPin,
  RefreshCw,
  Camera,
  Layers,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  AlertCircle,
  Code2,
  ArrowRight,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import {
  AssistantMode,
  ChatMessage,
  VisualPin,
  StructuredTutorial,
  TutorialStep
} from '../types';

interface ChatbotSidecarProps {
  ratio: '1/5' | '1/4' | '1/3';
  onChangeRatio: (r: '1/5' | '1/4' | '1/3') => void;
  lastCapturedFrame: string | null;
  onCaptureFrame: () => string | null;
  onNewPins: (pins: VisualPin[]) => void;
  streamActive: boolean;
  onStartShare: () => Promise<void>;
  mode: AssistantMode;
  onChangeMode: (m: AssistantMode) => void;
}

export const ChatbotSidecar: React.FC<ChatbotSidecarProps> = ({
  ratio,
  onChangeRatio,
  lastCapturedFrame,
  onCaptureFrame,
  onNewPins,
  streamActive,
  onStartShare,
  mode,
  onChangeMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTutorial, setActiveTutorial] = useState<StructuredTutorial | null>(null);
  const [verifyingStep, setVerifyingStep] = useState<number | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Initial welcome message if conversation is empty
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-1',
          role: 'assistant',
          content: `👋 **Hello! I am ScreenSight AI**, your vision-capable desktop co-pilot.

I **observe your desktop screen in real-time** to help you troubleshoot issues, understand software, or guide you through tasks. 

⚠️ *Important Operating Rule:* I can **only see** your screen; I cannot interact with or click anything on your computer. All actions will be guided step-by-step for you to execute!

How would you like to start?
- **Create a Tutorial**: Ask me to teach you how to perform a workflow or use the app visible on screen.
- **Describe a Problem**: Tell me what error or glitch you are running into, and I will visually diagnose it.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, []);

  // Text to speech handler
  const handleSpeak = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Clean markdown for audio
    const cleanText = text
      .replace(/\[pin:[^\]]+\]/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/[*#`_]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Submit a message to the backend
  const handleSubmit = async (overridePrompt?: string, selectedMode?: AssistantMode) => {
    const promptToSend = overridePrompt || inputText;
    if (!promptToSend.trim() || isLoading) return;

    const currentMode = selectedMode || mode;
    setInputText('');

    // Capture the latest screen frame right now
    const currentFrame = onCaptureFrame() || lastCapturedFrame;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substring(7),
      role: 'user',
      content: promptToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageBase64: currentFrame || undefined,
      mode: currentMode,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (currentMode === 'tutorial' && !activeTutorial) {
        // Generate structured tutorial
        const res = await fetch('/api/generate-tutorial', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: currentFrame,
            topic: promptToSend,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to generate tutorial from server');
        }

        const tutorialData: StructuredTutorial = await res.json();
        // Initialize step statuses
        if (tutorialData.steps && tutorialData.steps.length > 0) {
          tutorialData.steps = tutorialData.steps.map((st, i) => ({
            ...st,
            status: i === 0 ? 'in_progress' : 'pending',
          }));
        }

        setActiveTutorial(tutorialData);

        // Also extract pins from first step if available
        if (tutorialData.steps?.[0]?.pinCoordinates) {
          onNewPins([
            {
              x: tutorialData.steps[0].pinCoordinates.x,
              y: tutorialData.steps[0].pinCoordinates.y,
              label: tutorialData.steps[0].title,
            },
          ]);
        }

        const replyMessage: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: `🎯 **Tutorial Generated: ${tutorialData.title}**\n\n${tutorialData.overview}\n\n⏱️ **Est. Time:** ${tutorialData.estimatedMinutes} mins | 📈 **Difficulty:** ${tutorialData.difficulty}\n\nI have created a ${tutorialData.steps.length}-step interactive guide for you. Look at the Tutorial tab above to track each step, view radar pins, and verify your progress as you work on your desktop!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, replyMessage]);
      } else {
        // Standard or troubleshooting screen analysis
        const res = await fetch('/api/analyze-screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: currentFrame,
            message: promptToSend,
            mode: currentMode,
            conversation: messages.slice(-5).map((m) => ({
              role: m.role,
              text: m.content,
            })),
          }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();

        if (data.pins && data.pins.length > 0) {
          onNewPins(data.pins);
        }

        const replyMessage: ChatMessage = {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          pins: data.pins,
        };
        setMessages((prev) => [...prev, replyMessage]);
      }
    } catch (err: any) {
      console.error('Chat submit error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(7),
          role: 'assistant',
          content: `⚠️ **Unable to complete analysis:** ${err.message || 'Please check your connection and try again.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Step verification: Grabs fresh screen frame and verifies if the user completed the step
  const handleVerifyStep = async (stepIndex: number) => {
    if (!activeTutorial) return;
    const step = activeTutorial.steps[stepIndex];
    if (!step) return;

    setVerifyingStep(stepIndex);
    const freshFrame = onCaptureFrame() || lastCapturedFrame;

    try {
      const res = await fetch('/api/verify-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: freshFrame,
          currentStep: `${step.title}: ${step.instructions}`,
          expectedOutcome: step.verificationHint,
        }),
      });

      const verification = await res.json();

      setActiveTutorial((prev) => {
        if (!prev) return null;
        const updatedSteps = [...prev.steps];
        const current = updatedSteps[stepIndex];

        if (verification.completed) {
          current.status = 'completed';
          current.verificationFeedback = verification.feedback;
          // Advance to next step
          if (stepIndex + 1 < updatedSteps.length) {
            updatedSteps[stepIndex + 1].status = 'in_progress';
            if (updatedSteps[stepIndex + 1].pinCoordinates) {
              onNewPins([
                {
                  x: updatedSteps[stepIndex + 1].pinCoordinates!.x,
                  y: updatedSteps[stepIndex + 1].pinCoordinates!.y,
                  label: updatedSteps[stepIndex + 1].title,
                },
              ]);
            }
          }
        } else {
          current.status = 'failed';
          current.verificationFeedback = `${verification.feedback} ${verification.correction ? `Tip: ${verification.correction}` : ''}`;
        }
        return { ...prev, steps: updatedSteps };
      });
    } catch (err) {
      console.error('Verification error:', err);
    } finally {
      setVerifyingStep(null);
    }
  };

  return (
    <aside
      className={`h-full flex flex-col bg-[#0b0f19] border-l border-slate-800 shadow-2xl relative transition-all duration-200 z-30 ${
        isMinimized ? 'w-14' : 'w-full'
      }`}
    >
      {/* Sidecar Window Titlebar */}
      <div className="h-13 bg-slate-950/95 border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 select-none backdrop-blur-md">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/30 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          {!isMinimized && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-xs text-slate-100 flex items-center gap-1.5">
                ScreenSight Co-Pilot
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate">
                Vision Linked &bull; Observer Only
              </span>
            </div>
          )}
        </div>

        {/* Desktop Width Controls & Window Actions */}
        {!isMinimized && (
          <div className="flex items-center gap-1.5">
            {/* Desktop Ratio Selector: 1/5 (20%), 1/4 (25%), 1/3 (33%) */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-0.5 text-[10px] font-mono">
              <button
                onClick={() => onChangeRatio('1/5')}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  ratio === '1/5' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Occupy 1/5 (20%) of Desktop"
              >
                1/5
              </button>
              <button
                onClick={() => onChangeRatio('1/4')}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  ratio === '1/4' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Occupy 1/4 (25%) of Desktop"
              >
                1/4
              </button>
              <button
                onClick={() => onChangeRatio('1/3')}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  ratio === '1/3' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
                title="Occupy 1/3 (33%) of Desktop"
              >
                1/3
              </button>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={() => handleSpeak(messages[messages.length - 1]?.content || '')}
              className={`p-1.5 rounded hover:bg-slate-800 transition cursor-pointer ${
                isSpeaking ? 'text-blue-400 bg-blue-950/50' : 'text-slate-400'
              }`}
              title={isSpeaking ? 'Stop speech' : 'Read latest answer aloud'}
            >
              {isSpeaking ? <Volume2 className="w-3.5 h-3.5 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}
      </div>

      {!isMinimized && (
        <>
          {/* Mode Switcher Tabs */}
          <div className="h-10 bg-slate-900/60 border-b border-slate-800/80 px-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-1 w-full">
              <button
                onClick={() => onChangeMode('chat')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-medium transition cursor-pointer ${
                  mode === 'chat'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => onChangeMode('tutorial')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-medium transition cursor-pointer ${
                  mode === 'tutorial'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Tutorial</span>
                {activeTutorial && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                )}
              </button>
              <button
                onClick={() => onChangeMode('troubleshoot')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded font-medium transition cursor-pointer ${
                  mode === 'troubleshoot'
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Diagnose</span>
              </button>
            </div>
          </div>

          {/* Tutorial Roadmap View (when Tutorial mode is active and tutorial exists) */}
          {mode === 'tutorial' && activeTutorial && (
            <div className="bg-slate-950 p-3 border-b border-slate-800 shrink-0 max-h-64 overflow-y-auto space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xs text-white">{activeTutorial.title}</h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {activeTutorial.steps.filter((s) => s.status === 'completed').length} of {activeTutorial.steps.length} steps completed
                  </div>
                </div>
                <button
                  onClick={() => setActiveTutorial(null)}
                  className="text-[10px] text-slate-500 hover:text-slate-300 underline"
                >
                  New Tutorial
                </button>
              </div>

              {/* Steps Checklist */}
              <div className="space-y-2 mt-2">
                {activeTutorial.steps.map((st, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded border text-xs transition ${
                      st.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-300'
                        : st.status === 'in_progress'
                        ? 'bg-blue-950/30 border-blue-500/60 text-slate-100 shadow-md ring-1 ring-blue-500/30'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                            st.status === 'completed'
                              ? 'bg-emerald-500 text-slate-950'
                              : st.status === 'in_progress'
                              ? 'bg-blue-500 text-white'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {st.status === 'completed' ? '✓' : st.stepNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-200">{st.title}</div>
                          <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                            {st.instructions}
                          </div>
                          {st.targetElement && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-400 mt-1 font-mono">
                              <MapPin className="w-3 h-3" />
                              <span>Look at: {st.targetElement}</span>
                            </div>
                          )}
                          {st.codeSnippetOrKey && (
                            <div className="mt-1.5 p-1 bg-black/60 rounded border border-slate-800 font-mono text-[11px] text-emerald-400">
                              {st.codeSnippetOrKey}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Verify Action Button for Current Step */}
                      {st.status === 'in_progress' && (
                        <button
                          onClick={() => handleVerifyStep(idx)}
                          disabled={verifyingStep === idx}
                          className="shrink-0 px-2 py-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          {verifyingStep === idx ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          <span>Verify</span>
                        </button>
                      )}
                    </div>

                    {st.verificationFeedback && (
                      <div className="mt-2 text-[10px] p-1.5 rounded bg-black/40 border border-slate-800 text-slate-300">
                        {st.verificationFeedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conversation Chat Stream */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                    {msg.role === 'user' ? (
                      <>
                        <User className="w-3 h-3 text-blue-400" /> You
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-emerald-400" /> ScreenSight AI
                      </>
                    )}
                  </span>
                  <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-xl max-w-[94%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                      : msg.error
                      ? 'bg-rose-950/40 border border-rose-500/50 text-rose-200 rounded-bl-none'
                      : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-bl-none shadow-sm'
                  }`}
                >
                  {/* Attached Frame Context Thumbnail */}
                  {msg.imageBase64 && (
                    <div className="mb-2 relative rounded overflow-hidden border border-slate-700/60 max-w-[180px]">
                      <img
                        src={msg.imageBase64}
                        alt="Captured frame context"
                        className="w-full h-auto object-cover opacity-90"
                      />
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 rounded text-[9px] font-mono text-slate-300 flex items-center gap-1">
                        <Camera className="w-2.5 h-2.5" /> Desktop Snapshot
                      </div>
                    </div>
                  )}

                  {/* Content with markdown support */}
                  <div className="whitespace-pre-wrap space-y-2">
                    {msg.content}
                  </div>

                  {/* Pin shortcuts if AI provided visual landmarks */}
                  {msg.pins && msg.pins.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Visual Pointers:
                      </span>
                      {msg.pins.map((pin, pidx) => (
                        <span
                          key={pidx}
                          className="px-1.5 py-0.5 rounded bg-blue-950/60 border border-blue-500/30 text-[10px] text-blue-300 font-mono"
                        >
                          Target #{pidx + 1} ({Math.round(pin.x)}%, {Math.round(pin.y)}%)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Message Action Footer */}
                  {msg.role === 'assistant' && !msg.error && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-slate-400 text-[10px]">
                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="flex items-center gap-1 hover:text-slate-200 transition cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSpeak(msg.content)}
                        className="flex items-center gap-1 hover:text-slate-200 transition cursor-pointer"
                      >
                        <Volume2 className="w-3 h-3" /> Listen
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-2 text-slate-400">
                <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl rounded-bl-none text-xs flex items-center gap-2 text-slate-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span>ScreenSight is visually analyzing current desktop frame...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* First-Open / Quick Action Suggestions */}
          <div className="px-3 py-2 bg-slate-950/80 border-t border-slate-800/80 shrink-0">
            <div className="text-[10px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick Actions:
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => {
                  onChangeMode('tutorial');
                  handleSubmit('Create an interactive tutorial for the application on my screen', 'tutorial');
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-blue-950/40 hover:bg-blue-900/50 border border-blue-500/30 text-blue-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <GraduationCap className="w-3 h-3 text-blue-400" /> Create Tutorial
              </button>
              <button
                onClick={() => {
                  onChangeMode('troubleshoot');
                  handleSubmit('Inspect my screen and diagnose any error or bug visible right now', 'troubleshoot');
                }}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 text-[11px] font-medium transition cursor-pointer flex items-center gap-1 shrink-0"
              >
                <Wrench className="w-3 h-3 text-rose-400" /> Diagnose Screen Error
              </button>
              <button
                onClick={() => handleSubmit('Explain what is currently displayed on this screen')}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer shrink-0"
              >
                Explain Screen
              </button>
              <button
                onClick={() => handleSubmit('Where should I click next? Give coordinates')}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-medium transition cursor-pointer shrink-0"
              >
                Next Click Hint
              </button>
            </div>
          </div>

          {/* User Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit();
              }}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-blue-500 transition"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  mode === 'tutorial'
                    ? 'Ask for a tutorial (e.g. "How to fix the TS error and run tests")...'
                    : mode === 'troubleshoot'
                    ? 'Describe your problem or error (e.g. "Why is port 3000 busy?")...'
                    : 'Ask anything about what is on your screen...'
                }
                className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 px-1">
              <span>Streaming screen frame as visual context</span>
              <span>Gemini 3.8 Flash Vision</span>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
