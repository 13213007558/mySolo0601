import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { InverterReview } from "@/pages/InverterReview";
import { SupplementPage } from "@/pages/SupplementPage";
import { ReviewPage } from "@/pages/ReviewPage";
import { ExportPage } from "@/pages/ExportPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<InverterReview />} />
          <Route path="/supplement" element={<SupplementPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
