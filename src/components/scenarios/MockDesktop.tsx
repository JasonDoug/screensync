import React, { useState } from 'react';
import {
  Terminal,
  Code2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Server,
  Database,
  ExternalLink,
  CheckCircle,
  FileCode,
  FolderTree,
  ChevronRight,
  Bug,
  Cpu,
  Activity
} from 'lucide-react';
import { DesktopScenario } from '../../types';

interface MockDesktopProps {
  scenario: DesktopScenario;
  onSelectScenario: (scen: DesktopScenario) => void;
  onRequestAnalysis?: (context: string) => void;
}

export const MockDesktop: React.FC<MockDesktopProps> = ({
  scenario,
  onSelectScenario,
  onRequestAnalysis,
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'terminal' | 'preview'>('editor');
  const [terminalCommand, setTerminalCommand] = useState('npm run dev');
  const [showFixedCode, setShowFixedCode] = useState(false);

  return (
    <div className="w-full h-full flex flex-col bg-[#0d1117] text-slate-100 select-none overflow-hidden rounded-lg border border-slate-800 shadow-2xl relative">
      {/* Mock OS Window Titlebar */}
      <div className="h-9 bg-[#161b22] border-b border-slate-800/80 flex items-center justify-between px-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 hover:opacity-100 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 hover:opacity-100 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 hover:opacity-100 inline-block"></span>
          </div>
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            {scenario === 'vscode_error' && <Code2 className="w-3.5 h-3.5 text-blue-400" />}
            {scenario === 'terminal_crash' && <Terminal className="w-3.5 h-3.5 text-emerald-400" />}
            {scenario === 'blender_3d' && <Layers className="w-3.5 h-3.5 text-orange-400" />}
            {scenario === 'cloud_console' && <Server className="w-3.5 h-3.5 text-purple-400" />}
            {scenario === 'vscode_error' && 'VS Code - client/src/components/ProductList.tsx (Workspace: E-Commerce Store)'}
            {scenario === 'terminal_crash' && 'Bash Terminal - node-service-worker (port 3000 collision)'}
            {scenario === 'blender_3d' && 'Blender 4.2 LTS - Character_Asset_v3.blend (Shader & Normal Error)'}
            {scenario === 'cloud_console' && 'Cloud Console - Production Cluster / Pods (CrashLoopBackOff)'}
          </span>
        </div>

        {/* Quick Scenario Preset Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
          <span className="text-slate-400 font-medium">Demo Screen:</span>
          <button
            onClick={() => onSelectScenario('vscode_error')}
            className={`px-1.5 py-0.5 rounded transition ${
              scenario === 'vscode_error' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            React Bug
          </button>
          <button
            onClick={() => onSelectScenario('terminal_crash')}
            className={`px-1.5 py-0.5 rounded transition ${
              scenario === 'terminal_crash' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Port Conflict
          </button>
          <button
            onClick={() => onSelectScenario('cloud_console')}
            className={`px-1.5 py-0.5 rounded transition ${
              scenario === 'cloud_console' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Crash
          </button>
          <button
            onClick={() => onSelectScenario('blender_3d')}
            className={`px-1.5 py-0.5 rounded transition ${
              scenario === 'blender_3d' ? 'bg-blue-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            3D Shader
          </button>
        </div>
      </div>

      {/* Main Mock Content based on Scenario */}
      {scenario === 'vscode_error' && (
        <div className="flex-1 flex flex-col overflow-hidden text-xs">
          {/* Editor Header Tabs */}
          <div className="h-8 bg-[#090d16] flex items-center px-2 gap-1 border-b border-slate-800/80 text-slate-400">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0d1117] text-slate-200 border-t-2 border-blue-500 rounded-t font-mono text-[11px]">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>ProductList.tsx</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 ml-1"></span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 hover:bg-slate-800/40 rounded-t font-mono text-[11px]">
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>api.ts</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 hover:bg-slate-800/40 rounded-t font-mono text-[11px]">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>package.json</span>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Folder Explorer */}
            <div className="w-48 bg-[#090d16] border-r border-slate-800/80 p-2 flex flex-col gap-1 text-slate-400 font-mono text-[11px] shrink-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Explorer</div>
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <ChevronRight className="w-3 h-3" /> src
              </div>
              <div className="pl-4 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-medium bg-blue-950/40 px-1 py-0.5 rounded">
                  <FileCode className="w-3 h-3" /> ProductList.tsx
                </div>
                <div className="flex items-center gap-1.5 hover:text-slate-200">
                  <FileCode className="w-3 h-3 text-slate-500" /> App.tsx
                </div>
                <div className="flex items-center gap-1.5 hover:text-slate-200">
                  <FileCode className="w-3 h-3 text-slate-500" /> main.tsx
                </div>
                <div className="flex items-center gap-1.5 hover:text-slate-200">
                  <FileCode className="w-3 h-3 text-slate-500" /> styles.css
                </div>
              </div>
            </div>

            {/* Code Editor Pane */}
            <div className="flex-1 flex flex-col bg-[#0d1117] overflow-hidden">
              <div className="flex-1 p-3 font-mono text-[12px] leading-relaxed overflow-y-auto">
                <div className="text-slate-500">// Component: Product Catalog with dynamic fetch</div>
                <div className="text-purple-400">import <span className="text-slate-200">&#123; useEffect, useState &#125;</span> from <span className="text-emerald-300">'react'</span>;</div>
                <div className="text-purple-400">import <span className="text-slate-200">&#123; fetchProducts &#125;</span> from <span className="text-emerald-300">'../api'</span>;</div>
                <br />
                <div><span className="text-blue-400">export default function</span> <span className="text-amber-300">ProductList</span>() &#123;</div>
                <div className="pl-4 text-slate-300">
                  <span className="text-blue-400">const</span> [products, setProducts] = <span className="text-amber-300">useState</span>&lt;<span className="text-cyan-400">any[]</span>&gt;();
                </div>
                <div className="pl-4 text-slate-300">
                  <span className="text-blue-400">const</span> [loading, setLoading] = <span className="text-amber-300">useState</span>(<span className="text-orange-400">true</span>);
                </div>
                <br />
                <div className="pl-4 text-slate-300">
                  <span className="text-amber-300">useEffect</span>(() =&gt; &#123;
                </div>
                <div className="pl-8 text-slate-300">
                  <span className="text-amber-300">fetchProducts</span>().<span className="text-amber-300">then</span>((res) =&gt; &#123;
                </div>
                <div className="pl-12 text-slate-300">
                  <span className="text-amber-300">setProducts</span>(res.data?.items);
                </div>
                <div className="pl-12 text-slate-300">
                  <span className="text-amber-300">setLoading</span>(<span className="text-orange-400">false</span>);
                </div>
                <div className="pl-8 text-slate-300">&#125;);</div>
                <div className="pl-4 text-slate-300">&#125;, []);</div>
                <br />
                <div className="pl-4 text-slate-300">
                  <span className="text-blue-400">return</span> (
                </div>
                <div className="pl-8 text-slate-300">
                  &lt;<span className="text-cyan-400">div</span> <span className="text-purple-300">className</span>=<span className="text-emerald-300">"grid grid-cols-3 gap-4"</span>&gt;
                </div>

                {/* THE BUGGY LINE */}
                <div className="pl-12 relative group my-1">
                  {!showFixedCode ? (
                    <div className="bg-rose-950/40 border border-rose-500/60 rounded p-1.5 flex items-start gap-2">
                      <Bug className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                      <div>
                        <span className="text-rose-300 font-bold underline decoration-wavy decoration-rose-500">
                          &#123;products.map((item) =&gt; (
                        </span>
                        <div className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-sans">
                          <AlertTriangle className="w-3 h-3" />
                          <span>TS Error: 'products' is possibly 'undefined'. Initial state is uninitialized.</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/40 border border-emerald-500/60 rounded p-1.5 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-emerald-300 font-bold">
                          &#123;products?.map((item) =&gt; (
                        </span>
                        <span className="text-xs text-emerald-400 ml-2 font-sans font-medium">
                          (Fixed with optional chaining / initial empty array state [])
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pl-16 text-slate-300">
                  &lt;<span className="text-cyan-400">div</span> <span className="text-purple-300">key</span>=&#123;item.id&#125; <span className="text-purple-300">className</span>=<span className="text-emerald-300">"p-3 border rounded"</span>&gt;
                </div>
                <div className="pl-20 text-slate-300">
                  &lt;<span className="text-cyan-400">h3</span>&gt;&#123;item.title&#125;&lt;/<span className="text-cyan-400">h3</span>&gt;
                </div>
                <div className="pl-16 text-slate-300">&lt;/<span className="text-cyan-400">div</span>&gt;
                </div>
                <div className="pl-12 text-slate-300">))&#125;</div>
                <div className="pl-8 text-slate-300">&lt;/<span className="text-cyan-400">div</span>&gt;</div>
                <div className="pl-4 text-slate-300">);</div>
                <div>&#125;</div>
              </div>

              {/* Integrated Terminal Panel at Bottom */}
              <div className="h-36 bg-[#090d16] border-t border-slate-800 p-2.5 font-mono text-[11px] flex flex-col">
                <div className="flex items-center justify-between text-slate-400 mb-1.5 pb-1 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-500" /> PROBLEMS (1)
                    </span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1 ml-2">
                      <Terminal className="w-3 h-3" /> TERMINAL
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowFixedCode(!showFixedCode)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                    >
                      {showFixedCode ? 'Simulate Bug' : 'Apply Bug Fix'}
                    </button>
                    <span className="text-slate-500 text-[10px]">node v22.14.0</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {!showFixedCode ? (
                    <>
                      <div className="text-rose-400 font-semibold">
                        [ERROR] Failed to compile: TypeError: Cannot read properties of undefined (reading 'map')
                      </div>
                      <div className="text-slate-400">
                        &gt; 48 | &#123;products.map((item) =&gt; (
                      </div>
                      <div className="text-slate-500">
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;^^^^^^^^
                      </div>
                      <div className="text-slate-400">
                        at ProductList (client/src/components/ProductList.tsx:48:18)
                      </div>
                      <div className="text-emerald-400">
                        Vite: Ready in 214ms. Ready on http://localhost:5173
                      </div>
                    </>
                  ) : (
                    <div className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Compilation successful! Zero TypeScript errors detected in ProductList.tsx.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Port Crash Scenario */}
      {scenario === 'terminal_crash' && (
        <div className="flex-1 flex flex-col bg-[#090d16] p-4 font-mono text-xs overflow-y-auto">
          <div className="text-slate-400 mb-2"># Web Service Backend Startup Terminal</div>
          <div className="text-slate-300 flex items-center gap-1 mb-2">
            <span className="text-emerald-400">user@dev-workstation</span>:<span className="text-blue-400">~/projects/api-service</span>$ {terminalCommand}
          </div>
          <div className="text-slate-400">&gt; api-service@1.0.0 dev</div>
          <div className="text-slate-400">&gt; tsx watch src/server.ts</div>
          <br />
          <div className="text-cyan-400">[INFO] Initializing PostgreSQL connection pool... OK (poolSize: 10)</div>
          <div className="text-cyan-400">[INFO] Loading authentication middleware... OK</div>
          <div className="text-cyan-400">[INFO] Registering route: /api/v1/auth</div>
          <div className="text-cyan-400">[INFO] Registering route: /api/v1/users</div>
          <div className="text-cyan-400">[INFO] Registering route: /api/v1/reports</div>
          <br />
          <div className="p-3 bg-rose-950/40 border border-rose-500/60 rounded text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertTriangle className="w-4 h-4" /> Error: listen EADDRINUSE: address already in use :::3000
            </div>
            <div className="text-[11px] text-slate-300 pl-5">
              at Server.setupListenHandle [as _listen2] (node:net:1855:16)<br />
              at listenInCluster (node:net:1920:12)<br />
              at Server.listen (node:net:2008:7)<br />
              at startServer (/home/user/projects/api-service/src/server.ts:42:10)
            </div>
          </div>
          <br />
          <div className="text-slate-400 text-xs">
            Hint: Another service or orphaned Node process is already bound to port 3000.
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => {
                setTerminalCommand('lsof -i :3000 && kill -9 $(lsof -t -i:3000)');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs border border-slate-700"
            >
              Simulate Terminal Fix Command
            </button>
          </div>
        </div>
      )}

      {/* Cloud Kubernetes Crash Scenario */}
      {scenario === 'cloud_console' && (
        <div className="flex-1 flex flex-col bg-[#0b101b] p-4 text-xs overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" /> Kubernetes Production Workloads
              </h2>
              <p className="text-slate-400 text-[11px]">Namespace: production-east | Cluster: gke-prod-01</p>
            </div>
            <span className="px-2 py-1 rounded bg-rose-900/60 text-rose-300 border border-rose-700 text-[11px] font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Degraded: 1 Pod Crashing
            </span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">TOTAL PODS</div>
              <div className="text-lg font-bold text-white">8</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">HEALTHY</div>
              <div className="text-lg font-bold text-emerald-400">7</div>
            </div>
            <div className="p-2.5 rounded bg-rose-950/30 border border-rose-900/50">
              <div className="text-rose-400 text-[10px]">FAILED</div>
              <div className="text-lg font-bold text-rose-400">1</div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px]">RESTART COUNT</div>
              <div className="text-lg font-bold text-amber-400">14</div>
            </div>
          </div>

          {/* Pod Table */}
          <div className="mt-4 border border-slate-800 rounded overflow-hidden">
            <table className="w-full text-left font-mono text-[11px]">
              <thead className="bg-slate-900/80 text-slate-400">
                <tr>
                  <th className="p-2">POD NAME</th>
                  <th className="p-2">READY</th>
                  <th className="p-2">STATUS</th>
                  <th className="p-2">RESTARTS</th>
                  <th className="p-2">AGE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className="bg-rose-950/20 text-rose-200">
                  <td className="p-2 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                    payment-gateway-7b89f-2m4q
                  </td>
                  <td className="p-2 text-rose-300">0/1</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded bg-rose-900 text-rose-200 font-bold">
                      CrashLoopBackOff
                    </span>
                  </td>
                  <td className="p-2 text-amber-400 font-bold">14</td>
                  <td className="p-2 text-slate-400">42m</td>
                </tr>
                <tr className="text-slate-300">
                  <td className="p-2">auth-service-5c67d-9x8z</td>
                  <td className="p-2 text-emerald-400">1/1</td>
                  <td className="p-2 text-emerald-400">Running</td>
                  <td className="p-2 text-slate-400">0</td>
                  <td className="p-2 text-slate-400">3d</td>
                </tr>
                <tr className="text-slate-300">
                  <td className="p-2">frontend-app-8e12f-k19a</td>
                  <td className="p-2 text-emerald-400">1/1</td>
                  <td className="p-2 text-emerald-400">Running</td>
                  <td className="p-2 text-slate-400">0</td>
                  <td className="p-2 text-slate-400">3d</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Container Log Excerpt */}
          <div className="mt-3 bg-black/60 p-3 rounded border border-slate-800 font-mono text-[11px] text-slate-300">
            <div className="text-rose-400 font-bold mb-1">Last Container Exit Log:</div>
            <div className="text-rose-300">FATAL: Missing environment variable: STRIPE_SECRET_KEY</div>
            <div className="text-slate-400">at initStripeClient (/app/dist/stripe.js:14:11)</div>
            <div className="text-slate-400">Process exited with code 1. Backing off 1m20s...</div>
          </div>
        </div>
      )}

      {/* Blender 3D Viewport Scenario */}
      {scenario === 'blender_3d' && (
        <div className="flex-1 flex flex-col bg-[#1e1e1e] p-2 text-xs overflow-hidden">
          <div className="h-7 bg-[#282828] flex items-center justify-between px-2 text-slate-300 text-[11px]">
            <div className="flex items-center gap-3">
              <span className="font-bold text-orange-400">Blender 3D</span>
              <span className="hover:text-white cursor-pointer">Layout</span>
              <span className="hover:text-white cursor-pointer">Modeling</span>
              <span className="hover:text-white cursor-pointer">Sculpting</span>
              <span className="text-orange-400 font-bold bg-[#333] px-2 py-0.5 rounded">Shading</span>
              <span className="hover:text-white cursor-pointer">Rendering</span>
            </div>
            <div className="text-slate-400">Object Mode | Viewport Shading: Material Preview</div>
          </div>

          <div className="flex-1 flex gap-1 mt-1 overflow-hidden">
            {/* 3D Viewport with magenta shader missing color */}
            <div className="flex-1 bg-[#242424] rounded border border-slate-700/60 relative flex flex-col items-center justify-center p-4">
              <div className="w-48 h-48 rounded-full bg-fuchsia-600 shadow-[0_0_50px_rgba(217,70,239,0.5)] flex flex-col items-center justify-center text-center p-4 border-4 border-fuchsia-400">
                <AlertTriangle className="w-10 h-10 text-white mb-2 animate-bounce" />
                <span className="text-white font-bold text-sm">MISSING TEXTURE</span>
                <span className="text-fuchsia-100 text-[10px] mt-1">Shader Node Unlinked</span>
              </div>
              <div className="absolute top-3 left-3 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-slate-300">
                Camera: Perspective | Mesh: Cyber_Helmet_01 (48,200 Polygons)
              </div>
            </div>

            {/* Properties Inspector */}
            <div className="w-56 bg-[#2a2a2a] rounded border border-slate-700/60 p-2 text-[11px] font-mono space-y-2">
              <div className="text-slate-300 font-bold border-b border-slate-700 pb-1">Material Properties</div>
              <div className="p-1.5 bg-[#1f1f1f] rounded border border-rose-500/50 text-rose-300">
                <div className="font-bold">Base Color</div>
                <div className="text-[10px] text-rose-400">Texture: helmet_diffuse.png [File Not Found]</div>
              </div>
              <div className="p-1.5 bg-[#1f1f1f] rounded text-slate-400">
                <div>Roughness: 0.25</div>
                <div>Metallic: 0.85</div>
                <div>Normals: Recalculate Outside required</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
