
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";
import Reports from "./pages/Reports";
import Dashboard from "./pages/Dashboard";
import MapMonitoring from "./pages/MapMonitoring";
import ImageAnalysis from "./pages/ImageAnalysis";
import EncroachmentCases from "./pages/EncroachmentCases";
import Settings from "./pages/Settings";
export default function App() {
  return (
    <div className="flex h-screen bg-[#0b1423] overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        <main className="flex-1 overflow-y-auto p-8 text-white">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/map" element={<MapMonitoring />} />
            <Route path="/analysis" element={<ImageAnalysis />} />
            <Route path="/cases" element={<EncroachmentCases />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
