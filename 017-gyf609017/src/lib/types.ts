export type RecordStatus = 'pending' | 'accepted' | 'rejected';
export type MissingStatus = 'missing' | 'partial' | 'resolved';
export type BatchStatus = 'in_transit' | 'delivered' | 'accepted' | 'partial_accepted';

export interface DoorWindowRecord {
  id: string;
  batchId: string;
  openingCode: string;
  openingCodeNormalized: string;
  buildingNo: string;
  unitNo: string;
  floorNo: string;
  roomNo: string;
  spec: string;
  glassType: string;
  hardwareList: string;
  status: RecordStatus;
  isDuplicate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  batchNo: string;
  supplier: string;
  deliveryDate: string;
  status: BatchStatus;
  createdAt: string;
}

export interface MissingPart {
  id: string;
  recordId: string;
  partName: string;
  quantity: number;
  photoUrl: string;
  status: MissingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReplenishHistory {
  id: string;
  missingId: string;
  replenishedQty: number;
  responsible: string;
  note: string;
  createdAt: string;
}

export interface Settings {
  currentResponsible: string;
  lastUpdated: string;
}
