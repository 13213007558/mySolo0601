import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ClassList } from "@/pages/ClassList";
import { ClassDetail } from "@/pages/ClassDetail";
import { BabyDetail } from "@/pages/BabyDetail";
import { CustomerService } from "@/pages/CustomerService";
import { AuditLogPage } from "@/pages/AuditLog";
import { ExportPage } from "@/pages/ExportPage";

function LayoutWithOutlet() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/classes" replace />} />
        <Route element={<LayoutWithOutlet />}>
          <Route path="classes" element={<ClassList />} />
          <Route path="classes/:id" element={<ClassDetail />} />
          <Route path="babies/:id" element={<BabyDetail />} />
          <Route path="customer-service" element={<CustomerService />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="export" element={<ExportPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/classes" replace />} />
      </Routes>
    </Router>
  );
}
