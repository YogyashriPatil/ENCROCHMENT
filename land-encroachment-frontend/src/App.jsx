
import { Routes, Route } from "react-router-dom";

import Sidebar from "./components/layout/Sidebar";
import Topbar from "./components/layout/Topbar";

import Dashboard from "./pages/Dashboard";
import MapMonitoring from "./pages/MapMonitoring";
import ImageAnalysis from "./pages/ImageAnalysis";

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
          </Routes>
        </main>
      </div>
    </div>
  );
}
