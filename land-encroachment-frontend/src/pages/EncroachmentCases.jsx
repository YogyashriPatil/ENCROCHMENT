
import { useMemo, useState } from "react";
import {
  Search,
  Filter,
  AlertTriangle,
  MapPin,
  Building2,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  X,
  ShieldCheck,
  Activity,
} from "lucide-react";

// Illustrative demo records.
// These are NOT actual AI detections or verified land records.
const initialCases = [
  {
    id: "ENC-001",
    parcel: "P-101",
    location: "Zone A, Nashik",
    area: 450,
    risk: "High",
    status: "Under Review",
    date: "2026-11-12",
    description:
      "A possible new building structure was identified near the monitored parcel boundary.",
    confidence: 94,
  },
  {
    id: "ENC-002",
    parcel: "P-102",
    location: "Zone B, Nashik",
    area: 280,
    risk: "Medium",
    status: "Under Review",
    date: "2026-11-10",
    description:
      "A possible land-use change was identified in the latest imagery.",
    confidence: 86,
  },
  {
    id: "ENC-003",
    parcel: "P-103",
    location: "Zone C, Nashik",
    area: 620,
    risk: "High",
    status: "Verified",
    date: "2026-11-08",
    description:
      "A potential structure expansion requires further administrative review.",
    confidence: 97,
  },
  {
    id: "ENC-004",
    parcel: "P-104",
    location: "Zone A, Nashik",
    area: 150,
    risk: "Low",
    status: "Rejected",
    date: "2026-11-05",
    description:
      "An apparent image difference was reviewed and not considered a potential case.",
    confidence: 72,
  },
  {
    id: "ENC-005",
    parcel: "P-105",
    location: "Zone D, Nashik",
    area: 390,
    risk: "Medium",
    status: "Under Review",
    date: "2026-11-03",
    description:
      "A possible construction footprint change was detected between image dates.",
    confidence: 89,
  },
];

const riskStyles = {
  High: "bg-red-500/10 text-red-400 border-red-500/20",
  Medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Low: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const statusStyles = {
  "Under Review":
    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Verified:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Rejected:
    "bg-gray-500/10 text-gray-400 border-gray-500/20",
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
  const [cases, setCases] = useState(initialCases);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCase, setSelectedCase] = useState(null);

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
      const searchMatch =
        item.id.toLowerCase().includes(search.toLowerCase()) ||
        item.parcel.toLowerCase().includes(search.toLowerCase()) ||
        item.location.toLowerCase().includes(search.toLowerCase());

      const riskMatch =
        riskFilter === "All" || item.risk === riskFilter;

      const statusMatch =
        statusFilter === "All" || item.status === statusFilter;

      return searchMatch && riskMatch && statusMatch;
    });
  }, [cases, search, riskFilter, statusFilter]);

  const updateStatus = (caseId, newStatus) => {
    setCases((previousCases) =>
      previousCases.map((item) =>
        item.id === caseId
          ? { ...item, status: newStatus }
          : item
      )
    );

    setSelectedCase((previous) =>
      previous?.id === caseId
        ? { ...previous, status: newStatus }
        : previous
    );
  };

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

          <div className="flex items-center gap-2">
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
              {filteredCases.map((item) => (
                <tr
                  key={item.id}
                  className="transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4 font-semibold text-blue-400">
                    {item.id}
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
                    {item.area} sq.m
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${riskStyles[item.risk]}`}
                    >
                      {item.risk}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${statusStyles[item.status]}`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-400">
                    {item.date}
                  </td>

                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedCase(item)}
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
                  <td
                    colSpan="7"
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No matching cases found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Case Details Panel */}
      {selectedCase && (
        <div className="rounded-xl border border-blue-500/20 bg-[#111827] p-5">

          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400">
                Case Details
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {selectedCase.id}
              </h2>
            </div>

            <button
              onClick={() => setSelectedCase(null)}
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
                {selectedCase.area} sq.m
              </p>
            </div>

            <div className="rounded-lg bg-[#0B1120] p-4">
              <p className="text-xs text-gray-500">
                Illustrative AI Confidence
              </p>
              <p className="mt-2 font-semibold">
                {selectedCase.confidence}%
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-white/10 p-4">
            <h3 className="font-semibold">Detection Description</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              {selectedCase.description}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-xs ${riskStyles[selectedCase.risk]}`}
            >
              {selectedCase.risk} Risk
            </span>

            <span
              className={`rounded-full border px-3 py-1 text-xs ${statusStyles[selectedCase.status]}`}
            >
              {selectedCase.status}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => updateStatus(selectedCase.id, "Verified")}
              disabled={selectedCase.status === "Verified"}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <CheckCircle2 size={17} />
              Verify Case
            </button>

            <button
              onClick={() => updateStatus(selectedCase.id, "Rejected")}
              disabled={selectedCase.status === "Rejected"}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <XCircle size={17} />
              Reject Case
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500">
            Verification actions currently update local demo state only.
            A human reviewer must check supporting imagery and land records
            before making an official determination.
          </p>
        </div>
      )}

      {/* Demo Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-400"
        />
        <p className="text-xs leading-5 text-gray-400">
          Demonstration data only. Case IDs, locations, areas, dates,
          risk scores and confidence values are illustrative. The
          application does not establish legal encroachment.
          Official decisions require human verification and authoritative
          land records.
        </p>
      </div>
    </div>
  );
}
