import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import RecordDetail from "@/pages/RecordDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/records/:id" element={<RecordDetail />} />
      </Routes>
    </Router>
  );
}
