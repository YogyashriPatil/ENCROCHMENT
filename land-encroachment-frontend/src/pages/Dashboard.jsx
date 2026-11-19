
import { useEffect, useState } from "react";
import API from "../services/api";

import {
  Map,
  Images,
  ScanSearch,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  RefreshCw,
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

// Risk chart colors
const RISK_COLORS = ["#ef4444", "#f59e0b", "#10b981"];

function StatCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Icon size={22} className="text-emerald-400" />
        </div>

        <span className="text-xs text-emerald-400 flex items-center gap-1">
          <TrendingUp size={14} />
          Live Data
        </span>
      </div>

      <h2 className="text-3xl font-bold mt-5">
        {Number(item.value || 0).toLocaleString("en-IN")}
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
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/dashboard/stats");

      if (!response.data.success) {
        throw new Error("Unable to load dashboard data.");
      }

      setDashboardData(response.data.data);

    } catch (err) {
      console.error("Dashboard API error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Failed to load dashboard data."
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    API.get("/health")
      .then((response) => {
        setBackendStatus(response.data.status || "Connected");
      })
      .catch((error) => {
        console.error("Backend connection failed:", error);
        setBackendStatus("Disconnected");
      });

    fetchDashboardData();
  }, []);

  const statsData = dashboardData?.stats || {};

  const stats = [
    {
      title: "Total Land Parcels",
      value: statsData.total_parcels,
      unit: "Parcels",
      icon: Map,
    },
    {
      title: "Uploaded Images",
      value: statsData.total_images,
      unit: "Satellite / Drone Images",
      icon: Images,
    },
    {
      title: "Detected Changes",
      value: statsData.total_changes,
      unit: "Recorded Changes",
      icon: ScanSearch,
    },
    {
      title: "High Risk Cases",
      value: statsData.high_risk,
      unit: "Cases",
      icon: ShieldCheck,
    },
  ];

  const riskData = [
    {
      name: "High Risk",
      value: Number(statsData.high_risk || 0),
    },
    {
      name: "Medium Risk",
      value: Number(statsData.medium_risk || 0),
    },
    {
      name: "Low Risk",
      value: Number(statsData.low_risk || 0),
    },
  ];

  const monitoringData = dashboardData?.monitoring || [];
  const recentCases = dashboardData?.recentCases || [];

  const getRiskColor = (risk) => {
    switch (risk) {
      case "High":
        return "text-red-400";
      case "Medium":
        return "text-yellow-400";
      case "Low":
        return "text-emerald-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Verified":
        return "text-emerald-400";
      case "Rejected":
        return "text-red-400";
      case "Under Review":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="space-y-8">

      {/* Backend Status */}
      <div className="mt-4 rounded-xl border border-white/10 bg-[#111827] p-4">
        <p className="text-sm text-gray-400">
          Backend API Status
        </p>

        <p className={`mt-2 font-semibold ${
          backendStatus === "Disconnected"
            ? "text-red-400"
            : "text-emerald-400"
        }`}>
          {backendStatus}
        </p>
      </div>

      {/* Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Overview Dashboard
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Monitor land changes and potential encroachment activities.
          </p>
        </div>

        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Data
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Statistics */}
      {loading && !dashboardData ? (
        <div className="bg-[#111c2e] border border-white/10 rounded-xl p-8 text-center text-gray-400">
          Loading dashboard statistics...
        </div>
      ) : dashboardData && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {stats.map((item) => (
              <StatCard key={item.title} item={item} />
            ))}
          </div>

          {/* Monitoring and Risk Distribution */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

            {/* Monitoring Chart */}
            <div className="xl:col-span-2 bg-[#111c2e] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold">
                Monitoring Overview
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                Monthly detected changes and recorded cases
              </p>

              <div className="h-72 mt-6">
                {monitoringData.length > 0 ? (
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

                      <YAxis
                        stroke="#94a3b8"
                        allowDecimals={false}
                      />

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
                        name="Detected Changes"
                        stroke="#10b981"
                        fill="url(#changeGradient)"
                        strokeWidth={3}
                      />

                      <Area
                        type="monotone"
                        dataKey="cases"
                        name="Encroachment Cases"
                        stroke="#38bdf8"
                        fill="transparent"
                        strokeWidth={2}
                      />

                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No monitoring data available.
                  </div>
                )}
              </div>
            </div>

            {/* Risk Distribution */}
            <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold">
                Risk Distribution
              </h2>

              <p className="text-gray-400 text-sm mt-1">
                Based on recorded cases
              </p>

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
                      {riskData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={RISK_COLORS[index]}
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

          {/* Case Summary */}
          <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              Case Status Overview
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              {[
                {
                  label: "Under Review",
                  value: statsData.under_review,
                  color: "text-yellow-400",
                },
                {
                  label: "Verified",
                  value: statsData.verified,
                  color: "text-emerald-400",
                },
                {
                  label: "Rejected",
                  value: statsData.rejected,
                  color: "text-red-400",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-white/5 rounded-xl p-4"
                >
                  <p className="text-sm text-gray-400">
                    {item.label}
                  </p>

                  <h3 className={`text-2xl font-bold mt-2 ${item.color}`}>
                    {Number(item.value || 0).toLocaleString("en-IN")}
                  </h3>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Cases */}
          <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold">
              Recent Detection Activity
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              Latest recorded encroachment cases
            </p>

            <div className="overflow-x-auto mt-5">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-500 border-b border-white/10">
                  <tr>
                    <th className="py-3 pr-4">Case ID</th>
                    <th className="pr-4">Location</th>
                    <th className="pr-4">Area</th>
                    <th className="pr-4">Risk Level</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/5">
                  {recentCases.length > 0 ? (
                    recentCases.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 pr-4">
                          {item.case_code}
                        </td>

                        <td className="pr-4">
                          {item.location_name || "Not linked"}
                        </td>

                        <td className="pr-4">
                          {item.affected_area_sq_m != null
                            ? `${Number(item.affected_area_sq_m).toLocaleString("en-IN")} sq.m`
                            : "N/A"}
                        </td>

                        <td className={`pr-4 ${getRiskColor(item.risk_level)}`}>
                          {item.risk_level}
                        </td>

                        <td className={getStatusColor(item.status)}>
                          {item.status}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-8 text-center text-gray-500"
                      >
                        No encroachment cases recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

    </div>
  );
}
