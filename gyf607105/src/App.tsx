import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { BracketReconciliation } from "@/pages/BracketReconciliation";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BracketReconciliation />} />
        <Route path="/record/:id" element={<BracketReconciliation />} />
      </Routes>
    </Router>
  );
}
