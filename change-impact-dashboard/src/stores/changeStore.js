import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';
import { STORAGE_KEYS, FLOORS, MAJORS, RESPONSIBLE_PERSONS } from '../data/constants';
import { mockChanges } from '../data/mockData';
import { saveToStorage, loadFromStorage, generateHash, clearAllStorage } from '../utils/storage';

export const useChangeStore = defineStore('change', () => {
  const changes = ref([]);
  const selectedFloorId = ref('all');
  const filters = ref({
    keyword: '',
    major: 'all',
    responsiblePerson: 'all',
    impactLevel: 'all',
    constructionStatus: 'all',
    status: 'all',
    sourceType: 'all'
  });
  const selectedChangeId = ref(null);
  const isDetailDrawerOpen = ref(false);
  const isImportWizardOpen = ref(false);
  const isRevertModalOpen = ref(false);
  const revertChangeId = ref(null);
  const dataHash = ref('');
  const lastUpdated = ref(null);

  const loadStoredData = () => {
    const storedChanges = loadFromStorage(STORAGE_KEYS.CHANGES);
    const storedFilters = loadFromStorage(STORAGE_KEYS.FILTERS);
    const storedFloor = loadFromStorage(STORAGE_KEYS.SELECTED_FLOOR, 'all');
    const initialized = loadFromStorage(STORAGE_KEYS.INIT_FLAG, false);

    if (storedChanges && storedChanges.length > 0) {
      changes.value = storedChanges;
    } else if (!initialized) {
      changes.value = JSON.parse(JSON.stringify(mockChanges));
      saveToStorage(STORAGE_KEYS.CHANGES, changes.value);
      saveToStorage(STORAGE_KEYS.INIT_FLAG, true);
    }

    if (storedFilters) {
      filters.value = { ...filters.value, ...storedFilters };
    }
    
    selectedFloorId.value = storedFloor;
    updateDataHash();
  };

  const updateDataHash = () => {
    const sortedChanges = [...changes.value].sort((a, b) => 
      a.changeNo.localeCompare(b.changeNo)
    );
    dataHash.value = generateHash(sortedChanges);
    lastUpdated.value = new Date().toISOString();
  };

  watch(changes, (newChanges) => {
    saveToStorage(STORAGE_KEYS.CHANGES, newChanges);
    updateDataHash();
  }, { deep: true });

  watch(filters, (newFilters) => {
    saveToStorage(STORAGE_KEYS.FILTERS, newFilters);
  }, { deep: true });

  watch(selectedFloorId, (newFloor) => {
    saveToStorage(STORAGE_KEYS.SELECTED_FLOOR, newFloor);
  });

  const floorChanges = computed(() => {
    if (selectedFloorId.value === 'all') {
      return changes.value;
    }
    return changes.value.filter(c => c.floorId === selectedFloorId.value);
  });

  const filteredChanges = computed(() => {
    let result = [...floorChanges.value];
    
    if (filters.value.keyword) {
      const keyword = filters.value.keyword.toLowerCase();
      result = result.filter(c => 
        c.changeNo.toLowerCase().includes(keyword) ||
        c.title.toLowerCase().includes(keyword) ||
        c.description.toLowerCase().includes(keyword) ||
        c.remarks?.toLowerCase().includes(keyword)
      );
    }
    
    if (filters.value.major && filters.value.major !== 'all') {
      result = result.filter(c => c.major === filters.value.major);
    }
    
    if (filters.value.responsiblePerson && filters.value.responsiblePerson !== 'all') {
      result = result.filter(c => c.responsiblePerson === filters.value.responsiblePerson);
    }
    
    if (filters.value.impactLevel && filters.value.impactLevel !== 'all') {
      result = result.filter(c => c.impactLevel === filters.value.impactLevel);
    }
    
    if (filters.value.constructionStatus && filters.value.constructionStatus !== 'all') {
      result = result.filter(c => c.constructionStatus === filters.value.constructionStatus);
    }
    
    if (filters.value.status && filters.value.status !== 'all') {
      result = result.filter(c => c.status === filters.value.status);
    }
    
    if (filters.value.sourceType && filters.value.sourceType !== 'all') {
      result = result.filter(c => c.source === filters.value.sourceType);
    }
    
    return result.sort((a, b) => 
      new Date(b.dateReceived).getTime() - new Date(a.dateReceived).getTime()
    );
  });

  const floorStats = computed(() => {
    const data = floorChanges.value;
    return {
      total: data.length,
      pending: data.filter(c => c.status === 'pending').length,
      confirmed: data.filter(c => c.status === 'confirmed').length,
      implemented: data.filter(c => c.status === 'implemented').length,
      rejected: data.filter(c => c.status === 'rejected').length,
      reverted: data.filter(c => c.history?.some(h => h.action === 'revert')).length,
      totalCost: data.reduce((sum, c) => sum + (c.costImpact || 0), 0),
      totalDays: data.reduce((sum, c) => sum + (c.scheduleImpact || 0), 0),
      constructedCount: data.filter(c => c.constructionStatus === 'constructed').length,
      partialCount: data.filter(c => c.constructionStatus === 'partial').length,
      drawingCount: data.filter(c => c.constructionStatus === 'drawing').length,
      highImpact: data.filter(c => c.impactLevel === 'high').length,
      mediumImpact: data.filter(c => c.impactLevel === 'medium').length,
      lowImpact: data.filter(c => c.impactLevel === 'low').length,
      noImpact: data.filter(c => c.impactLevel === 'none').length
    };
  });

  const majorBreakdown = computed(() => {
    const data = floorChanges.value;
    return MAJORS.map(major => {
      const majorChanges = data.filter(c => c.major === major.id);
      return {
        ...major,
        count: majorChanges.length,
        cost: majorChanges.reduce((sum, c) => sum + (c.costImpact || 0), 0),
        days: majorChanges.reduce((sum, c) => sum + (c.scheduleImpact || 0), 0),
        constructed: majorChanges.filter(c => c.constructionStatus === 'constructed').length,
        pending: majorChanges.filter(c => c.status === 'pending').length
      };
    }).filter(m => m.count > 0).sort((a, b) => b.count - a.count);
  });

  const selectedChange = computed(() => {
    if (!selectedChangeId.value) return null;
    return changes.value.find(c => c.id === selectedChangeId.value) || null;
  });

  const addChange = (changeData) => {
    const newChange = {
      id: uuidv4(),
      version: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        {
          id: uuidv4(),
          action: 'create',
          timestamp: new Date().toISOString(),
          operator: 'sun',
          oldValue: null,
          newValue: { status: 'pending' },
          reason: '手动录入变更'
        }
      ],
      ...changeData
    };
    changes.value.unshift(newChange);
    return newChange;
  };

  const updateChange = (id, updates, reason = '更新变更信息', operator = 'sun') => {
    const index = changes.value.findIndex(c => c.id === id);
    if (index === -1) return null;

    const oldChange = { ...changes.value[index] };
    const newChange = { 
      ...oldChange, 
      ...updates,
      updatedAt: new Date().toISOString() 
    };

    const historyEntry = {
      id: uuidv4(),
      action: 'update',
      timestamp: new Date().toISOString(),
      operator,
      oldValue: {},
      newValue: {},
      reason
    };

    Object.keys(updates).forEach(key => {
      if (JSON.stringify(oldChange[key]) !== JSON.stringify(updates[key])) {
        historyEntry.oldValue[key] = oldChange[key];
        historyEntry.newValue[key] = updates[key];
      }
    });

    newChange.history = [...oldChange.history, historyEntry];
    changes.value[index] = newChange;
    return newChange;
  };

  const revertChange = (id, fieldUpdates, revertReason, operator = 'qian') => {
    const index = changes.value.findIndex(c => c.id === id);
    if (index === -1) return null;

    const oldChange = { ...changes.value[index] };
    const newChange = {
      ...oldChange,
      ...fieldUpdates,
      updatedAt: new Date().toISOString()
    };

    const historyEntry = {
      id: uuidv4(),
      action: 'revert',
      timestamp: new Date().toISOString(),
      operator,
      oldValue: {},
      newValue: {},
      reason: `【误判撤回】${revertReason}`
    };

    Object.keys(fieldUpdates).forEach(key => {
      historyEntry.oldValue[key] = oldChange[key];
      historyEntry.newValue[key] = fieldUpdates[key];
    });

    newChange.history = [...oldChange.history, historyEntry];
    changes.value[index] = newChange;
    return newChange;
  };

  const createNewVersion = (id, newDescription, reason, operator = 'sun') => {
    const index = changes.value.findIndex(c => c.id === id);
    if (index === -1) return null;

    const oldChange = { ...changes.value[index] };
    const newChange = {
      ...oldChange,
      version: oldChange.version + 1,
      description: newDescription,
      updatedAt: new Date().toISOString()
    };

    const historyEntry = {
      id: uuidv4(),
      action: 'version_update',
      timestamp: new Date().toISOString(),
      operator,
      oldValue: { version: oldChange.version, description: oldChange.description },
      newValue: { version: oldChange.version + 1, description: newDescription },
      reason
    };

    newChange.history = [...oldChange.history, historyEntry];
    changes.value[index] = newChange;
    return newChange;
  };

  const deleteChange = (id) => {
    const index = changes.value.findIndex(c => c.id === id);
    if (index === -1) return false;
    changes.value.splice(index, 1);
    return true;
  };

  const importChanges = (newChanges, skipDuplicates = true) => {
    const existingNos = new Set(changes.value.map(c => c.changeNo));
    const imported = [];
    const skipped = [];
    const errors = [];

    newChanges.forEach((change, index) => {
      if (!change.changeNo) {
        errors.push(`第 ${index + 1} 行缺少变更编号`);
        return;
      }
      
      if (skipDuplicates && existingNos.has(change.changeNo)) {
        skipped.push({ changeNo: change.changeNo, reason: '变更编号已存在' });
        return;
      }
      
      if (!change.floorId) {
        errors.push(`变更 ${change.changeNo} 缺少楼层信息`);
        return;
      }
      
      imported.push(change);
      existingNos.add(change.changeNo);
    });

    changes.value = [...imported, ...changes.value];
    
    return {
      imported: imported.length,
      skipped: skipped.length,
      errors: errors.length,
      skippedItems: skipped,
      errorItems: errors
    };
  };

  const setSelectedFloor = (floorId) => {
    selectedFloorId.value = floorId;
  };

  const setFilters = (newFilters) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const resetFilters = () => {
    filters.value = {
      keyword: '',
      major: 'all',
      responsiblePerson: 'all',
      impactLevel: 'all',
      constructionStatus: 'all',
      status: 'all',
      sourceType: 'all'
    };
  };

  const openDetail = (changeId) => {
    selectedChangeId.value = changeId;
    isDetailDrawerOpen.value = true;
  };

  const closeDetail = () => {
    isDetailDrawerOpen.value = false;
    setTimeout(() => {
      selectedChangeId.value = null;
    }, 300);
  };

  const openRevertModal = (changeId) => {
    revertChangeId.value = changeId;
    isRevertModalOpen.value = true;
  };

  const closeRevertModal = () => {
    isRevertModalOpen.value = false;
    revertChangeId.value = null;
  };

  const resetAllData = () => {
    clearAllStorage();
    changes.value = JSON.parse(JSON.stringify(mockChanges));
    selectedFloorId.value = 'all';
    resetFilters();
    saveToStorage(STORAGE_KEYS.CHANGES, changes.value);
    saveToStorage(STORAGE_KEYS.INIT_FLAG, true);
    updateDataHash();
  };

  const verifyDataConsistency = () => {
    const sortedChanges = [...changes.value].sort((a, b) => 
      a.changeNo.localeCompare(b.changeNo)
    );
    const currentHash = generateHash(sortedChanges);
    return {
      isConsistent: currentHash === dataHash.value,
      currentHash,
      storedHash: dataHash.value,
      lastUpdated: lastUpdated.value,
      recordCount: changes.value.length
    };
  };

  const getFloorName = (floorId) => {
    const floor = FLOORS.find(f => f.id === floorId);
    return floor ? floor.name : floorId;
  };

  const getMajorName = (majorId) => {
    const major = MAJORS.find(m => m.id === majorId);
    return major ? major.name : majorId;
  };

  const getPersonName = (personId) => {
    const person = RESPONSIBLE_PERSONS.find(p => p.id === personId);
    return person ? person.name : personId;
  };

  return {
    changes,
    selectedFloorId,
    filters,
    selectedChangeId,
    isDetailDrawerOpen,
    isImportWizardOpen,
    isRevertModalOpen,
    revertChangeId,
    dataHash,
    lastUpdated,
    floorChanges,
    filteredChanges,
    floorStats,
    majorBreakdown,
    selectedChange,
    loadStoredData,
    addChange,
    updateChange,
    revertChange,
    createNewVersion,
    deleteChange,
    importChanges,
    setSelectedFloor,
    setFilters,
    resetFilters,
    openDetail,
    closeDetail,
    openRevertModal,
    closeRevertModal,
    resetAllData,
    verifyDataConsistency,
    getFloorName,
    getMajorName,
    getPersonName,
    updateDataHash
  };
});
