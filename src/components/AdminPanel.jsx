import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Cpu, Activity, Play, Square, Zap, RefreshCw, 
  Sliders, Shield, Layers, Gauge, Database, ArrowRight, CheckCircle2,
  AlertCircle, ChevronRight, Terminal, BarChart3, Settings2, Box, ArrowUpRight
} from 'lucide-react';

export default function AdminPanel({ onBackToStudio, gpuStatus }) {
  // Autoscaling configuration state
  const [minReplicas, setMinReplicas] = useState(2);
  const [maxReplicas, setMaxReplicas] = useState(16);
  const [targetGpuUtil, setTargetGpuUtil] = useState(75);
  const [scaleUpThresholdRps, setScaleUpThresholdRps] = useState(50);
  const [precisionMode, setPrecisionMode] = useState('fp16');
  const [activePipeline, setActivePipeline] = useState('gemma4:latest');
  const [batchSize, setBatchSize] = useState(8);

  // Traffic Load Generator state
  const [isLoadTesting, setIsLoadTesting] = useState(false);
  const [targetRps, setTargetRps] = useState(60);
  const [concurrencyWorkers, setConcurrencyWorkers] = useState(16);
  const [trafficPattern, setTrafficPattern] = useState('burst');
  const [payloadType, setPayloadType] = useState('invoice');

  // Live telemetry state
  const [activePods, setActivePods] = useState(2);
  const [currentRps, setCurrentRps] = useState(0);
  const [totalRequestsSent, setTotalRequestsSent] = useState(14820);
  const [avgLatencyMs, setAvgLatencyMs] = useState(18);
  const [queueDepth, setQueueDepth] = useState(0);
  const [gpuMemoryUsedGb, setGpuMemoryUsedGb] = useState(4.2);
  const [gpuComputeUtil, setGpuComputeUtil] = useState(12);
  const [logs, setLogs] = useState([
    { id: 1, time: '11:42:01', level: 'INFO', msg: 'KEDA v2.14 scaler initialized on cluster k8s-us-east-gpu-prod.' },
    { id: 2, time: '11:42:15', level: 'INFO', msg: 'Node rtx5090 verified: NVIDIA GeForce RTX 5090 (32,607 MiB VRAM, CUDA 13.0).' },
    { id: 3, time: '11:42:30', level: 'SYSTEM', msg: 'PaddleOCR-VL-1.6 (0.9B) and PP-OCRv6 models mapped from high-IOPS shared volume.' },
    { id: 4, time: '11:43:00', level: 'SUCCESS', msg: 'Horizontal Pod Autoscaler (HPA v2) active: 2 standby worker pods running.' }
  ]);

  const intervalRef = useRef(null);

  // Load testing simulation loop
  useEffect(() => {
    if (isLoadTesting) {
      intervalRef.current = setInterval(() => {
        // Compute fluctuating traffic based on pattern
        let rps = targetRps;
        if (trafficPattern === 'burst') {
          rps = Math.floor(targetRps * (0.8 + Math.random() * 0.5));
        } else if (trafficPattern === 'ramp') {
          rps = Math.min(targetRps * 1.5, rps + 5);
        }

        setCurrentRps(rps);
        setTotalRequestsSent(prev => prev + rps);
        
        // Calculate required pods to handle current RPS based on capacity (~25 RPS per pod)
        const capacityPerPod = 25;
        const requiredPods = Math.min(maxReplicas, Math.max(minReplicas, Math.ceil(rps / capacityPerPod)));
        
        // Simulate autoscaling pod changes
        setActivePods(prev => {
          if (prev < requiredPods) {
            const nextPods = Math.min(maxReplicas, prev + 1);
            addLog('SCALE_UP', `[AUTOSCALER] Target threshold exceeded (${Math.floor(rps * 1.2)}% > ${targetGpuUtil}%). Scaling pods: ${prev} -> ${nextPods}`);
            return nextPods;
          } else if (prev > requiredPods && Math.random() > 0.6) {
            const nextPods = Math.max(minReplicas, prev - 1);
            addLog('SCALE_DOWN', `[AUTOSCALER] Traffic normalized. Gracefully terminating idle worker: ${prev} -> ${nextPods}`);
            return nextPods;
          }
          return prev;
        });

        // Compute GPU metrics
        const loadRatio = Math.min(1, rps / (maxReplicas * capacityPerPod));
        setGpuComputeUtil(Math.floor(25 + loadRatio * 65));
        setGpuMemoryUsedGb(Number((4.2 + requiredPods * 1.45).toFixed(1)));
        setAvgLatencyMs(Math.floor(12 + (rps / requiredPods) * 0.35 + Math.random() * 6));
        setQueueDepth(Math.max(0, Math.floor((rps - requiredPods * capacityPerPod) * 0.4)));

      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      setCurrentRps(0);
      setQueueDepth(0);
      setGpuComputeUtil(12);
      // Graceful scale down to minReplicas
      const scaleDownTimer = setTimeout(() => {
        setActivePods(minReplicas);
        setGpuMemoryUsedGb(Number((4.2 + minReplicas * 1.45).toFixed(1)));
        setAvgLatencyMs(18);
      }, 1500);
      return () => clearTimeout(scaleDownTimer);
    }

    return () => clearInterval(intervalRef.current);
  }, [isLoadTesting, targetRps, minReplicas, maxReplicas, targetGpuUtil, trafficPattern]);

  const addLog = (level, msg) => {
    const time = new Date().toTimeString().split(' ')[0];
    setLogs(prev => [
      ...prev.slice(-25),
      { id: Date.now() + Math.random(), time, level, msg }
    ]);
  };

  const handleBurstSurge = () => {
    addLog('BURST', `[TRAFFIC-GENERATOR] Instant 100x Burst surge triggered: Dispatched 120 concurrent document batches!`);
    setCurrentRps(prev => prev + 150);
    setQueueDepth(48);
    setActivePods(prev => Math.min(maxReplicas, prev + 3));
    setGpuComputeUtil(94);
  };

  const handleFlushCache = () => {
    addLog('SYSTEM', '[STORAGE] Shared NVMe model volume cache flushed and re-indexed. 0 corrupted weights.');
  };

  const handleForceScale = (count) => {
    setActivePods(count);
    addLog('MANUAL', `[ADMIN] Manual override: Forcibly scaled active worker pool to ${count} replicas.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-24">
      {/* Admin Top Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToStudio}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-indigo-300 border border-slate-700 flex items-center space-x-1.5 transition-all"
          >
            <span>← Return to OCR Studio</span>
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="flex items-center space-x-2">
            <Settings2 className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-bold text-slate-100">Cluster Control Plane & Autoscaling Engine</span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              k8s-us-east-gpu-prod
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>KEDA HPA Active ({activePods} Pods)</span>
          </div>
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 font-mono border border-slate-700">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span>RTX 5090 (32GB)</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 w-full space-y-6">
        {/* KPI Header Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Active Worker Pods</div>
            <div className="text-2xl font-black text-slate-100 mt-1 flex items-baseline space-x-2">
              <span>{activePods}</span>
              <span className="text-xs font-normal text-slate-500">/ {maxReplicas} max</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1 flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Healthy & Replicated</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Simulated Traffic</div>
            <div className="text-2xl font-black text-indigo-400 mt-1 flex items-baseline space-x-1">
              <span>{currentRps}</span>
              <span className="text-xs font-normal text-slate-400">RPS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {isLoadTesting ? '⚡ Traffic test running' : 'Idle / Standby'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">P95 Inference Latency</div>
            <div className="text-2xl font-black text-slate-100 mt-1 flex items-baseline space-x-1">
              <span>{avgLatencyMs}</span>
              <span className="text-xs font-normal text-slate-500">ms</span>
            </div>
            <div className="text-[10px] text-emerald-400 mt-1">Sub-second layout parsing</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">GPU VRAM Allocated</div>
            <div className="text-2xl font-black text-purple-400 mt-1 flex items-baseline space-x-1">
              <span>{gpuMemoryUsedGb}</span>
              <span className="text-xs font-normal text-slate-500">/ 32.6 GB</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Blackwell SM_120 shared</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Queue Depth</div>
            <div className="text-2xl font-black text-amber-400 mt-1 flex items-baseline space-x-1">
              <span>{queueDepth}</span>
              <span className="text-xs font-normal text-slate-500">msgs</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {queueDepth > 0 ? 'Scale-out active' : 'Zero backlog'}
            </div>
          </div>
        </div>

        {/* Two-Column Core Layout: Autoscaling Controller + Traffic Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Fake Request Generator & Autoscaling Simulator (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Load Test Card */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-100">Fake Request Generator & Autoscaler Load Tester</h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  Stress & Burst Engine
                </span>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Target Request Rate (RPS):</span>
                    <span className="font-mono font-bold text-indigo-400">{targetRps} RPS</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="300" 
                    step="5"
                    value={targetRps}
                    onChange={(e) => setTargetRps(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>10 RPS</span>
                    <span>150 RPS</span>
                    <span>300 RPS</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Virtual Client Workers:</span>
                    <span className="font-mono font-bold text-indigo-400">{concurrencyWorkers} Threads</span>
                  </div>
                  <input 
                    type="range" 
                    min="4" 
                    max="64" 
                    step="4"
                    value={concurrencyWorkers}
                    onChange={(e) => setConcurrencyWorkers(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>4 Concurrency</span>
                    <span>32</span>
                    <span>64 Max</span>
                  </div>
                </div>
              </div>

              {/* Pattern & Payload Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Traffic Wave Pattern</label>
                  <select 
                    value={trafficPattern}
                    onChange={(e) => setTrafficPattern(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="burst">Spike / Burst Wave (Surges 150%)</option>
                    <option value="constant">Constant Steady State Load</option>
                    <option value="ramp">Linear Step-Up Ramp</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Simulated Document Payload</label>
                  <select 
                    value={payloadType}
                    onChange={(e) => setPayloadType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="invoice">Commercial Invoice (420 KB PNG)</option>
                    <option value="pdf">Multi-page PDF Document (2.4 MB)</option>
                    <option value="dense">Dense Tabular Financial Statement (1.1 MB)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={() => setIsLoadTesting(!isLoadTesting)}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
                    isLoadTesting 
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-indigo-500/20'
                  }`}
                >
                  {isLoadTesting ? <Square className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
                  <span>{isLoadTesting ? 'Stop Traffic Generator' : 'Launch Traffic Load Test'}</span>
                </button>

                <button
                  onClick={handleBurstSurge}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-amber-300 flex items-center space-x-1.5 transition-all"
                >
                  <Zap className="h-4 w-4 text-amber-400" />
                  <span>Trigger Instant 100x Burst</span>
                </button>
              </div>
            </div>

            {/* Live Visual Kubernetes Pod Cluster Grid */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Box className="h-5 w-5 text-purple-400" />
                  <h3 className="text-sm font-bold text-slate-100">Active Worker Pods & Node Distribution</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={() => handleForceScale(2)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                  >
                    Scale to 2
                  </button>
                  <button 
                    onClick={() => handleForceScale(8)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                  >
                    Scale to 8
                  </button>
                  <button 
                    onClick={() => handleForceScale(16)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 border border-slate-700"
                  >
                    Scale to 16
                  </button>
                </div>
              </div>

              {/* Grid of Pods */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: maxReplicas }).map((_, idx) => {
                  const isRunning = idx < activePods;
                  const isRecent = idx === activePods - 1 && isLoadTesting;
                  return (
                    <div 
                      key={idx}
                      className={`p-3 rounded-xl border transition-all duration-300 ${
                        isRunning 
                          ? isRecent
                            ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200 animate-pulse'
                            : 'bg-slate-800/60 border-slate-700/80 text-slate-200'
                          : 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold">
                          pod-{(idx + 1).toString().padStart(2, '0')}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                      </div>
                      <div className="text-[9px] font-mono mt-2 flex items-center justify-between">
                        <span>{isRunning ? 'RUNNING' : 'OFFLINE'}</span>
                        <span>{isRunning ? `${(1.45).toFixed(1)}GB` : '-'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Complete Pipeline Controls + Real-Time Telemetry Logs (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Cluster & Engine Controls Card */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <Sliders className="h-5 w-5 text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-100">Autoscaler & Pipeline Parameters</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Live Control
                </span>
              </div>

              {/* Parameters List */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Min / Max Replicas:</span>
                    <span className="font-mono text-indigo-400 font-bold">{minReplicas} Min / {maxReplicas} Max</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="range" min="1" max="5" value={minReplicas}
                      onChange={(e) => setMinReplicas(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500"
                    />
                    <input 
                      type="range" min="6" max="32" value={maxReplicas}
                      onChange={(e) => setMaxReplicas(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Target GPU Utilization Threshold:</span>
                    <span className="font-mono text-indigo-400 font-bold">{targetGpuUtil}%</span>
                  </div>
                  <input 
                    type="range" min="50" max="95" step="5" value={targetGpuUtil}
                    onChange={(e) => setTargetGpuUtil(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg accent-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Active Model Engine</label>
                  <select 
                    value={activePipeline}
                    onChange={(e) => {
                      setActivePipeline(e.target.value);
                      addLog('CONFIG', `Active localOCR Engine switched to: ${e.target.value}`);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="gemma4:latest">Gemma 4 Vision (Curiosity localOCR SOTA)</option>
                    <option value="gemma3:12b">Gemma 3 12B Vision (Multimodal Layout)</option>
                    <option value="llama3.2-vision">Llama 3.2 Vision (11B Meta)</option>
                    <option value="granite3.2-vision">IBM Granite 3.2 Vision (Compact Fast)</option>
                    <option value="deepseek-ocr:latest">DeepSeek-OCR Vision</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1">Precision</label>
                    <select 
                      value={precisionMode}
                      onChange={(e) => setPrecisionMode(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="fp16">FP16 (TensorRT)</option>
                      <option value="bf16">BF16 Native</option>
                      <option value="fp32">FP32 Full</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1">Batch Size</label>
                    <select 
                      value={batchSize}
                      onChange={(e) => setBatchSize(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="4">4 Docs / Batch</option>
                      <option value="8">8 Docs / Batch</option>
                      <option value="16">16 Docs / Batch</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 flex items-center space-x-2">
                  <button 
                    onClick={handleFlushCache}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 border border-slate-700 transition-colors flex items-center justify-center space-x-1"
                  >
                    <Database className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Flush Model Cache</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Event Stream / Cluster Terminal */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center space-x-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Live Autoscaler Event Stream</h3>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              </div>

              <div className="h-56 overflow-auto rounded-xl bg-slate-950/90 border border-slate-800/80 p-3 font-mono text-[10px] space-y-1.5 leading-relaxed">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-2">
                    <span className="text-slate-500 flex-shrink-0">[{log.time}]</span>
                    <span className={`px-1 rounded text-[9px] font-bold flex-shrink-0 ${
                      log.level === 'SCALE_UP' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      log.level === 'SCALE_DOWN' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      log.level === 'BURST' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      log.level === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 break-words">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
