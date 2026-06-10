import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import StoneDetail from "@/pages/StoneDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stone/:id" element={<StoneDetail />} />
      </Routes>
    </Router>
  );
}
