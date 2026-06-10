import { useMemo, useCallback, useEffect, useState } from 'react';
import { useStoneStore } from '@/store';
import { db } from '@/db';
import type { StoneRecord, PhotoAttachment } from '@/types';

export function useMissingPhotoIds() {
  const [missingIds, setMissingIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(async () => {
    const allPhotos = await db.photos.toArray();
    const byStone = new Map<string, PhotoAttachment[]>();
    for (const p of allPhotos) {
      if (!byStone.has(p.stoneId)) byStone.set(p.stoneId, []);
      byStone.get(p.stoneId)!.push(p);
    }
    const ids = new Set<string>();
    for (const [stoneId, photos] of byStone) {
      if (photos.some((p) => p.isMissing)) ids.add(stoneId);
    }
    setMissingIds(ids);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { missingIds, refreshMissingPhotos: refresh };
}

export function useFilteredStones() {
  const stones = useStoneStore((s) => s.stones);
  const filter = useStoneStore((s) => s.filter);
  const { missingIds } = useMissingPhotoIds();

  return useMemo(() => {
    let result = stones;

    if (filter.batchNo) {
      result = result.filter((s) =>
        s.batchNo.trim().toLowerCase().includes(filter.batchNo.trim().toLowerCase())
      );
    }

    if (filter.facadeZone) {
      result = result.filter((s) => s.facadeZone === filter.facadeZone);
    }

    if (filter.colorGrade) {
      result = result.filter((s) => s.colorGrade === filter.colorGrade);
    }

    if (filter.missingPhoto) {
      result = result.filter((s) => missingIds.has(s.id));
    }

    if (filter.searchText) {
      const q = filter.searchText.toLowerCase();
      result = result.filter(
        (s) =>
          s.stoneNo.toLowerCase().includes(q) ||
          s.batchNo.toLowerCase().includes(q) ||
          s.facadeZone.toLowerCase().includes(q) ||
          s.operator.toLowerCase().includes(q)
      );
    }

    return result;
  }, [stones, filter, missingIds]);
}

export function useStoneStats(stones: StoneRecord[]) {
  const { missingIds } = useMissingPhotoIds();

  return useMemo(() => {
    const total = stones.length;
    const gradeA = stones.filter((s) => s.colorGrade === 'A').length;
    const gradeB = stones.filter((s) => s.colorGrade === 'B').length;
    const gradeC = stones.filter((s) => s.colorGrade === 'C').length;
    const gradeD = stones.filter((s) => s.colorGrade === 'D').length;
    const missingPhoto = stones.filter((s) => missingIds.has(s.id)).length;
    const confirmed = stones.filter((s) => s.wallStatus === 'normal' || s.wallStatus === 'replaced').length;
    const pending = stones.filter((s) => s.wallStatus === 'pending').length;
    const conflict = stones.filter((s) => s.wallStatus === 'conflict').length;

    return { total, gradeA, gradeB, gradeC, gradeD, missingPhoto, confirmed, pending, conflict };
  }, [stones, missingIds]);
}
