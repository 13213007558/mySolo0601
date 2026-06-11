import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { UploadPage } from '@/pages/UploadPage'
import { AnnotationPage } from '@/pages/AnnotationPage'
import { BatchesPage } from '@/pages/BatchesPage'
import { InspectionPage } from '@/pages/InspectionPage'
import { QueuePage } from '@/pages/QueuePage'
import { ExportPage } from '@/pages/ExportPage'
import { useAppStore } from '@/store/appStore'
import './index.css'

function App() {
  const { currentPage } = useAppStore()

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />
      case 'upload':
        return <UploadPage />
      case 'annotation':
        return <AnnotationPage />
      case 'batches':
        return <BatchesPage />
      case 'inspection':
        return <InspectionPage />
      case 'queue':
        return <QueuePage />
      case 'export':
        return <ExportPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <AppLayout>
      {renderPage()}
    </AppLayout>
  )
}

export default App
