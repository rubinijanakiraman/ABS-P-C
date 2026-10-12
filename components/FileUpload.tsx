
import React, { useRef } from 'react';

interface FileUploadProps {
  onFilesSelected: (files: FileList) => void;
  maxFiles?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, maxFiles = 10 }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        return;
      }
      onFilesSelected(e.target.files);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > maxFiles) {
        alert(`Maximum ${maxFiles} files allowed.`);
        return;
      }
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const supportedFormats = [
    { ext: 'PDF', label: 'PDF Documents' },
    { ext: 'DOCX', label: 'Word Files' },
    { ext: 'XLSX', label: 'Excel Sheets' },
    { ext: 'PPTX', label: 'PowerPoint' },
    { ext: 'VSDX', label: 'Visio Diagrams' },
    { ext: 'MP4 / AVI', label: 'Screen Recordings' },
  ];

  return (
    <div 
      className="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-primary/80 dark:hover:border-primary/80 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center gap-3.5 transition-all cursor-pointer bg-slate-50/70 dark:bg-slate-900/60 hover:bg-primary/[0.02] dark:hover:bg-primary/[0.05] group shadow-sm hover:shadow-md"
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.docx,.xlsx,.pptx,.vsdx,video/*"
      />
      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner">
        <span className="material-icons-round text-2xl">cloud_upload</span>
      </div>
      
      <div className="text-center space-y-1 max-w-md">
        <p className="text-base font-bold text-slate-900 dark:text-white">
          Drag and drop process files here, or{' '}
          <span className="text-primary underline underline-offset-2">browse</span>
        </p>
        <p className="text-xs text-slate-500 font-medium">
          Upload up to {maxFiles} files at once for automated bulk intake &amp; LOB classification
        </p>
      </div>

      <button 
        type="button"
        className="my-1 px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
      >
        <span className="material-icons-round text-base">file_upload</span>
        Select Files
      </button>

      {/* Embedded Supported Artifact Types */}
      <div className="w-full max-w-xl mt-2 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Supported Artifact Types</span>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {supportedFormats.map((item) => (
            <div 
              key={item.ext} 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 shadow-2xs"
            >
              <span className="text-[11px] font-extrabold text-primary">{item.ext}</span>
              <span className="text-[10px] text-slate-400 font-medium">({item.label})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FileUpload;

