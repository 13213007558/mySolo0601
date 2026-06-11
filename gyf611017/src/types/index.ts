export type InclusionType = 
  | 'crystal' 
  | 'feather' 
  | 'cloud' 
  | 'needle' 
  | 'cavity' 
  | 'chip' 
  | 'cleavage' 
  | 'grain_center';

export type StoneStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'submitted' 
  | 'erratum_pending' 
  | 'erratum_approved';

export interface Inclusion {
  id: string;
  stoneId: string;
  type: InclusionType;
  x: number;
  y: number;
  color: string;
  notes?: string;
  createdAt: string;
}

export interface InclusionTypeConfig {
  type: InclusionType;
  name: string;
  nameEn: string;
  color: string;
  description: string;
  icon: string;
}

export interface GIA_Report {
  stoneId: string;
  measurements: string;
  caratWeight: string;
  colorGrade: string;
  clarityGrade: string;
  cutGrade: string;
  proportions: {
    depth: string;
    table: string;
    crownAngle: string;
    pavilionAngle: string;
    crownHeight: string;
    pavilionDepth: string;
    starLength: string;
    lowerHalf: string;
    girdle: string;
    culet: string;
  };
  clarityCharacteristics: string[];
  finish: {
    polish: string;
    symmetry: string;
  };
  fluorescence: string;
}

export interface ReportFieldMapping {
  id: string;
  fieldName: string;
  giaCode: string;
  systemValue: string;
  giaValue: string;
  confirmed: boolean;
}

export interface Stone {
  id: string;
  certificateNo: string;
  carat: number;
  color: string;
  clarity: string;
  imageUrl: string;
  status: StoneStatus;
  inclusions: Inclusion[];
  progress: number;
  requiredInclusionCount: number;
  createdAt: string;
  submittedAt?: string;
  report?: GIA_Report;
  fieldMappings: ReportFieldMapping[];
  requiredSectors: number[];
}

export interface Erratum {
  id: string;
  stoneId: string;
  reason: string;
  newPhotoUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt?: string;
}

export interface User {
  id: string;
  name: string;
  employeeNo: string;
  role: 'inspector' | 'supervisor';
}

export interface PlotState {
  isDragging: boolean;
  selectedInclusionId: string | null;
  currentInclusionType: InclusionType;
  showSectorHints: boolean;
}
