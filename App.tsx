
import React, { useState, useEffect } from 'react';
import { 
  DashboardSection as SectionType, 
  Opportunity,
  Geography,
  LOB,
  ArtifactDocument,
  AnalysisResult
} from './types';
import { INITIAL_DATA, FILE_SIZE_LIMITS, LOB_KEYWORDS, findBestOpportunityMatch } from './constants';
import HierarchyTree from './components/HierarchyTree';
import TransformationContent from './components/TransformationContent';
import FileUpload from './components/FileUpload';
import ArtifactIntake from './components/ArtifactIntake';
import ProcessTransformation from './components/ProcessTransformation';
import { generateOpportunityDetails, validateDocumentLOB, analyzeProcessIntelligence } from './services/geminiService';
import { ARCHITECTURE_IMAGE_BASE64 } from './assets';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Set worker source for pdfjs - using unpkg as a reliable CDN for pdfjs-dist
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ArchitectureModel = () => (
  <div className="w-full h-full flex items-center justify-center bg-white dark:bg-background-dark">
    <img 
      src={ARCHITECTURE_IMAGE_BASE64} 
      alt="Agentic Business Services Architecture Model" 
      className="w-full h-full object-contain block select-none pointer-events-none"
      draggable={false}
    />
  </div>
);

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [data] = useState<SectionType[]>(INITIAL_DATA);
  const [selectedOpportunity, setSelectedOpportunity] = useState<{ opp: Opportunity, category: string } | null>(null);
  const [transformationData, setTransformationData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  // New State for Process Intelligence
  const [currentView, setCurrentView] = useState<'home' | 'upload' | 'intake' | 'analysis'>('home');
  const [uploadedDocuments, setUploadedDocuments] = useState<ArtifactDocument[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const [marketFilter, setMarketFilter] = useState<Geography>(Geography.ALL);
  const [lobFilter, setLobFilter] = useState<LOB>(LOB.ALL);
  const [menuKey, setMenuKey] = useState(0);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (selectedOpportunity) {
      setLoading(true);
      setTransformationData(null);
      generateOpportunityDetails(selectedOpportunity.opp.name, selectedOpportunity.category)
        .then(res => {
          setTransformationData(res);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [selectedOpportunity]);

  const handleItemClick = (opp: Opportunity, categoryName: string) => {
    setSelectedOpportunity({ opp, category: categoryName });
    setCurrentView('home');
  };

  const handleLogoClick = () => {
    setSelectedOpportunity(null);
    setTransformationData(null);
    setAnalysisResult(null);
    setUploadedDocuments([]);
    setMenuKey(prev => prev + 1);
    setCurrentView('home');
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const extractFileContent = async (file: File): Promise<{ text: string, visualParts?: { base64Data: string, mimeType: string }[] }> => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (ext === 'txt' || ext === 'csv' || ext === 'json') {
      const text = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string || '');
        reader.readAsText(file);
      });
      return { text };
    }

    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });
      return { 
        text: `[Image File: ${file.name}]`, 
        visualParts: [{ base64Data: base64, mimeType: file.type }] 
      };
    }

    if (ext === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return { text: result.value };
      } catch (error) {
        console.error("Word Extraction Error:", error);
        return { text: `[Error extracting content from Word: ${file.name}]` };
      }
    }

    if (ext === 'vsdx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        let vsdxText = `[Visio File: ${file.name}]\n`;
        
        // Visio files store text in pages/page[n].xml
        const pageFiles = Object.keys(zip.files).filter(name => name.startsWith('visio/pages/page') && name.endsWith('.xml'));
        
        for (const pageFile of pageFiles) {
          const content = await zip.files[pageFile].async('text');
          // Simple regex to extract text content from XML tags
          const textMatches = content.match(/<v:cp[^>]*>(.*?)<\/v:cp>|<t[^>]*>(.*?)<\/t>/g);
          if (textMatches) {
            const pageName = pageFile.split('/').pop()?.replace('.xml', '') || pageFile;
            vsdxText += `\n--- ${pageName} ---\n`;
            const extracted = textMatches
              .map(match => match.replace(/<[^>]*>/g, ''))
              .filter(text => text.trim().length > 0)
              .join(' ');
            vsdxText += extracted + '\n';
          }
        }
        
        return { text: vsdxText || `[No text content found in Visio: ${file.name}]` };
      } catch (error) {
        console.error("Visio Extraction Error:", error);
        return { text: `[Error extracting content from Visio: ${file.name}]` };
      }
    }

    if (ext === 'xlsx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        let excelText = `[Excel File: ${file.name}]\n`;
        
        workbook.SheetNames.forEach(sheetName => {
          excelText += `\n--- Sheet: ${sheetName} ---\n`;
          const worksheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          excelText += csv + '\n';
        });
        
        return { text: excelText };
      } catch (error) {
        console.error("Excel Extraction Error:", error);
        return { text: `[Error extracting content from Excel: ${file.name}]` };
      }
    }

    if (ext === 'pdf') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';
        const visualParts: { base64Data: string, mimeType: string }[] = [];
        
        // Limit to first 5 pages to balance detail vs performance
        const pagesToProcess = Math.min(pdf.numPages, 5);

        for (let i = 1; i <= pagesToProcess; i++) {
          const page = await pdf.getPage(i);
          
          // Extract text
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => (item as any).str)
            .join(' ');
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;

          // Render page to image for diagram analysis
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          if (context) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            await page.render({ canvasContext: context, viewport, canvas }).promise;
            const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
            visualParts.push({ base64Data: base64, mimeType: 'image/jpeg' });
          }
        }
        
        return { 
          text: fullText || `[No text content found in PDF: ${file.name}]`,
          visualParts
        };
      } catch (error) {
        console.error("PDF Extraction Error:", error);
        return { text: `[Error extracting content from PDF: ${file.name}]` };
      }
    }
    
    return { 
      text: `[Extracted Content from ${file.name}]\nThis document appears to be a ${file.type || 'binary'} file.`
    };
  };

  const handleFilesSelected = async (files: FileList) => {
    // Clear previous data when uploading new documents
    setUploadedDocuments([]);
    setAnalysisResult(null);
    setSelectedOpportunity(null);
    setTransformationData(null);
    
    const newDocs: ArtifactDocument[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toUpperCase() || '';
      const sizeMB = file.size / (1024 * 1024);
      
      let sizeLimit = 20;
      if (ext === 'PDF') sizeLimit = FILE_SIZE_LIMITS.PDF;
      else if (ext === 'DOCX') sizeLimit = FILE_SIZE_LIMITS.DOCX;
      else if (ext === 'XLSX') sizeLimit = FILE_SIZE_LIMITS.XLSX;
      else if (ext === 'PPTX') sizeLimit = FILE_SIZE_LIMITS.PPTX;
      else if (ext === 'VSDX') sizeLimit = FILE_SIZE_LIMITS.VSDX;
      else if (file.type.startsWith('video/')) sizeLimit = FILE_SIZE_LIMITS.VIDEO;

      const sizePassed = sizeMB <= sizeLimit;
      
      const { text, visualParts } = await extractFileContent(file);

      const doc: ArtifactDocument = {
        id: Math.random().toString(36).substr(2, 9),
        document_name: file.name,
        file_type: ext || file.type,
        file_size_mb: sizeMB,
        size_validation: sizePassed ? 'PASSED' : 'FAILED',
        lob_detected: 'Pending...',
        keyword_scores: {
          life_insurance: 0,
          health_insurance: 0,
          property_casualty: 0,
          reinsurance: 0,
          banking: 0,
          personal_accident: 0
        },
        status: sizePassed ? 'UNKNOWN' : 'REJECTED',
        failure_reason: sizePassed ? undefined : `File size (${sizeMB.toFixed(2)}MB) exceeds the limit for ${ext} (${sizeLimit}MB).`,
        enable_analyze_button: false,
        content: text,
        visualParts: visualParts
      };

      newDocs.push(doc);
    }

    setUploadedDocuments(prev => [...prev, ...newDocs]);
    setCurrentView('intake');

    // Trigger LOB validation for each doc
    for (const doc of newDocs) {
      if (doc.size_validation === 'PASSED') {
        validateDocumentLOB(doc.content || '', doc.document_name).then(res => {
          setUploadedDocuments(prev => prev.map(d => d.id === doc.id ? {
            ...d,
            lob_detected: res.lob_detected,
            keyword_scores: res.keyword_scores,
            status: res.status as any,
            failure_reason: res.status === 'REJECTED' ? res.reason : undefined,
            enable_analyze_button: res.status === 'APPROVED'
          } : d));
        });
      }
    }
  };

  const handleAnalyze = async (doc: ArtifactDocument) => {
    if (doc.status !== 'APPROVED') return;

    setIsAnalyzing(true);
    setAnalyzingDocId(doc.id);
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const result = await analyzeProcessIntelligence([doc]);
      
      // Check if aborted
      if (controller.signal.aborted) return;

      if (result) {
        setAnalysisResult(result);
        
        // Automatically find and select the corresponding opportunity in the tree
        const { l1, l2, l3 } = result.process_classification;
        const section = data.find(s => s.title.toLowerCase().includes(l1.toLowerCase()) || l1.toLowerCase().includes(s.title.toLowerCase()));
        if (section) {
          const category = section.categories.find(c => c.name.toLowerCase().includes(l2.toLowerCase()) || l2.toLowerCase().includes(c.name.toLowerCase()));
          if (category) {
            const opportunity = findBestOpportunityMatch(l3, category.opportunities) || category.opportunities[0];
            if (opportunity) {
              setSelectedOpportunity({ opp: opportunity, category: category.name });
              setCurrentView('home');
            }
          }
        }
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
      setAnalyzingDocId(null);
      setAbortController(null);
    }
  };

  const handleCancelAnalysis = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsAnalyzing(false);
    setAnalyzingDocId(null);
  };

  const handleClearAll = () => {
    setUploadedDocuments([]);
    setAnalysisResult(null);
    setSelectedOpportunity(null);
    setTransformationData(null);
  };

  const handleCloseIntake = () => {
    setCurrentView('home');
  };

  const handleUploadArtifactsClick = () => {
    if (uploadedDocuments.length > 0) {
      setCurrentView('intake');
    } else {
      setCurrentView('upload');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark font-sans">
      <header className="shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-card-dark z-50">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={handleLogoClick}>
            <div className="bg-primary text-white w-12 h-12 flex items-center justify-center rounded-2xl shadow-lg shadow-primary/20 transition-all group-hover:scale-105 group-active:scale-95">
              <span className="material-icons-round text-3xl">hub</span>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter text-primary leading-none">
                Agentic Business Services (ABS)
              </h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[9px] uppercase font-bold tracking-[0.3em] text-slate-400">P&C Strategy Engine</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <button 
                onClick={handleLogoClick}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'home' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                Home
              </button>
              <button 
                onClick={handleUploadArtifactsClick}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === 'upload' || currentView === 'intake' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                Upload Artifacts
              </button>
            </div>

            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />

            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-500"
            >
              <span className="material-icons-round text-xl">{isDarkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex flex-col shadow-2xl">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Opportunity Map</span>
            <span className="material-icons-round text-sm text-slate-300">account_tree</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
            <HierarchyTree 
              key={menuKey} 
              sections={data} 
              onItemClick={handleItemClick} 
              analysisResult={analysisResult} 
              selectedOpportunity={selectedOpportunity}
            />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-background-dark/50">
          {currentView === 'home' && (
            selectedOpportunity ? (
              <div className="max-w-6xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                <div className="mb-5 pb-5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-2">
                    <span className="w-8 h-[2.5px] bg-primary rounded-full"></span>
                    Analysis Engine Output
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 dark:text-white mb-3 leading-tight tracking-tight">
                    {selectedOpportunity.opp.name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3.5 py-1.5 rounded-full bg-primary/10 text-[10px] font-black text-primary uppercase tracking-[0.15em] border border-primary/10">
                      Category: {selectedOpportunity.category}
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-black text-emerald-600 border border-emerald-100 dark:border-emerald-900/20 uppercase tracking-[0.15em]">
                      Strategic Priority: High
                    </span>
                  </div>
                </div>

                {loading ? (
                  <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                    <div className="relative">
                      <div className="w-14 h-14 border-[5px] border-primary/20 rounded-full" />
                      <div className="absolute inset-0 w-14 h-14 border-[5px] border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <div className="mt-6 text-center space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary animate-pulse">Consulting Gemini AI</p>
                    </div>
                  </div>
                ) : transformationData ? (
                  <TransformationContent data={transformationData} analysisResult={analysisResult} />
                ) : null}
              </div>
            ) : (
              <div className="h-full w-full animate-in fade-in duration-1000">
                <ArchitectureModel />
              </div>
            )
          )}

          {currentView === 'upload' && (
            <div className="max-w-3xl mx-auto p-4 md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h2 className="text-xl font-black text-slate-950 dark:text-white">Upload Process Artifacts</h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Upload process documents, workflow diagrams, or recordings for automated intelligence analysis.</p>
                </div>
                <button 
                  onClick={handleCloseIntake}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500 shrink-0"
                  title="Close upload"
                >
                  <span className="material-icons-round text-xl">close</span>
                </button>
              </div>
              <FileUpload onFilesSelected={handleFilesSelected} />
            </div>
          )}

          {currentView === 'intake' && (
            <ArtifactIntake 
              documents={uploadedDocuments} 
              onAnalyze={handleAnalyze} 
              onClose={handleCloseIntake}
              onClearAll={handleClearAll}
              onAddMore={() => setCurrentView('upload')}
              onCancelAnalysis={handleCancelAnalysis}
              isAnalyzing={isAnalyzing}
              analyzingDocId={analyzingDocId}
            />
          )}

          {currentView === 'analysis' && analysisResult && (
            <ProcessTransformation result={analysisResult} onClose={handleCloseIntake} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
