
export interface Opportunity {
  id: string;
  name: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  count: number;
  total: number;
  opportunities: Opportunity[];
}

export interface DashboardSection {
  id: string;
  title: string;
  count: number;
  total: number;
  categories: Category[];
}

export enum Geography {
  ALL = 'All Selected',
  NA = 'North America',
  EU = 'Europe',
  APAC = 'APAC'
}

export enum LOB {
  ALL = 'All Selected',
  PROPERTY = 'Property',
  AUTO = 'Commercial Auto',
  WORKERS_COMP = 'Workers Comp',
  FINANCIAL = 'Financial Lines',
  LIFE = 'Life Insurance',
  ANNUITIES = 'Annuities'
}

export interface ArtifactDocument {
  id: string;
  document_name: string;
  file_type: string;
  file_size_mb: number;
  size_validation: 'PASSED' | 'FAILED';
  lob_detected: string;
  keyword_scores: {
    life_insurance: number;
    health_insurance: number;
    property_casualty: number;
    reinsurance: number;
    banking: number;
    personal_accident: number;
  };
  status: 'APPROVED' | 'REJECTED' | 'UNKNOWN' | 'READY_FOR_ANALYSIS';
  failure_reason?: string;
  enable_analyze_button: boolean;
  content?: string; // Extracted text
  visualParts?: { base64Data: string; mimeType: string }[];
}

export interface ProcessClassification {
  l1: string;
  l2: string;
  l3: string;
}

export interface ProcessTransformation {
  current_state: string[];
  agentic_led_future_state: string[];
}

export interface AnalysisResult {
  documents: ArtifactDocument[];
  process_classification: ProcessClassification;
  process_transformation: ProcessTransformation;
}
