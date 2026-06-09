import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ReviewDesk from "@/pages/ReviewDesk";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ReviewDesk />} />
      </Routes>
    </Router>
  );
}
