import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { NavBar } from "@/components/NavBar";
import Home from "@/pages/Home";
import Review from "@/pages/Review";
import Supplement from "@/pages/Supplement";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-industrial-500">
        <NavBar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/review" element={<Review />} />
            <Route path="/supplement" element={<Supplement />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
