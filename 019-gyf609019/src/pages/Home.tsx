import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { seedDatabase, getZones, getMeasurePointsByZone, getEvidencesByZone, getSuggestionByZone, getSuggestionVersions } from '@/db';
import Toolbar from '@/components/Toolbar';
import MeasureGrid from '@/components/MeasureGrid';
import SlopePanel from '@/components/SlopePanel';
import EvidencePanel from '@/components/EvidencePanel';
import SuggestionEditor from '@/components/SuggestionEditor';
import ExportPanel from '@/components/ExportPanel';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const {
    initialized,
    setInitialized,
    zones,
    setZones,
    selectedZoneId,
    selectZone,
    setMeasurePoints,
    setEvidences,
    setSuggestion,
    setSuggestionVersions,
  } = useAppStore();

  useEffect(() => {
    seedDatabase().then(() => {
      setInitialized(true);
    });
  }, [setInitialized]);

  useEffect(() => {
    if (!initialized) return;
    getZones().then((z) => {
      setZones(z);
      if (z.length > 0 && !selectedZoneId) {
        selectZone(z[0].id);
      }
    });
  }, [initialized, setZones, selectedZoneId, selectZone]);

  useEffect(() => {
    if (!selectedZoneId) return;
    Promise.all([
      getMeasurePointsByZone(selectedZoneId),
      getEvidencesByZone(selectedZoneId),
      getSuggestionByZone(selectedZoneId),
    ]).then(async ([points, evs, sug]) => {
      setMeasurePoints(points);
      setEvidences(evs);
      setSuggestion(sug);
      if (sug) {
        const versions = await getSuggestionVersions(sug.id);
        setSuggestionVersions(versions);
      } else {
        setSuggestionVersions([]);
      }
    });
  }, [selectedZoneId, setMeasurePoints, setEvidences, setSuggestion, setSuggestionVersions]);

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steel-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-navy-400 animate-spin" />
          <span className="text-sm text-steel-500">正在加载数据...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Toolbar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3 space-y-5">
            <MeasureGrid />
          </div>
          <div className="lg:col-span-2 space-y-5">
            <SlopePanel />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mt-5">
          <div className="lg:col-span-2">
            <EvidencePanel />
          </div>
          <div className="lg:col-span-3">
            <SuggestionEditor />
          </div>
        </div>
      </main>
      <ExportPanel />
    </div>
  );
}
