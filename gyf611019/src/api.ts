import { invoke } from '@tauri-apps/api/core';
import { WearAnalysis, InspectionItem, DisputeReport } from './types';

export const MIN_RESOLUTION = { width: 1920, height: 1080 };

export function calculatePricing(originalPrice: number, score: number): number {
  const factor = score / 100;
  const depreciation = (1 - factor) * 0.7;
  return Math.max(originalPrice * (1 - depreciation), originalPrice * 0.1);
}

export function checkImageResolution(
  width: number,
  height: number
): { valid: boolean; message: string } {
  if (width < MIN_RESOLUTION.width || height < MIN_RESOLUTION.height) {
    return {
      valid: false,
      message: `照片分辨率不足：需要至少 ${MIN_RESOLUTION.width}×${MIN_RESOLUTION.height}，当前为 ${width}×${height}`
    };
  }
  return { valid: true, message: '' };
}

export async function analyzeWear(
  imageData: string,
  templateId: string = 'standard'
): Promise<WearAnalysis> {
  return await invoke('analyze_wear', { imageData, templateId });
}

export async function readScaleWeight(): Promise<number> {
  return await invoke('read_scale_weight');
}

export async function captureMicroscope(): Promise<{
  imageData: string;
  width: number;
  height: number;
}> {
  return await invoke('capture_microscope');
}

export async function listSerialPorts(): Promise<string[]> {
  return await invoke('list_serial_ports');
}

export async function confirmScrap(itemId: string, reviewer: string): Promise<void> {
  return await invoke('confirm_scrap', { itemId, reviewer });
}

export async function exportDisputeReport(
  startDate: string,
  endDate: string
): Promise<DisputeReport> {
  return await invoke('export_dispute_report', { startDate, endDate });
}

export async function saveInspection(item: InspectionItem): Promise<void> {
  return await invoke('save_inspection', { item });
}

export async function listInspections(): Promise<InspectionItem[]> {
  return await invoke('list_inspections');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

export function createMockAnalysis(seed: string): WearAnalysis {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const rand = () => {
    hash = ((hash << 5) - hash) + (hash >> 3);
    return ((hash & 0x7fffffff) % 1000) / 1000;
  };

  const score = Math.round(40 + rand() * 55);
  const grooveDepthLoss = Math.round(10 + rand() * 60);
  const scratchDensity = Math.round(rand() * 100);
  const noiseLevel = Math.round(rand() * 100);

  let suggestion: 'regenerate' | 'scrap' | 'pending';
  let needsReview = false;

  if (score >= 70) {
    suggestion = 'regenerate';
  } else if (score < 40) {
    suggestion = 'scrap';
    needsReview = true;
  } else {
    suggestion = 'pending';
    needsReview = true;
  }

  return {
    score,
    grooveDepthLoss,
    scratchDensity,
    noiseLevel,
    suggestion,
    needsReview,
    confidence: Math.round(70 + rand() * 25)
  };
}
