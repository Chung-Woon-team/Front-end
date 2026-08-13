import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { InstructionsPage } from './pages/InstructionsPage';
import { KpiPage } from './pages/KpiPage';
import { BriefingPage } from './pages/BriefingPage';
import { RevisionsPage } from './pages/RevisionsPage';
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
        <Route path="/kpi" element={<KpiPage />} />
        <Route path="/briefing" element={<BriefingPage />} />
        <Route path="/revisions" element={<RevisionsPage />} />
        <Route path="/settings" element={<PlaceholderPage title="설정" />} />
      </Route>
    </Routes>
  );
}

export default App;
