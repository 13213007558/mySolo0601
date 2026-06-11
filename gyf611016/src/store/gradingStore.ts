import { create } from "zustand";
import type {
  Annotation,
  AnnotationType,
  AnnotationVersion,
  CertificateDraft,
  JadeSlice,
  Point,
  StandardSample,
  ToolMode,
  ViewMode,
  Grader,
} from "@/types";
import {
  generateId,
  getMockSlices,
  getMockStandardSamples,
  getCurrentTimestamp,
} from "@/utils";

type TransformState = {
  x: number;
  y: number;
  scale: number;
  rotation: number;
};

type GradingState = {
  currentSlice: JadeSlice;
  slices: JadeSlice[];
  annotations: Annotation[];
  selectedAnnotationId: string | null;
  drawingPoints: Point[];
  isDrawing: boolean;
  transform: TransformState;
  toolMode: ToolMode;
  viewMode: ViewMode;
  versions: AnnotationVersion[];
  compareVersionA: number | null;
  compareVersionB: number | null;
  standardSamples: StandardSample[];
  activeSampleId: string | null;
  certificate: CertificateDraft | null;
  lightIntensity: number;
  graders: { primary: Grader; secondary: Grader };
  isCustomerScreen: boolean;
  showGrid: boolean;
  showMeasurements: boolean;
};

