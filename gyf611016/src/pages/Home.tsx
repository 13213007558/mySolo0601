import { useEffect } from "react";
import { useGradingStore } from "@/store/gradingStore";
import { TopBar } from "@/components/TopBar";
import { EditWorkbench } from "@/components/EditWorkbench";
import { VersionCompareView } from "@/components/VersionCompareView";
import { CertificateView } from "@/components/CertificateView";
import { CustomerPreview } from "@/components/CustomerPreview";
import { useMemo, useState } from "react";

export default function Home() {
  const viewMode = useGradingStore((s) => s.viewMode);
  const isCustomerScreen = useGradingStore((s) => s.isCustomerScreen);

  const [isCustomerPreview, setIsCustomerPreview] = useState(false);

  useEffect(() => {
    const checkHash = () => {
      setIsCustomerPreview(window.location.hash === "#customer-preview");
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  const mainView = useMemo(() => {
    if (viewMode === "version_compare") return <VersionCompareView />;
    if (viewMode === "certificate") return <CertificateView />;
    if (viewMode === "preview_customer") return <CustomerPreview />;
    return <EditWorkbench />;
  }, [viewMode]);

  if (isCustomerPreview || isCustomerScreen) {
    return <CustomerPreview />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-jade-50/30 overflow-hidden">
      <TopBar />
      {mainView}
    </div>
  );
}
