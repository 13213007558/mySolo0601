export interface RecordInfo {
  id: string;
  sellerId: string;
  sellerName: string;
  recordNo: string;
  recordTitle: string;
  artist: string;
  originalPrice: number;
  weight: number;
  createdAt: string;
}

export interface GrooveImage {
  id: string;
  recordId: string;
  imageData: string;
  width: number;
  height: number;
  uploadedAt: string;
}

export interface WearAnalysis {
  score: number;
  grooveDepthLoss: number;
  scratchDensity: number;
  noiseLevel: number;
  suggestion: 'regenerate' | 'scrap' | 'pending';
  needsReview: boolean;
  confidence: number;
}

export interface InspectionItem {
  id: string;
  record: RecordInfo;
  image: GrooveImage | null;
  analysis: WearAnalysis | null;
  finalPrice: number;
  status: 'queue' | 'analyzing' | 'pending_review' | 'completed';
  reviewedBy?: string;
  reviewedAt?: string;
  position: number;
}

export interface Template {
  id: string;
  name: string;
  grade: 'standard' | 'mint' | 'vg' | 'g';
  imageData: string;
}

export interface SerialDevice {
  port: string;
  type: 'scale' | 'microscope';
  connected: boolean;
}

export interface DisputeReport {
  id: string;
  dateRange: [string, string];
  totalRecords: number;
  scrapCount: number;
  regenerateCount: number;
  disputedCount: number;
  averageScore: number;
  sellerDisputes: Array<{ sellerName: string; count: number }>;
}
