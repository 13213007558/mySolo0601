import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AlarmWall from "@/pages/AlarmWall";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AlarmWall />} />
      </Routes>
    </Router>
  );
}
