import { useEffect } from 'react';
import { useBracketStore } from '@/store/useBracketStore';

export const useURLSync = () => {
  const loadFromURLParams = useBracketStore((state) => state.loadFromURLParams);
  const checkStateIntegrity = useBracketStore((state) => state.checkStateIntegrity);

  useEffect(() => {
    loadFromURLParams();
    const timer = setTimeout(() => {
      checkStateIntegrity();
    }, 100);

    return () => clearTimeout(timer);
  }, [loadFromURLParams, checkStateIntegrity]);

  useEffect(() => {
    const handlePopState = () => {
      loadFromURLParams();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [loadFromURLParams]);
};
