export type Point = {
  x: number;
  y: number;
};

export type AnnotationType = "crack" | "impurity" | "inclusion";

export type Annotation = {
  id: string;
  type: AnnotationType;
  points: Point[];
  label: string;
  severity: "minor" | "moderate" | "severe";
  note?: string;
  createdAt: number;
  version: number;
};

export type AnnotationVersion = {
  version: number;
  annotations: Annotation[];
  timestamp: number;
  author: string;
  comment: string;
};

export type JadeSlice = {
  id: string;
  name: string;
  code: string;
  imageUrl: string;
  width: number;
  height: number;
  thickness: number;
  origin: string;
  category: string;
  weight: number;
  requiredAnnotations: AnnotationType[];
};

export type StandardSample = {
  id: string;
  name: string;
  grade: string;
  imageUrl: string;
  opacity: number;
  visible: boolean;
};

export type Grader = {
  id: string;
  name: string;
  title: "primary" | "secondary";
  signatureUrl?: string;
  signedAt?: number;
};

export type CertificateDraft = {
  id: string;
  sliceId: string;
  grade: string;
  summary: string;
  annotations: Annotation[];
  primaryGrader?: Grader;
  secondaryGrader?: Grader;
  issuedAt?: number;
  status: "draft" | "pending_review" | "issued" | "rejected";
  internalNotes: string;
  customerNotes: string;
};

export type ViewMode = "edit" | "preview_customer" | "version_compare" | "certificate";

export type ToolMode =
  | "pan"
  | "annotate_crack"
  | "annotate_impurity"
  | "annotate_inclusion"
  | "select"
  | "measure";
