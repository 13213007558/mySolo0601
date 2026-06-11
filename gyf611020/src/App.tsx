import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '@/pages/Home';
import CaptureConsole from '@/pages/CaptureConsole';
import AnnotationWorkspace from '@/pages/AnnotationWorkspace';
import RecordList from '@/pages/RecordList';
import HistoryDiff from '@/pages/HistoryDiff';
import ExportCenter from '@/pages/ExportCenter';
import Settings from '@/pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/capture/:manuscriptId/:pageNum" element={<CaptureConsole />} />
        <Route path="/annotate/:captureId" element={<AnnotationWorkspace />} />
        <Route path="/records" element={<RecordList />} />
        <Route path="/diff/:manuscriptId/:pageNum" element={<HistoryDiff />} />
        <Route path="/export" element={<ExportCenter />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Router>
  );
}
