
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TransformationResult, AgentFlowStep } from '../services/geminiService';
import { AnalysisResult } from '../types';

type TabType = 'value' | 'process' | 'agentic' | 'data' | 'work';

const TaskBarPair = ({ current, future, delay }: { current: number; future: number; delay: number }) => {
  const diff = future - current;
  const arrowIcon = diff > 0 ? 'north' : diff < 0 ? 'south' : 'remove';
  const arrowColor = diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-primary' : 'text-slate-400';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 grid grid-cols-2 gap-3">
        <div className="relative h-6 bg-slate-500 dark:bg-slate-800 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700">
          <div 
            className="absolute inset-y-0 left-0 bg-[#F59E0B] transition-all duration-1000 ease-out"
            style={{ width: `${current}%`, transitionDelay: `${delay}ms` }}
          />
          <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-black text-white z-10 drop-shadow-sm">
            {current}%
          </span>
        </div>
        <div className="relative h-6 bg-slate-500 dark:bg-slate-800 rounded-md overflow-hidden border border-slate-300 dark:border-slate-700">
          <div 
            className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${future}%`, transitionDelay: `${delay + 200}ms` }}
          />
          <span className="absolute inset-0 flex items-center pl-2 text-[10px] font-black text-white z-10 drop-shadow-sm">
            {future}%
          </span>
        </div>
      </div>
      <span className={`material-icons-round text-sm font-bold ${arrowColor}`}>
        {arrowIcon}
      </span>
    </div>
  );
};

const FlowPath: React.FC<{ x1: number; y1: number; x2: number; y2: number; color: string; delay?: number }> = ({ x1, y1, x2, y2, color, delay = 0 }) => {
  const midX = (x1 + x2) / 2;
  const midY = ((y1 + y2) / 2) - 3; 
  const path = `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;

  return (
    <g className="animate-in fade-in duration-500">
      <path 
        d={path} 
        fill="none" 
        stroke={color} 
        strokeWidth="0.5" 
        strokeLinecap="round"
        strokeDasharray="2 4"
        className="opacity-30"
      >
        <animate attributeName="stroke-dashoffset" from="32" to="0" dur="5s" repeatCount="indefinite" />
      </path>

      <circle r="1.2" fill={color} className="shadow-sm">
        <animateMotion path={path} dur="2s" repeatCount="indefinite" rotate="auto" begin={`${delay}s`} />
      </circle>
    </g>
  );
};

const LayerCurve: React.FC<{ rx: number; ry: number; cy: number; color: string; count: number }> = ({ rx, ry, cy, color, count }) => {
  if (count <= 1) return null;
  const startX = 50 - rx;
  const endX = 50 + rx;
  const path = `M ${startX} ${cy} A ${rx} ${ry} 0 0 0 ${endX} ${cy}`;
  
  return (
    <path 
      d={path} 
      fill="none" 
      stroke={color} 
      strokeWidth="0.3" 
      strokeDasharray="1 5"
      className="opacity-10 dark:opacity-10 transition-all duration-1000"
    />
  );
};

