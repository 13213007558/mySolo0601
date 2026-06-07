import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FollowUpListPage from "@/pages/FollowUpListPage";
import FollowUpDetailPage from "@/pages/FollowUpDetailPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FollowUpListPage />} />
        <Route path="/record/:id" element={<FollowUpDetailPage />} />
      </Routes>
    </Router>
  );
}
