import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ExportPanel from "@/components/ExportPanel";

export default function ExportPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen pb-16">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-cream-100/80 border-b border-cream-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="btn-ghost flex items-center gap-1.5 text-sm py-2 px-3"
          >
            <ArrowLeft size={16} />
            返回对账台
          </button>
          <h1 className="font-display text-lg font-bold text-ink-800">导出摘要</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="card-base p-6">
          <ExportPanel />
        </div>
      </main>
    </div>
  );
}
