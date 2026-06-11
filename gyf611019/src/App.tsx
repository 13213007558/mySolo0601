import { useState, useEffect } from 'react';
import InspectionPage from './pages/InspectionPage';
import QueuePage from './pages/QueuePage';
import TemplatesPage from './pages/TemplatesPage';
import ReportsPage from './pages/ReportsPage';
import DevicesPage from './pages/DevicesPage';
import { InspectionItem } from './types';
import { listInspections, generateId, createMockAnalysis, calculatePricing } from './api';

type Page = 'inspection' | 'queue' | 'templates' | 'reports' | 'devices';

export default function App() {
  const [page, setPage] = useState<Page>('inspection');
  const [items, setItems] = useState<InspectionItem[]>([]);

  useEffect(() => {
    listInspections().catch(() => {
      setItems(createMockItems());
    }).then((data) => {
      if (data && data.length > 0) setItems(data);
      else setItems(createMockItems());
    });
  }, []);

  function createMockItems(): InspectionItem[] {
    const mockSellers = [
      { id: 'S001', name: '张建国' },
      { id: 'S002', name: '李梅芳' },
      { id: 'S003', name: '王海涛' }
    ];
    const mockRecords = [
      { no: 'LP-2024-0001', title: '夜曲', artist: '周杰伦', price: 280 },
      { no: 'LP-2024-0002', title: 'Bad', artist: 'Michael Jackson', price: 580 },
      { no: 'LP-2024-0003', title: '月亮代表我的心', artist: '邓丽君', price: 420 },
      { no: 'LP-2024-0004', title: 'The Wall', artist: 'Pink Floyd', price: 680 },
      { no: 'LP-2024-0005', title: '新长征路上的摇滚', artist: '崔健', price: 350 }
    ];
    return mockRecords.map((r, i) => {
      const seller = mockSellers[i % mockSellers.length];
      const analysis = createMockAnalysis(r.no);
      return {
        id: generateId(),
        record: {
          id: generateId(),
          sellerId: seller.id,
          sellerName: seller.name,
          recordNo: r.no,
          recordTitle: r.title,
          artist: r.artist,
          originalPrice: r.price,
          weight: 120 + Math.random() * 30,
          createdAt: new Date(Date.now() - i * 3600000).toISOString()
        },
        image: null,
        analysis: i > 1 ? analysis : null,
        finalPrice: i > 1 ? calculatePricing(r.price, analysis.score) : r.price,
        status: i === 0 ? 'queue' : i === 1 ? 'analyzing' : i === 2 ? 'pending_review' : 'completed',
        position: i,
        reviewedBy: i >= 4 ? '复核员01' : undefined,
        reviewedAt: i >= 4 ? new Date().toISOString() : undefined
      };
    });
  }

  const navItems: { id: Page; label: string; icon: string }[] = [
    { id: 'inspection', label: '显微鉴定', icon: '🔬' },
    { id: 'queue', label: '鉴定队列', icon: '📋' },
    { id: 'templates', label: '纹深模板', icon: '📐' },
    { id: 'reports', label: '争议报告', icon: '📊' },
    { id: 'devices', label: '设备管理', icon: '⚙️' }
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>黑胶槽纹显微库</h1>
          <p>Vinyl Groove Microscope v1.0</p>
        </div>
        <nav className="nav">
          {navItems.map((item) => (
            <div
              key={item.id}
              className={`nav-item ${page === item.id ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
      </aside>
      <main className="main">
        {page === 'inspection' && (
          <InspectionPage items={items} setItems={setItems} />
        )}
        {page === 'queue' && <QueuePage items={items} setItems={setItems} />}
        {page === 'templates' && <TemplatesPage />}
        {page === 'reports' && <ReportsPage items={items} />}
        {page === 'devices' && <DevicesPage />}
      </main>
    </div>
  );
}
