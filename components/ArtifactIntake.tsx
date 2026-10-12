
import React from 'react';
import { ArtifactDocument } from '../types';

interface ArtifactIntakeProps {
  documents: ArtifactDocument[];
  onAnalyze: (doc: ArtifactDocument) => void;
  onClose: () => void;
  onClearAll: () => void;
  onAddMore: () => void;
  onCancelAnalysis: () => void;
  isAnalyzing: boolean;
  analyzingDocId: string | null;
}

const ArtifactIntake: React.FC<ArtifactIntakeProps> = ({ documents, onAnalyze, onClose, onClearAll, onAddMore, onCancelAnalysis, isAnalyzing, analyzingDocId }) => {
  return (
    <div className="max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-1">Artifact Intake</h2>
          <p className="text-xs text-slate-500 font-medium">Validate and analyze your uploaded process documents</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onAddMore}
            className="px-4 py-2 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1.5"
          >
            <span className="material-icons-round text-sm">add</span>
            Add More
          </button>
          <button 
            onClick={onClearAll}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <span className="material-icons-round text-sm">delete_sweep</span>
            Clear All
          </button>
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 shrink-0"
            title="Close intake"
          >
            <span className="material-icons-round text-xl">close</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="w-[32%] px-3 md:px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Document Name</th>
              <th className="w-[12%] px-2 md:px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
              <th className="w-[12%] px-2 md:px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Size</th>
              <th className="w-[18%] px-2 md:px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Detected LOB</th>
              <th className="w-[14%] px-2 md:px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              <th className="w-[12%] px-2 md:px-3 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {documents?.map((doc) => (
              <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-3 md:px-4 py-3 min-w-0">
                  <div className="flex items-center gap-2 min-w-0" title={doc.document_name}>
                    <span className="material-icons-round text-primary/60 shrink-0 text-base">description</span>
                    <span className="font-bold text-xs text-slate-950 dark:text-white truncate">
                      {doc.document_name}
                    </span>
                  </div>
                </td>
                <td className="px-2 md:px-3 py-3 whitespace-nowrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">{doc.file_type}</span>
                </td>
                <td className="px-2 md:px-3 py-3 whitespace-nowrap">
                  <span className="text-xs font-medium text-slate-500">{doc.file_size_mb.toFixed(2)} MB</span>
                </td>
                <td className="px-2 md:px-3 py-3 min-w-0" title={doc.lob_detected}>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate block">
                    {doc.lob_detected}
                  </span>
                </td>
                <td className="px-2 md:px-3 py-3 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border w-fit ${
                      doc.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      doc.status === 'REJECTED' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                      {doc.status}
                    </span>
                    {doc.status === 'REJECTED' && doc.failure_reason && (
                      <p className="text-[9px] font-bold text-red-500/80 leading-tight truncate max-w-[120px]" title={doc.failure_reason}>
                        {doc.failure_reason}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-2 md:px-3 py-3 whitespace-nowrap">
                  {doc.status === 'APPROVED' && (
                    <button 
                      disabled={isAnalyzing}
                      onClick={() => onAnalyze(doc)}
                      className="px-3 py-1 bg-primary text-white text-[9px] font-black uppercase tracking-wider rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-1"
                    >
                      {analyzingDocId === doc.id ? (
                        <>
                          <span className="w-2.5 h-2.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Analyzing
                        </>
                      ) : (
                        'Analyze'
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {documents.length === 0 && (
          <div className="py-12 text-center text-slate-400">
            <span className="material-icons-round text-3xl mb-2 opacity-20">folder_open</span>
            <p className="text-xs font-medium">No documents uploaded yet</p>
          </div>
        )}
      </div>

      {isAnalyzing && (
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Running Process Intelligence Engine...</p>
          </div>
          <button 
            onClick={onCancelAnalysis}
            className="px-5 py-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-100 transition-all border border-red-100"
          >
            Cancel Analysis
          </button>
        </div>
      )}
    </div>
  );
};

export default ArtifactIntake;
