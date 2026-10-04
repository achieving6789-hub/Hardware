import React, { useState } from 'react';
import { useAuth, AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { LiveMilkingPage } from './pages/LiveMilkingPage';
import { CowsPage } from './pages/CowsPage';
import { CowDetailPage } from './pages/CowDetailPage';
import { SessionsPage } from './pages/SessionsPage';
import { HealthPage } from './pages/HealthPage';
import { AlertsPage } from './pages/AlertsPage';
import { SensorsPage } from './pages/SensorsPage';
import { CipPage } from './pages/CipPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DemoPage } from './pages/DemoPage';
import { SettingsPage } from './pages/SettingsPage';
import { Activity } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCowId, setSelectedCowId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string>('ADMIN');

  React.useEffect(() => {
    if (user?.role) {
      setCurrentRole(user.role);
    }
  }, [user?.role]);

  const handleNavigate = (page: string, params?: any) => {
    if (page === 'cow-detail' && params?.cowId) {
      setSelectedCowId(params.cowId);
      setActivePage('cow-detail');
    } else {
      setActivePage(page);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-400">
        <Activity className="h-8 w-8 animate-spin text-cyan-400 mr-3" />
        <span>Initializing SmartDairy AI System...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 overflow-hidden font-sans text-slate-100">
      <Header onNavigate={handleNavigate} activePage={activePage} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activePage={activePage}
          onNavigate={handleNavigate}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {activePage === 'dashboard' && (
            <DashboardPage
              onNavigate={handleNavigate}
              currentRole={currentRole}
              onRoleChange={setCurrentRole}
            />
          )}
          {activePage === 'live-milking' && <LiveMilkingPage onNavigate={handleNavigate} />}
          {activePage === 'cows' && <CowsPage onNavigate={handleNavigate} />}
          {activePage === 'cow-detail' && selectedCowId && (
            <CowDetailPage cowId={selectedCowId} onNavigate={handleNavigate} />
          )}
          {activePage === 'sessions' && <SessionsPage />}
          {activePage === 'health' && <HealthPage onNavigate={handleNavigate} />}
          {activePage === 'alerts' && <AlertsPage />}
          {activePage === 'sensors' && <SensorsPage />}
          {activePage === 'cip' && <CipPage />}
          {activePage === 'analytics' && <AnalyticsPage />}
          {activePage === 'demo' && <DemoPage onNavigate={handleNavigate} />}
          {activePage === 'settings' && <SettingsPage />}
        </main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
