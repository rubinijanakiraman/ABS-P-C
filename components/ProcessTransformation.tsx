
import React from 'react';
import { AnalysisResult } from '../types';

interface ProcessTransformationProps {
  result: AnalysisResult;
  onClose: () => void;
}

const ProcessTransformation: React.FC<ProcessTransformationProps> = ({ result, onClose }) => {
  return (
    <div className="max-w-7xl mx-auto p-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
          <span className="w-12 h-[3px] bg-primary rounded-full"></span>
          Process Transformation Roadmap
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
        >
          <span className="material-icons-round text-2xl">close</span>
        </button>
      </div>

      <div className="mb-12 pb-12 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-4xl font-black text-slate-950 dark:text-white mb-6 leading-tight tracking-tight">
          {result.process_classification.l3}
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <span className="px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
            L1: {result.process_classification.l1}
          </span>
          <span className="px-5 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">
            L2: {result.process_classification.l2}
          </span>
          <span className="px-5 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-black text-emerald-600 border border-emerald-100 dark:border-emerald-900/20 uppercase tracking-[0.2em]">
            Strategic Priority: High
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Current State */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
              <span className="material-icons-round">history</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Current State</h3>
          </div>
          
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-xl">
            <ul className="space-y-6">
              {result.process_transformation?.current_state?.map((step, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="shrink-0 w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 leading-relaxed pt-1.5">
                    {step}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Future State */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <span className="material-icons-round">auto_awesome</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Agentic Led Future State</h3>
          </div>
          
          <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <ul className="space-y-6 relative z-10">
              {result.process_transformation?.agentic_led_future_state?.map((step, i) => (
                <li key={i} className="flex gap-4 group">
                  <div className="shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <span className="material-icons-round text-sm">check_circle</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed pt-1.5">
                    {step}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessTransformation;
