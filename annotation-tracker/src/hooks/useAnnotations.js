import { useState, useEffect, useCallback } from 'react';
import { getAnnotations, getStatistics, deleteAnnotation, updateAnnotationStatus } from '../db/operations';

export function useAnnotations() {
  const [annotations, setAnnotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    building: '',
    major: '',
    assignee: '',
    status: '',
    pageNo: '',
    keyword: '',
    hasError: undefined
  });

  const loadAnnotations = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnnotations(filters);
      setAnnotations(data);
      
      const statsData = await getStatistics();
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadAnnotations();
  }, [loadAnnotations]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      building: '',
      major: '',
      assignee: '',
      status: '',
      pageNo: '',
      keyword: '',
      hasError: undefined
    });
  };

  const removeAnnotation = async (id) => {
    try {
      await deleteAnnotation(id);
      await loadAnnotations();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const changeStatus = async (id, status) => {
    try {
      await updateAnnotationStatus(id, status);
      await loadAnnotations();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const normalAnnotations = annotations.filter(a => !a.hasError);
  const problemAnnotations = annotations.filter(a => a.hasError);

  return {
    annotations,
    normalAnnotations,
    problemAnnotations,
    loading,
    error,
    stats,
    filters,
    updateFilter,
    clearFilters,
    refresh: loadAnnotations,
    removeAnnotation,
    changeStatus
  };
}
