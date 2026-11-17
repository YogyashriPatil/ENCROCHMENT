import { useEffect, useState } from "react";
import API from "../services/api";
import {
  Map,
  Building2,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
const stats = [
  {
    title: "Monitored Land Area",
    value: "12,450",
    unit: "Acres",
    change: "+8.2%",
    icon: Map,
    positive: true,
  },
  {
    title: "Buildings Detected",
    value: "2,840",
    unit: "Buildings",
    change: "+12.5%",
    icon: Building2,
    positive: true,
  },
  {
    title: "Potential Encroachments",
    value: "126",
    unit: "Cases",
    change: "+4.3%",
    icon: AlertTriangle,
    positive: false,
  },
  {
    title: "High Risk Cases",
    value: "18",
    unit: "Cases",
    change: "-2.1%",
    icon: ShieldCheck,
    positive: true,
  },
];
const monitoringData = [
  { month: "Jan", changes: 12, detections: 5 },
  { month: "Feb", changes: 18, detections: 9 },
  { month: "Mar", changes: 15, detections: 7 },
  { month: "Apr", changes: 28, detections: 14 },
  { month: "May", changes: 22, detections: 11 },
  { month: "Jun", changes: 35, detections: 19 },
  { month: "Jul", changes: 30, detections: 16 },
  { month: "Aug", changes: 42, detections: 23 },
  { month: "Sep", changes: 38, detections: 20 },
  { month: "Oct", changes: 48, detections: 29 },
  { month: "Nov", changes: 44, detections: 25 },
  { month: "Dec", changes: 55, detections: 32 },
];

const riskData = [
  { name: "High Risk", value: 18, color: "#ef4444" },
  { name: "Medium Risk", value: 42, color: "#f59e0b" },
  { name: "Low Risk", value: 66, color: "#10b981" },
];
function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Icon size={22} className="text-emerald-400" />
        </div>

        <span className={`text-xs flex items-center gap-1 ${
          item.positive ? "text-emerald-400" : "text-red-400"
        }`}>
          {item.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {item.change}
        </span>
      </div>

      <h2 className="text-3xl font-bold mt-5">
        {item.value}
      </h2>

      <p className="text-gray-400 text-sm mt-1">
        {item.title}
      </p>

      <p className="text-gray-600 text-xs mt-2">
        {item.unit}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    API.get("/health")
      .then((response) => {
        setBackendStatus(response.data.status);
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
        setBackendStatus("Disconnected");
      });
  }, []);
  return (
    <div className="space-y-8">
      <div className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
        <p className="text-sm text-gray-400">
          Backend API Status
        </p>

        <p className="mt-2 font-semibold text-emerald-400">
          {backendStatus}
        </p>
      </div>
      <div>
        <h1 className="text-2xl font-bold">
          Overview Dashboard
        </h1>

        <p className="text-gray-400 text-sm mt-2">
          Monitor land changes and potential encroachment activities.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {stats.map((item) => (
          <StatCard key={item.title} item={item} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        <div className="xl:col-span-2 bg-[#111c2e] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">
            Monitoring Overview
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Sample monitoring summary
          </p>

          <div className="h-72 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monitoringData}>

                <defs>
                  <linearGradient
                    id="changeGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#10b981"
                      stopOpacity={0.35}
                    />

                    <stop
                      offset="95%"
                      stopColor="#10b981"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#263449"
                />

                <XAxis
                  dataKey="month"
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />

                <YAxis stroke="#94a3b8" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111c2e",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="changes"
                  name="Land Changes"
                  stroke="#10b981"
                  fill="url(#changeGradient)"
                  strokeWidth={3}
                />

                <Area
                  type="monotone"
                  dataKey="detections"
                  name="New Structures"
                  stroke="#38bdf8"
                  fill="transparent"
                  strokeWidth={2}
                />

              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold">
            Risk Distribution
          </h2>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>

                <Pie
                  data={riskData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={5}
                >
                  {riskData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={entry.color}
                    />
                  ))}
                </Pie>

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111c2e",
                    border: "1px solid #334155",
                    borderRadius: "10px",
                    color: "#fff",
                  }}
                />

                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                />

              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold">
          Recent Detection Activity
        </h2>

        <p className="text-gray-400 text-sm mt-1">
          Illustrative sample cases for interface development
        </p>

        <div className="overflow-x-auto mt-5">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 border-b border-white/10">
              <tr>
                <th className="py-3">Case ID</th>
                <th>Location</th>
                <th>Area</th>
                <th>Risk Level</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              <tr>
                <td className="py-4">ENC-001</td>
                <td>Zone A</td>
                <td>450 sq.m</td>
                <td className="text-red-400">High</td>
                <td className="text-yellow-400">Under Review</td>
              </tr>

              <tr>
                <td className="py-4">ENC-002</td>
                <td>Zone B</td>
                <td>280 sq.m</td>
                <td className="text-yellow-400">Medium</td>
                <td className="text-emerald-400">Pending Review</td>
              </tr>

              <tr>
                <td className="py-4">ENC-003</td>
                <td>Zone C</td>
                <td>120 sq.m</td>
                <td className="text-emerald-400">Low</td>
                <td className="text-emerald-400">Pending Review</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
