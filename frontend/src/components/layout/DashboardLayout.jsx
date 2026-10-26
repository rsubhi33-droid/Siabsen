import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const DashboardLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <div className="page-container animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
