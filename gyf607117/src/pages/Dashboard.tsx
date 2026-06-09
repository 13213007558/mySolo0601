import StatusBar from '../components/Dashboard/StatusBar';
import ExportValidation from '../components/Dashboard/ExportValidation';
import ParkingGrid from '../components/Dashboard/ParkingGrid';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <StatusBar />
      <ExportValidation />
      <ParkingGrid />
    </div>
  );
};

export default Dashboard;
