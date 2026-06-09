import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ReconciliationPage } from "@/pages/ReconciliationPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ReconciliationPage />} />
      </Routes>
    </Router>
  );
}
