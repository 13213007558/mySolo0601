export type AlarmStatus = 'normal' | 'abnormal' | 'pending' | 'resolved';
export type ProcessStatus = 'received' | 'processing' | 'pending_review' | 'completed' | 'withdrawn';
export type ActionType = 'create' | 'submit' | 'withdraw' | 'resubmit' | 'manual_upload' | 'export' | 'import';

export interface InspectionPhoto {
  id: string;
  url: string;
  filename: string;
  uploadedAt: string;
  uploader: string;
  isManual: boolean;
  remark: string;
}

export interface HistoryRecord {
  id: string;
  action: ActionType;
  operator: string;
  timestamp: string;
  oldConclusion?: string;
  oldReason?: string;
  newConclusion?: string;
  newReason?: string;
  remark: string;
}

export interface FuseAlarm {
  id: string;
  fuseNo: string;
  deviceLocation: string;
  status: AlarmStatus;
  processStatus: ProcessStatus;
  customerEmail: string;
  emailSubject: string;
  receivedAt: string;
  inspectionPhotos: InspectionPhoto[];
  manualPhotos: InspectionPhoto[];
  originalValue: string;
  processedValue: string;
  hasAttachment: boolean;
  attachmentLost: boolean;
  history: HistoryRecord[];
  currentConclusion: string;
  currentReason: string;
  supervisorNote: string;
  operator: string;
  supervisor: string;
  createdAt: string;
  updatedAt: string;
  isYeMasterSample: boolean;
  isManualSample: boolean;
}

export interface ExportData {
  exportTime: string;
  version: string;
  data: FuseAlarm[];
}
