import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import MapOverview from '@/pages/MapOverview'
import HotspotConfirm from '@/pages/HotspotConfirm'
import DogList from '@/pages/DogList'
import DogDetail from '@/pages/DogDetail'
import DailySummary from '@/pages/DailySummary'
import Arbitration from '@/pages/Arbitration'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<MapOverview />} />
          <Route path="/confirm/:hotspotId" element={<HotspotConfirm />} />
          <Route path="/dogs" element={<DogList />} />
          <Route path="/dogs/:dogId" element={<DogDetail />} />
          <Route path="/summary" element={<DailySummary />} />
          <Route path="/arbitration" element={<Arbitration />} />
        </Route>
      </Routes>
    </Router>
  )
}
