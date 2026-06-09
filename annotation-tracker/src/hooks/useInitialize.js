import { useState, useEffect } from 'react';
import { db } from '../db';
import { mockAnnotations, getMockRepliesForAnnotations, mockImportBatch } from '../data/mockData';

export function useInitialize() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const count = await db.annotations.count();
        
        if (count === 0) {
          await loadMockData();
        }
        
        setIsInitialized(true);
      } catch (err) {
        console.error('初始化失败:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);

  return { isLoading, error, isInitialized };
}

export async function loadMockData() {
  await db.transaction('rw', [db.annotations, db.replies, db.importBatches], async () => {
    const savedAnnotations = [];
    
    for (const annotation of mockAnnotations) {
      await db.annotations.add(annotation);
      savedAnnotations.push(annotation);
    }
    
    const replies = getMockRepliesForAnnotations(savedAnnotations);
    for (const reply of replies) {
      await db.replies.add(reply);
    }
    
    await db.importBatches.add(mockImportBatch);
  });
}

export async function resetAllData() {
  await db.transaction('rw', [db.annotations, db.replies, db.importBatches], async () => {
    await db.annotations.clear();
    await db.replies.clear();
    await db.importBatches.clear();
  });
  
  await loadMockData();
}

export async function checkDataExists() {
  const count = await db.annotations.count();
  return count > 0;
}
