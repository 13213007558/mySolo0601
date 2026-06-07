import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header.jsx';
import RecordsList from './components/RecordsList.jsx';
import RecordDetail from './components/RecordDetail.jsx';
import ExportView from './components/ExportView.jsx';
import ChildrenView from './components/ChildrenView.jsx';

const USERS = [
  { name: '护士小陈', role: 'nurse' },
  { name: '护士小李', role: 'nurse' },
  { name: '护士小王', role: 'nurse' },
  { name: '主管王老师', role: 'supervisor' },
  { name: '早班老师', role: 'teacher' }
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('currentUser') || '护士小陈');
  const [tab, setTab] = useState('records');
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    localStorage.setItem('currentUser', currentUser);
  }, [currentUser]);

  const refresh = () => setRefreshKey(k => k + 1);

  return (
    <div className="app">
      <Header
        users={USERS}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        tab={tab}
        setTab={setTab}
        onBack={tab === 'detail' ? () => { setTab('records'); setSelectedRecordId(null); } : null}
      />
      <div className="container">
        {tab === 'records' && (
          <RecordsList
            key={refreshKey}
            currentUser={currentUser}
            onSelect={(id) => { setSelectedRecordId(id); setTab('detail'); }}
            onRefresh={refresh}
          />
        )}
        {tab === 'detail' && selectedRecordId && (
          <RecordDetail
            key={`${selectedRecordId}-${refreshKey}`}
            recordId={selectedRecordId}
            currentUser={currentUser}
            onBack={() => { setTab('records'); setSelectedRecordId(null); }}
            onRefresh={refresh}
          />
        )}
        {tab === 'export' && (
          <ExportView key={refreshKey} currentUser={currentUser} />
        )}
        {tab === 'children' && (
          <ChildrenView key={refreshKey} onRefresh={refresh} />
        )}
      </div>
    </div>
  );
}