const WorkflowConnector: React.FC<{ 
  mode: 'many-to-one' | 'one-to-many', 
  sourceCount: number, 
  targetCount: number,
  color?: string 
}> = ({ mode, sourceCount, targetCount, color = "#7A21B5" }) => {
  const paths = useMemo(() => {
    const p: string[] = [];
    const sourcePoints = Array.from({ length: sourceCount }, (_, i) => (i + 0.5) * (100 / sourceCount));
    const targetPoints = Array.from({ length: targetCount }, (_, i) => (i + 0.5) * (100 / targetCount));
    
    const hubIndex = Math.floor(targetCount / 2);
    const hubSourceIndex = Math.floor(sourceCount / 2);

    if (mode === 'many-to-one') {
      const targetY = targetPoints[hubIndex];
      sourcePoints.forEach(srcY => {
        p.push(`M 0 ${srcY} L 100 ${targetY}`);
      });
    } else {
      const srcY = sourcePoints[hubSourceIndex];
      targetPoints.forEach(trgY => {
        p.push(`M 0 ${srcY} L 100 ${trgY}`);
      });
    }
    return p;
  }, [mode, sourceCount, targetCount]);

  return (
    <div className="w-16 sm:w-24 shrink-0 h-full relative">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        {paths.map((d, i) => (
          <g key={i}>
            <path 
              d={d} 
              fill="none" 
              stroke={color} 
              strokeWidth="1.5" 
              strokeOpacity="0.25" 
              strokeLinecap="round" 
            />
            <circle r="1.5" fill={color} className="shadow-sm">
              <animateMotion path={d} dur={`${1.5 + Math.random() * 1.5}s`} repeatCount="indefinite" begin={`${i * 0.1}s`} />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
};

const TransformationContent: React.FC<{ data: TransformationResult, analysisResult?: AnalysisResult | null }> = ({ data, analysisResult }) => {
  const [activeTab, setActiveTab] = useState<TabType>('value');
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activePaths, setActivePaths] = useState<{ x1: number, y1: number, x2: number, y2: number, color: string, delay: number }[]>([]);
  const [logs, setLogs] = useState<{ msg: string; agent: string; id: number; color?: string }[]>([]);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Always land on tab1 (Value Creation) when new transformation data or analysis loads
  useEffect(() => {
    setActiveTab('value');
  }, [data]);

  const superArc = { rx: 32, ry: 10, cy: 35 };
  const utilityArc = { rx: 46, ry: 38, cy: 58 };

  const nodes = useMemo(() => {
    const n: any[] = [];
    const orchestrators = data?.agenticSolution?.orchestratorAgents || [];
    const supers = data?.agenticSolution?.superAgents || [];
    const utilities = (data?.agenticSolution?.utilityAgents || []).slice(0, 9);

    const superIcons = ['military_tech', 'admin_panel_settings', 'workspace_premium', 'security', 'architecture', 'verified_user', 'shield'];
    const utilityIcons = [
      'terminal', 'data_object', 'search', 'description', 'analytics', 
      'payments', 'grading', 'inventory', 'history_edu', 'settings_ethernet', 
      'cloud_sync', 'query_stats', 'rule', 'calculate', 'troubleshoot', 'monitoring', 'sync_alt'
    ];

    const primaryPersona = data?.workTransformation?.personas?.[0]?.role || "Associate";
    // Human color set to darker slate for better contrast
    n.push({ id: 'human', label: `${primaryPersona} (Human)`, x: 12, y: 15, type: 'human', icon: 'person_outline', color: '#334155' });
    
    const orchestratorLabel = orchestrators[0] || "Pipeline Orchestrator";
    n.push({ id: `orch-primary`, label: `${orchestratorLabel} (Co)`, x: 50, y: 12, type: 'orch', icon: 'psychology', color: '#6366f1' });

    supers.forEach((label, i) => {
      const angle = supers.length > 1 ? (i * Math.PI) / (supers.length - 1) : Math.PI / 2;
      const x = 50 + superArc.rx * Math.cos(Math.PI + angle); 
      const y = superArc.cy + superArc.ry * Math.sin(angle); 
      n.push({ 
        id: `super-${i}`, 
        label, x, y, 
        type: 'super', 
        icon: superIcons[i % superIcons.length], 
        color: '#7c3aed' 
      });
    });

    utilities.forEach((label, i) => {
      const angle = utilities.length > 1 ? (i * Math.PI) / (utilities.length - 1) : Math.PI / 2;
      const x = 50 + utilityArc.rx * Math.cos(Math.PI + angle);
      const y = utilityArc.cy + utilityArc.ry * Math.sin(angle);
      n.push({ 
        id: `util-${i}`, 
        label, x, y, 
        type: 'utility', 
        icon: utilityIcons[i % utilityIcons.length], 
        color: '#0ea5e9' 
      });
    });

    return n;
  }, [data]);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTo({ top: logContainerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  const startFlow = () => {
    if (!data?.agenticSolution?.steps?.length) return;
    setIsPlaying(true);
    setLogs([]);
    setActivePaths([]);
    
    let index = 0;
    let lastSuperId: string | null = null;
    const steps = data.agenticSolution.steps;
    const orchestratorNode = nodes.find(n => n.type === 'orch');
    const superNodes = nodes.filter(n => n.type === 'super');
    const utilityNodes = nodes.filter(n => n.type === 'utility');
    
    const runStep = () => {
      if (index >= steps.length) {
        setIsPlaying(false);
        setActiveNodeId(null);
        setActivePaths([]);
        return;
      }

      const step = steps[index];
      const type = (step.agentType || 'utility').toLowerCase();
      
      let targetNode = nodes.find(n => n.label.toLowerCase().includes(step.title.toLowerCase()));
      if (!targetNode) {
        if (type.includes('orch')) targetNode = orchestratorNode;
        else if (type === 'super') targetNode = superNodes[index % Math.max(1, superNodes.length)];
        else targetNode = utilityNodes[index % Math.max(1, utilityNodes.length)];
      }

      if (!targetNode) targetNode = nodes[0];

      const paths: any[] = [];
      const currentTargetColor = targetNode.color || '#7c3aed';

      if (targetNode.type === 'utility') {
        const currentSuper = superNodes[index % Math.max(1, superNodes.length)];
        if (orchestratorNode && currentSuper) {
          if (currentSuper.id !== lastSuperId) {
            paths.push({ x1: orchestratorNode.x, y1: orchestratorNode.y, x2: currentSuper.x, y2: currentSuper.y, color: currentSuper.color, delay: 0 });
            paths.push({ x1: currentSuper.x, y1: currentSuper.y, x2: targetNode.x, y2: targetNode.y, color: currentTargetColor, delay: 1.0 });
            lastSuperId = currentSuper.id;
          } else {
            paths.push({ x1: currentSuper.x, y1: currentSuper.y, x2: targetNode.x, y2: targetNode.y, color: currentTargetColor, delay: 0 });
          }
        }
      } else if (targetNode.type === 'super') {
        if (orchestratorNode) {
          paths.push({ x1: orchestratorNode.x, y1: orchestratorNode.y, x2: targetNode.x, y2: targetNode.y, color: currentTargetColor, delay: 0 });
          lastSuperId = targetNode.id;
        }
      }

      setActiveNodeId(targetNode.id);
      setActivePaths(paths);
      setLogs(prev => [...prev, { msg: step.description, agent: step.title, id: Date.now() + index, color: currentTargetColor }]);

      index++;
      setTimeout(runStep, 3500);
    };

    runStep();
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'value', label: 'Value Creation', icon: 'trending_up' },
    { id: 'process', label: 'Process Transformation', icon: 'swap_horiz' },
    { id: 'agentic', label: 'Agentic Blitz', icon: 'smart_toy' },
    { id: 'data', label: 'Data Products', icon: 'hub' },
    { id: 'work', label: 'Work Transformation', icon: 'people' },
  ];

  const solutionElements = data?.dataProducts?.elements || data?.dataProducts?.products?.slice(0, 3) || [];

  // Use analysis result if available for process tab
  const currentProcessSteps = analysisResult?.process_transformation?.current_state || data.process.current;
  const futureProcessSteps = analysisResult?.process_transformation?.agentic_led_future_state || data.process.future;

  return (
    <div className="space-y-4 pb-4">
      <nav className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-[11px] font-bold transition-all duration-300 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-800 text-primary shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <span className="material-icons-round text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="min-h-[220px] animate-in fade-in duration-300">
        {activeTab === 'value' && (
          <section className="space-y-4">
            <div className="space-y-2.5 bg-white dark:bg-slate-900/60 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              {data?.value?.summary?.split('.').filter(s => s.trim().length > 0).map((sentence, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="text-primary mt-1 text-sm">•</span>
                  <p className="text-sm md:text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{sentence.trim()}.</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(data?.value?.highlights || []).map((h, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs transition-all hover:shadow-sm group">
                  <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 bg-primary/10`}>
                    <span className={`material-icons-round text-xl text-primary`}>analytics</span>
                  </div>
                  <div><p className="text-xs font-bold text-slate-800 dark:text-slate-100">{h.label} <span className={`text-primary font-black ml-1`}>{h.value}</span></p></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'process' && (
          <section className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 rounded-[1.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-3">Current State</h4>
                <ul className="space-y-2">
                  {currentProcessSteps.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[12px] text-slate-600 dark:text-slate-400 font-medium leading-tight">
                      <span className="material-icons-round text-slate-300 text-sm">remove_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-4 rounded-[1.5rem] bg-white dark:bg-slate-900 border-2 border-primary/10 shadow-lg">
                <h4 className="text-[9px] font-black uppercase tracking-widest text-primary mb-3">Agentic led Future State</h4>
                <ul className="space-y-2">
                  {futureProcessSteps.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[12px] text-slate-900 dark:text-white font-bold leading-tight">
                      <span className="material-icons-round text-primary text-sm">check_circle</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'agentic' && (
          <section className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row gap-4 h-[550px]">
              <div className="flex-[4] bg-white dark:bg-slate-900/50 rounded-[2rem] border-[4px] border-slate-100 dark:border-slate-800 relative overflow-hidden shadow-lg">
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <LayerCurve rx={superArc.rx} ry={superArc.ry} cy={superArc.cy} color="#7c3aed" count={data?.agenticSolution?.superAgents?.length || 0} />
                  <LayerCurve rx={utilityArc.rx} ry={utilityArc.ry} cy={utilityArc.cy} color="#3b82f6" count={nodes.filter(n => n.type === 'utility').length} />
                  {isPlaying && activePaths.map((p, idx) => <FlowPath key={idx} {...p} />)}
                </svg>
                
                {nodes.map((node) => {
                  const isActive = activeNodeId === node.id;
                  const isPartOfFlow = activePaths.some(p => (p.x1 === node.x && p.y1 === node.y) || (p.x2 === node.x && p.y2 === node.y));
                  return (
                    <div 
                      key={node.id} 
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-30 transition-all duration-700"
                      style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    >
                      <div className={`
                        relative flex items-center justify-center rounded-full transition-all duration-500 border-2
                        ${node.type === 'human' ? 'w-9 h-9 border-slate-400' : node.type === 'orch' ? 'w-10 h-10' : 'w-8 h-8'}
                        ${isActive ? 'bg-white border-primary scale-110 shadow-lg' : isPartOfFlow ? 'bg-white border-primary/40' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}
                      `}>
                        <span className={`material-icons-round ${node.type === 'human' ? 'text-lg text-slate-700 dark:text-slate-200' : isActive || isPartOfFlow ? 'text-white' : 'text-slate-300'}`}
                          style={{ fontSize: node.type === 'orch' ? '18px' : '14px', color: !isActive && !isPartOfFlow && node.type !== 'human' ? node.color : undefined }}>
                          {node.icon}
                        </span>
                        {(isActive || isPartOfFlow) && node.type !== 'human' && (
                          <div className="absolute inset-0 rounded-full -z-10 transition-colors duration-500" style={{ backgroundColor: node.color }} />
                        )}
                        {isActive && <div className="absolute inset-[-4px] border border-primary/40 rounded-full animate-ping" />}
                      </div>
                      
                      <div className="text-center max-w-[55px] flex flex-col items-center">
                        <p className={`text-[6px] sm:text-[7px] font-black uppercase tracking-tight leading-[1] break-words transition-all px-1 py-0.5 rounded-md ${isActive ? 'text-primary bg-primary/5' : 'text-slate-500'}`}>
                          {node.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex-[1.5] bg-white dark:bg-slate-900/50 rounded-[2rem] border-[4px] border-slate-100 dark:border-slate-800 shadow-lg flex flex-col overflow-hidden">
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between gap-3">
                  <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Agentic Blitz</h4>
                  <button onClick={startFlow} disabled={isPlaying} className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-lg transition-all ${isPlaying ? 'bg-slate-100 text-slate-400' : 'bg-primary text-white shadow-lg hover:scale-105 active:scale-95'}`}>
                    <span className={`material-icons-round text-base ${isPlaying ? 'animate-spin' : ''}`}>{isPlaying ? 'sync' : 'play_arrow'}</span>
                  </button>
                </div>
                <div ref={logContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                      <span className="material-icons-round text-3xl mb-2">radar</span>
                      <p className="text-[8px] font-black uppercase tracking-[0.4em]">Listening</p>
                    </div>
                  ) : logs.map((log) => (
                    <div key={log.id} className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: log.color }} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-900 dark:text-white/90 truncate">{log.agent}</span>
                      </div>
                      <div className="pl-2 border-l border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed bg-slate-50 dark:bg-white/5 p-2 rounded-lg shadow-sm">{log.msg}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'data' && (
          <section className="animate-in fade-in duration-500 py-10 relative h-[450px] overflow-hidden flex flex-col justify-center">
            <div className="max-w-7xl mx-auto flex items-stretch justify-center h-full relative z-20 gap-0">
               <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="w-full h-full p-6 rounded-[2.5rem] bg-slate-100/60 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h4 className="text-center font-black text-slate-800 dark:text-slate-100 text-[10px] mb-6 uppercase tracking-[0.2em]">Integration Endpoints</h4>
                    <div className="flex flex-col justify-start gap-3 flex-1">
                      {data.dataProducts.apps.map((app, i) => (
                        <div key={i} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-center text-[10px] font-bold shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex items-center justify-center transition-all hover:scale-[1.03] hover:shadow-md">{app}</div>
                      ))}
                    </div>
                 </div>
               </div>
               
               <WorkflowConnector 
                 mode="many-to-one" 
                 sourceCount={data.dataProducts.apps.length} 
                 targetCount={solutionElements.length} 
                 color="#7A21B5"
               />

               <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="w-full h-full p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border-2 border-primary/20 shadow-xl flex flex-col">
                    <h4 className="text-center font-black text-primary text-[10px] mb-6 uppercase tracking-[0.2em]">Solution Elements</h4>
                    <div className="flex flex-col justify-start gap-3 flex-1">
                      {solutionElements.map((item, i) => (
                        <div 
                          key={i} 
                          className="px-4 py-2 rounded-xl text-center text-[10px] font-black shadow-sm flex-1 flex items-center justify-center transition-all hover:scale-[1.03] bg-slate-50 dark:bg-slate-800 border border-primary/10 border-l-4 border-l-primary"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                 </div>
               </div>

               <WorkflowConnector 
                 mode="one-to-many" 
                 sourceCount={solutionElements.length} 
                 targetCount={data.dataProducts.products.length} 
                 color="#6366f1"
               />

               <div className="flex-1 flex flex-col items-center justify-center">
                 <div className="w-full h-full p-6 rounded-[2.5rem] bg-slate-100/60 dark:bg-slate-900/60 border-2 border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                    <h4 className="text-center font-black text-slate-800 dark:text-slate-100 text-[10px] mb-6 uppercase tracking-[0.2em]">Data Products</h4>
                    <div className="flex flex-col justify-start gap-3 flex-1">
                      {data.dataProducts.products.map((prod, i) => (
                        <div key={i} className="px-4 py-2 bg-white dark:bg-slate-800 rounded-xl text-center text-[10px] font-bold shadow-sm border border-slate-100 dark:border-slate-700 flex-1 flex items-center justify-center border-l-4 border-l-indigo-500/50 transition-all hover:scale-[1.03]">{prod}</div>
                      ))}
                    </div>
                 </div>
               </div>
            </div>
          </section>
        )}

        {activeTab === 'work' && (
          <section className="space-y-6 animate-in fade-in duration-500 pb-10">
             <div className="flex justify-end gap-10 pr-4">
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded bg-[#F59E0B]"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Current Focus</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded bg-primary"></div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Future Focus</span>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(data?.workTransformation?.personas || []).map((persona, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] overflow-hidden shadow-sm transition-all hover:shadow-lg">
                  <div className="p-4 bg-[#F1F5F9]/50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 shadow-sm">
                      <span className="material-icons-round text-lg">person</span>
                    </div>
                    <h4 className="text-base font-black text-slate-800 dark:text-white tracking-tight leading-none">{persona.role}</h4>
                  </div>
                  <div className="p-6 space-y-6">
                    {persona.tasks.map((task, j) => (
                      <div key={j} className="space-y-2.5">
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-tight">{task.name}</p>
                        <TaskBarPair current={task.current} future={task.future} delay={j * 100} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default TransformationContent;
