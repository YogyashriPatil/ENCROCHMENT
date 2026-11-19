
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

import {
  Search,
  Filter,
  AlertTriangle,
  MapPin,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
  ShieldCheck,
  Activity,
  RefreshCw,
} from "lucide-react";

const riskStyles = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusStyles = {
  "Under Review": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Verified: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Rejected: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <h2 className="mt-4 text-3xl font-bold text-white">
        {value}
      </h2>
    </div>
  );
}

export default function EncroachmentCases() {
  const [cases, setCases] = useState([]);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCase, setSelectedCase] = useState(null);

  const [verificationHistory, setVerificationHistory] = useState([]);
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Retrieve real cases from PostgreSQL
  const fetchCases = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/cases");
      const records = response.data.data || [];

      const formattedCases = records.map((item) => ({
        ...item,
        displayId: item.case_code || item.id,
        parcel: item.parcel_code || item.parcel_id || "Not linked",
        location: item.location_name || "Location unavailable",
        area: item.affected_area_sq_m,
        risk: item.risk_level,
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-IN")
          : "N/A",
        confidence: item.confidence ?? item.change_confidence ?? null,
      }));

      setCases(formattedCases);

      // Keep the selected case updated after a refresh
      setSelectedCase((previous) => {
        if (!previous) return null;
        return formattedCases.find((item) => item.id === previous.id) || null;
      });

    } catch (err) {
      console.error("Fetch cases error:", err);
      setError(
        err.response?.data?.message ||
        "Unable to retrieve encroachment cases."
      );
    } finally {
      setLoading(false);
    }
  };

  // Retrieve verification history for selected case
  const fetchVerificationHistory = async (caseId) => {
    try {
      const response = await API.get(
        `/verifications/case/${caseId}`
      );

      setVerificationHistory(response.data.data || []);
    } catch (err) {
      console.error("Verification history error:", err);
      setVerificationHistory([]);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const stats = {
    total: cases.length,
    high: cases.filter((item) => item.risk === "High").length,
    review: cases.filter(
      (item) => item.status === "Under Review"
    ).length,
    verified: cases.filter(
      (item) => item.status === "Verified"
    ).length,
  };

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const searchText = search.toLowerCase();

      const searchMatch =
        String(item.displayId).toLowerCase().includes(searchText) ||
        String(item.parcel).toLowerCase().includes(searchText) ||
        String(item.location).toLowerCase().includes(searchText);

      const riskMatch =
        riskFilter === "All" || item.risk === riskFilter;

      const statusMatch =
        statusFilter === "All" || item.status === statusFilter;

      return searchMatch && riskMatch && statusMatch;
    });
  }, [cases, search, riskFilter, statusFilter]);

  const openCaseDetails = (item) => {
    setSelectedCase(item);
    setRemarks("");
    setSuccess("");
    fetchVerificationHistory(item.id);
  };

  // Submit human verification to the backend
  const submitVerification = async (decision) => {
    if (!selectedCase) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await API.post("/verifications", {
        case_id: selectedCase.id,
        reviewer_id: null,
        decision,
        remarks: remarks.trim(),
      });

      setSuccess(
        decision === "Verified"
          ? "Case verification submitted successfully."
          : "Case rejection submitted successfully."
      );

      await fetchCases();
      await fetchVerificationHistory(selectedCase.id);

      setSelectedCase((previous) =>
        previous
          ? { ...previous, status: decision }
          : null
      );

      setRemarks("");

    } catch (err) {
      console.error("Verification submission error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to submit verification."
      );
    } finally {
      setSaving(false);
    }
  };

  const getRiskColor = (risk) => riskStyles[risk] || "text-gray-400";

  const getStatusColor = (status) =>
    statusStyles[status] || "text-gray-400";

  return (
    <div className="min-h-screen space-y-6 text-white">

      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Encroachment Cases
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Review and manage potential land encroachment cases.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
          <Activity size={17} />
          Case Monitoring Active
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {success}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Cases"
          value={stats.total}
          icon={FileText}
          color="bg-blue-500/10 text-blue-400"
        />

        <StatCard
          title="High Risk Cases"
          value={stats.high}
          icon={AlertTriangle}
          color="bg-red-500/10 text-red-400"
        />

        <StatCard
          title="Under Review"
          value={stats.review}
          icon={Clock}
          color="bg-amber-500/10 text-amber-400"
        />

        <StatCard
          title="Verified Cases"
          value={stats.verified}
          icon={ShieldCheck}
          color="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search by case ID, parcel ID or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={18} className="text-gray-400" />

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0B1120] px-3 py-3 text-sm text-white outline-none"
            >
              <option value="All">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#0B1120] px-3 py-3 text-sm text-white outline-none"
            >
              <option value="All">All Status</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>

            <button
              onClick={fetchCases}
              disabled={loading}
              className="rounded-lg border border-white/10 bg-white/5 p-3 text-gray-300 hover:bg-white/10"
              title="Refresh cases"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Cases Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <h2 className="font-semibold text-white">
              Detected Cases
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              {filteredCases.length} records found
            </p>
          </div>

          <FileText className="text-gray-500" size={21} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-[#0B1120] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Case ID</th>
                <th className="px-5 py-4">Parcel / Location</th>
                <th className="px-5 py-4">Area</th>
                <th className="px-5 py-4">Risk Level</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                    Loading cases...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredCases.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-semibold text-blue-400">
                        {item.displayId}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-white">
                          {item.parcel}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.location}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-gray-300">
                        {item.area != null
                          ? `${Number(item.area).toLocaleString("en-IN")} sq.m`
                          : "N/A"}
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${getRiskColor(item.risk)}`}>
                          {item.risk}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {item.date}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => openCaseDetails(item)}
                          className="flex items-center gap-2 rounded-lg border border-blue-500/20 px-3 py-2 text-xs text-blue-400 transition hover:bg-blue-500/10"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredCases.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-gray-500">
                        {cases.length === 0
                          ? "No encroachment cases available in the database."
                          : "No matching cases found."}
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details */}
      {selectedCase && (
        <div className="rounded-xl border border-blue-500/20 bg-[#111827] p-5">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400">
                Case Details
              </p>

              <h2 className="mt-2 text-2xl font-bold">
                {selectedCase.displayId}
              </h2>
            </div>

            <button
              onClick={() => {
                setSelectedCase(null);
                setVerificationHistory([]);
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
              aria-label="Close case details"
            >
              <X size={20} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg bg-[#0B1120] p-4">
              <p className="text-xs text-gray-500">Parcel ID</p>
              <p className="mt-2 font-semibold">{selectedCase.parcel}</p>
            </div>

            <div className="rounded-lg bg-[#0B1120] p-4">
              <p className="text-xs text-gray-500">Location</p>
              <p className="mt-2 flex items-center gap-2 font-semibold">
                <MapPin size={15} className="text-blue-400" />
                {selectedCase.location}
              </p>
            </div>

            <div className="rounded-lg bg-[#0B1120] p-4">
              <p className="text-xs text-gray-500">Affected Area</p>
              <p className="mt-2 font-semibold">
                {selectedCase.area != null
                  ? `${selectedCase.area} sq.m`
                  : "N/A"}
              </p>
            </div>

            <div className="rounded-lg bg-[#0B1120] p-4">
              <p className="text-xs text-gray-500">Detection Confidence</p>
              <p className="mt-2 font-semibold">
                {selectedCase.confidence != null
                  ? `${selectedCase.confidence}%`
                  : "Not available"}
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-white/10 p-4">
            <h3 className="font-semibold">Detection Description</h3>

            <p className="mt-2 text-sm leading-6 text-gray-400">
              {selectedCase.description || "No description available."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className={`rounded-full border px-3 py-1 text-xs ${getRiskColor(selectedCase.risk)}`}>
              {selectedCase.risk} Risk
            </span>

            <span className={`rounded-full border px-3 py-1 text-xs ${getStatusColor(selectedCase.status)}`}>
              {selectedCase.status}
            </span>
          </div>

          {/* Reviewer Remarks */}
          {selectedCase.status === "Under Review" && (
            <div className="mt-5">
              <label className="mb-2 block text-sm text-gray-300">
                Reviewer Remarks
              </label>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter your observations and verification remarks..."
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-[#0B1120] p-3 text-sm text-white outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Verification Actions */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => submitVerification("Verified")}
              disabled={saving || selectedCase.status !== "Under Review"}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 size={17} />
              {saving ? "Submitting..." : "Verify Case"}
            </button>

            <button
              onClick={() => submitVerification("Rejected")}
              disabled={saving || selectedCase.status !== "Under Review"}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XCircle size={17} />
              Reject Case
            </button>
          </div>

          {/* Verification History */}
          <div className="mt-7 border-t border-white/10 pt-5">
            <h3 className="font-semibold">
              Verification History
            </h3>

            {verificationHistory.length > 0 ? (
              <div className="mt-4 space-y-3">
                {verificationHistory.map((record, index) => (
                  <div
                    key={record.id || index}
                    className="rounded-lg border border-white/10 bg-[#0B1120] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className={`text-sm font-semibold ${
                        record.decision === "Verified"
                          ? "text-emerald-400"
                          : record.decision === "Rejected"
                          ? "text-red-400"
                          : "text-yellow-400"
                      }`}>
                        {record.decision}
                      </span>

                      <span className="text-xs text-gray-500">
                        {record.reviewed_at
                          ? new Date(record.reviewed_at).toLocaleString("en-IN")
                          : ""}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">
                      {record.remarks || "No remarks provided."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                No verification history available.
              </p>
            )}
          </div>

          <p className="mt-5 text-xs leading-5 text-gray-500">
            Verification is a human review decision based on available
            evidence. It does not independently establish legal encroachment.
            Official determinations require authoritative land records
            and appropriate administrative review.
          </p>
        </div>
      )}

      {/* Information Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p className="text-xs leading-5 text-gray-400">
          Cases displayed here are retrieved from the project database.
          AI detection results require separate model integration.
          Human verification and authoritative land records are necessary
          for official determinations.
        </p>
      </div>

    </div>
  );
}
