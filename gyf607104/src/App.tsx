import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { InspectionList } from "@/pages/InspectionList";
import { InspectionDetail } from "@/pages/InspectionDetail";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/inspection" replace />} />
          <Route path="/inspection" element={<InspectionList />} />
          <Route path="/inspection/:id" element={<InspectionDetail />} />
          <Route path="*" element={<Navigate to="/inspection" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