type GradingActions = {
  setSlice: (sliceId: string) => void;
  setToolMode: (mode: ToolMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setTransform: (t: Partial<TransformState>) => void;
  resetTransform: () => void;
  startDrawing: (point: Point) => void;
  addDrawingPoint: (point: Point) => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  selectAnnotation: (id: string | null) => void;
  deleteAnnotation: (id: string) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  calculateProgress: () => number;
  isProgressComplete: () => boolean;
  saveVersion: (comment: string) => void;
  restoreVersion: (version: number) => void;
  setCompareVersions: (a: number | null, b: number | null) => void;
  toggleSample: (sampleId: string) => void;
  setSampleOpacity: (sampleId: string, opacity: number) => void;
  setLightIntensity: (v: number) => void;
  setActiveSampleId: (id: string | null) => void;
  generateCertificate: () => CertificateDraft;
  signCertificate: (role: "primary" | "secondary") => void;
  submitCertificate: () => { success: boolean; message: string };
  setCustomerScreenMode: (v: boolean) => void;
  setShowGrid: (v: boolean) => void;
  setShowMeasurements: (v: boolean) => void;
  setCertificateInternalNotes: (notes: string) => void;
  setCertificateCustomerNotes: (notes: string) => void;
};

const initialSlice = getMockSlices()[0];
const initialGraders = {
  primary: {
    id: "grader_primary",
    name: "张明远",
    title: "primary" as const,
  },
  secondary: {
    id: "grader_secondary",
    name: "李文清",
    title: "secondary" as const,
  },
};

export const useGradingStore = create<GradingState & GradingActions>(
  (set, get) => ({
    currentSlice: initialSlice,
    slices: getMockSlices(),
    annotations: [],
    selectedAnnotationId: null,
    drawingPoints: [],
    isDrawing: false,
    transform: { x: 0, y: 0, scale: 1, rotation: 0 },
    toolMode: "pan",
    viewMode: "edit",
    versions: [],
    compareVersionA: null,
    compareVersionB: null,
    standardSamples: getMockStandardSamples(),
    activeSampleId: null,
    certificate: null,
    lightIntensity: 0.85,
    graders: initialGraders,
    isCustomerScreen: false,
    showGrid: false,
    showMeasurements: false,

    setSlice: (sliceId) => {
      const slice = get().slices.find((s) => s.id === sliceId);
      if (slice) {
        set({
          currentSlice: slice,
          annotations: [],
          selectedAnnotationId: null,
          drawingPoints: [],
          isDrawing: false,
          transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          versions: [],
          certificate: null,
        });
      }
    },

    setToolMode: (mode) => {
      set({
        toolMode: mode,
        selectedAnnotationId: null,
        drawingPoints: [],
        isDrawing: false,
      });
    },

    setViewMode: (mode) => set({ viewMode: mode }),

    setTransform: (t) =>
      set((s) => ({ transform: { ...s.transform, ...t } })),

    resetTransform: () =>
      set({ transform: { x: 0, y: 0, scale: 1, rotation: 0 } }),

    startDrawing: (point) => {
      const mode = get().toolMode;
      if (
        mode === "annotate_crack" ||
        mode === "annotate_impurity" ||
        mode === "annotate_inclusion"
      ) {
        set({ drawingPoints: [point], isDrawing: true });
      }
    },

    addDrawingPoint: (point) => {
      if (get().isDrawing) {
        set((s) => ({ drawingPoints: [...s.drawingPoints, point] }));
      }
    },

    finishDrawing: () => {
      const { isDrawing, drawingPoints, toolMode } = get();
      if (!isDrawing || drawingPoints.length < 3) {
        set({ drawingPoints: [], isDrawing: false });
        return;
      }

      let type: AnnotationType = "crack";
      let label = "";
      let severity: Annotation["severity"] = "moderate";

      if (toolMode === "annotate_crack") {
        type = "crack";
        label = `裂隙-${String(get().annotations.filter((a) => a.type === "crack").length + 1).padStart(2, "0")}`;
        severity = "moderate";
      } else if (toolMode === "annotate_impurity") {
        type = "impurity";
        label = `杂质-${String(get().annotations.filter((a) => a.type === "impurity").length + 1).padStart(2, "0")}`;
        severity = "minor";
      } else if (toolMode === "annotate_inclusion") {
        type = "inclusion";
        label = `包裹体-${String(get().annotations.filter((a) => a.type === "inclusion").length + 1).padStart(2, "0")}`;
        severity = "moderate";
      }

      const newAnnotation: Annotation = {
        id: generateId(),
        type,
        points: drawingPoints,
        label,
        severity,
        createdAt: getCurrentTimestamp(),
        version: get().versions.length,
      };

      set((s) => ({
        annotations: [...s.annotations, newAnnotation],
        drawingPoints: [],
        isDrawing: false,
        selectedAnnotationId: newAnnotation.id,
      }));
    },

    cancelDrawing: () =>
      set({ drawingPoints: [], isDrawing: false }),

    selectAnnotation: (id) => set({ selectedAnnotationId: id }),

    deleteAnnotation: (id) =>
      set((s) => ({
        annotations: s.annotations.filter((a) => a.id !== id),
        selectedAnnotationId:
          s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
      })),

    updateAnnotation: (id, updates) =>
      set((s) => ({
        annotations: s.annotations.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
      })),

    calculateProgress: () => {
      const { currentSlice, annotations } = get();
      const required = currentSlice.requiredAnnotations;
      if (required.length === 0) return 100;

      let completedRequired = 0;
      required.forEach((type) => {
        const count = annotations.filter((a) => a.type === type).length;
        if (count >= 1) completedRequired++;
      });

      const requiredCoverage = (completedRequired / required.length) * 80;

      const optionalTypes: AnnotationType[] = ["inclusion"];
      let optionalBonus = 0;
      optionalTypes.forEach((type) => {
        if (!required.includes(type)) {
          const count = annotations.filter((a) => a.type === type).length;
          if (count >= 1) optionalBonus += 10;
        }
      });

      const totalRequired = required.reduce(
        (sum, t) => sum + annotations.filter((a) => a.type === t).length,
        0
      );
      const densityBonus = totalRequired >= required.length * 2 ? 10 : totalRequired >= required.length * 1.5 ? 5 : 0;

      return Math.round(Math.min(requiredCoverage + optionalBonus + densityBonus, 100));
    },

    isProgressComplete: () => {
      const { annotations, currentSlice } = get();
      const required = currentSlice.requiredAnnotations;

      const hasAllRequired = required.every((type) =>
        annotations.some((a) => a.type === type)
      );
      return hasAllRequired;
    },

    saveVersion: (comment) => {
      const { annotations, versions, graders } = get();
      const newVersion: AnnotationVersion = {
        version: versions.length,
        annotations: JSON.parse(JSON.stringify(annotations)),
        timestamp: getCurrentTimestamp(),
        author: graders.primary.name,
        comment,
      };
      set((s) => ({ versions: [...s.versions, newVersion] }));
    },

    restoreVersion: (versionNum) => {
      const version = get().versions.find((v) => v.version === versionNum);
      if (version) {
        set({
          annotations: JSON.parse(JSON.stringify(version.annotations)),
        });
      }
    },

    setCompareVersions: (a, b) =>
      set({ compareVersionA: a, compareVersionB: b }),

    toggleSample: (sampleId) =>
      set((s) => ({
        standardSamples: s.standardSamples.map((sam) =>
          sam.id === sampleId ? { ...sam, visible: !sam.visible } : sam
        ),
        activeSampleId:
          s.activeSampleId === sampleId ? null : sampleId,
      })),

    setSampleOpacity: (sampleId, opacity) =>
      set((s) => ({
        standardSamples: s.standardSamples.map((sam) =>
          sam.id === sampleId
            ? { ...sam, opacity: Math.max(0, Math.min(1, opacity)) }
            : sam
        ),
      })),

    setLightIntensity: (v) =>
      set({ lightIntensity: Math.max(0.2, Math.min(1, v)) }),

    setActiveSampleId: (id) => set({ activeSampleId: id }),

    generateCertificate: () => {
      const { currentSlice, annotations, graders } = get();
      const cracks = annotations.filter((a) => a.type === "crack");
      const impurities = annotations.filter((a) => a.type === "impurity");
      const inclusions = annotations.filter(
        (a) => a.type === "inclusion"
      );

      const severeCount = annotations.filter(
        (a) => a.severity === "severe"
      ).length;
      const moderateCount = annotations.filter(
        (a) => a.severity === "moderate"
      ).length;
      const minorCount = annotations.filter(
        (a) => a.severity === "minor"
      ).length;

      let grade = "A+ (收藏级)";
      if (severeCount > 0) grade = "B (标准级)";
      else if (moderateCount > 2) grade = "A (优质级)";
      else if (minorCount > 3) grade = "A+ (优质级)";

      let summary = "本件玉石样品整体质地温润细腻，结构致密，";
      if (cracks.length > 0) {
        summary += `检测到 ${cracks.length} 处裂隙；`;
      } else {
        summary += "无明显裂隙；";
      }
      if (impurities.length > 0) {
        summary += `含 ${impurities.length} 处杂质矿物；`;
      } else {
        summary += "纯净度较高；";
      }
      if (inclusions.length > 0) {
        summary += `可见 ${inclusions.length} 处气相/液相包裹体。`;
      } else {
        summary += "内部包裹体少。";
      }
      summary += `综合评定等级为 ${grade}。`;

      const cert: CertificateDraft = {
        id: `CERT-${Date.now()}`,
        sliceId: currentSlice.id,
        grade,
        summary,
        annotations: JSON.parse(JSON.stringify(annotations)),
        status: "draft",
        internalNotes: "",
        customerNotes: "",
      };

      set({ certificate: cert, viewMode: "certificate" });
      return cert;
    },

    signCertificate: (role) => {
      const { certificate, graders } = get();
      if (!certificate) return;

      const grader = graders[role];
      const signedGrader: Grader = {
        ...grader,
        signedAt: getCurrentTimestamp(),
      };

      const updated: CertificateDraft = {
        ...certificate,
        [role === "primary" ? "primaryGrader" : "secondaryGrader"]:
          signedGrader,
      };

      if (updated.primaryGrader && updated.secondaryGrader) {
        updated.status = "pending_review";
      }

      set({ certificate: updated });
    },

    submitCertificate: () => {
      const state = get();
      const { certificate, isProgressComplete } = state;

      if (!isProgressComplete()) {
        return {
          success: false,
          message: "标注完成度未达100%，请完成所有必要类型的标注后再提交",
        };
      }

      if (!certificate) {
        return { success: false, message: "请先生成证书草稿" };
      }

      if (!certificate.primaryGrader?.signedAt) {
        return {
          success: false,
          message: "主分级师尚未签署证书",
        };
      }

      if (!certificate.secondaryGrader?.signedAt) {
        return {
          success: false,
          message: "副分级师尚未签署证书",
        };
      }

      set({
        certificate: {
          ...certificate,
          status: "issued",
          issuedAt: getCurrentTimestamp(),
        },
      });

      return { success: true, message: "证书已成功签发！" };
    },

    setCustomerScreenMode: (v) => set({ isCustomerScreen: v }),

    setShowGrid: (v) => set({ showGrid: v }),

    setShowMeasurements: (v) => set({ showMeasurements: v }),

    setCertificateInternalNotes: (notes) =>
      set((s) =>
        s.certificate
          ? { certificate: { ...s.certificate, internalNotes: notes } }
          : {}
      ),

    setCertificateCustomerNotes: (notes) =>
      set((s) =>
        s.certificate
          ? { certificate: { ...s.certificate, customerNotes: notes } }
          : {}
      ),
  })
);
