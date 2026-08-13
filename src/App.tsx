import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { YardPage } from './pages/YardPage';
import { DashboardPage } from './pages/DashboardPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { DashboardShell } from './components/layout/DashboardShell';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<DashboardShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/instructions" element={<InstructionsPage />} />
        <Route path="/yard" element={<YardPage />} />
        <Route path="/kpi" element={<PlaceholderPage title="KPI" />} />
        <Route path="/briefing" element={<PlaceholderPage title="브리핑" />} />
        <Route path="/revisions" element={<PlaceholderPage title="리비전 로그" />} />
        <Route path="/settings" element={<PlaceholderPage title="설정" />} />
      </Route>
    </Routes>
  );
}

export default App;
