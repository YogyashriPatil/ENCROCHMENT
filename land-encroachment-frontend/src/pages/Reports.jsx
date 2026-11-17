
import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Search,
  Eye,
  X,
  CalendarDays,
  MapPin,
  Building2,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Printer,
} from "lucide-react";

// Illustrative records for frontend testing.
// Replace these with backend data later.
const reportData = [
  {
    id: "RPT-001",
    caseId: "ENC-001",
    parcel: "P-101",
    location: "Zone A, Nashik",
    area: 450,
    risk: "High",
    status: "Under Review",
    date: "2026-11-12",
    confidence: 94,
    description:
      "A possible new building structure was identified near the monitored parcel boundary.",
  },
  {
    id: "RPT-002",
    caseId: "ENC-002",
    parcel: "P-102",
    location: "Zone B, Nashik",
    area: 280,
    risk: "Medium",
    status: "Under Review",
    date: "2026-11-10",
    confidence: 86,
    description:
      "A possible land-use change was identified in the latest imagery.",
  },
  {
    id: "RPT-003",
    caseId: "ENC-003",
    parcel: "P-103",
    location: "Zone C, Nashik",
    area: 620,
    risk: "High",
    status: "Verified",
    date: "2026-11-08",
    confidence: 97,
    description:
      "A potential structure expansion requires further administrative review.",
  },
  {
    id: "RPT-004",
    caseId: "ENC-004",
    parcel: "P-104",
    location: "Zone A, Nashik",
    area: 150,
    risk: "Low",
    status: "Rejected",
    date: "2026-11-05",
    confidence: 72,
    description:
      "An apparent image difference was reviewed and not considered a potential case.",
  },
];

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

export default function Reports() {
  const [reports] = useState(reportData);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const filteredReports = useMemo(() => {
    return reports.filter((report) =>
      [
        report.id,
        report.caseId,
        report.parcel,
        report.location,
      ].some((value) =>
        value.toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [reports, search]);

  const stats = {
    total: reports.length,
    verified: reports.filter((r) => r.status === "Verified").length,
    highRisk: reports.filter((r) => r.risk === "High").length,
    review: reports.filter((r) => r.status === "Under Review").length,
  };

  const downloadReport = (report) => {
    setSelectedReport(report);

    // Wait for the report preview to render before opening print.
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="min-h-screen space-y-6 text-white">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Reports & Evidence
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Generate, review and export land monitoring reports.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
          <FileCheck size={18} />
          Report Management
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Reports"
          value={stats.total}
          icon={FileText}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          title="Verified Cases"
          value={stats.verified}
          icon={ShieldCheck}
          color="bg-emerald-500/10 text-emerald-400"
        />
        <StatCard
          title="High Risk Reports"
          value={stats.highRisk}
          icon={AlertTriangle}
          color="bg-red-500/10 text-red-400"
        />
        <StatCard
          title="Awaiting Review"
          value={stats.review}
          icon={CalendarDays}
          color="bg-amber-500/10 text-amber-400"
        />
      </div>

      {/* Search */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            placeholder="Search report ID, case ID, parcel or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#0B1120] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
        <div className="border-b border-white/10 p-5">
          <h2 className="font-semibold">Generated Reports</h2>
          <p className="mt-1 text-xs text-gray-500">
            {filteredReports.length} reports found
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-[#0B1120] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-4">Report ID</th>
                <th className="px-5 py-4">Case / Parcel</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Risk</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Date</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {filteredReports.map((report) => (
                <tr
                  key={report.id}
                  className="transition hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-4 font-semibold text-blue-400">
                    {report.id}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium">{report.caseId}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {report.parcel}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-gray-300">
                    {report.location}
                  </td>

                  <td className="px-5 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs ${
                      report.risk === "High"
                        ? "bg-red-500/10 text-red-400"
                        : report.risk === "Medium"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-emerald-500/10 text-emerald-400"
                    }`}>
                      {report.risk}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-gray-300">
                    {report.status}
                  </td>

                  <td className="px-5 py-4 text-gray-400">
                    {report.date}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        title="View report"
                        className="rounded-lg border border-white/10 p-2 text-blue-400 hover:bg-blue-500/10"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => downloadReport(report)}
                        title="Export report as PDF"
                        className="rounded-lg border border-white/10 p-2 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-500">
                    No matching reports found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Preview */}
      {selectedReport && (
        <div className="rounded-xl border border-blue-500/20 bg-[#111827] p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-blue-400">
                Report Preview
              </p>
              <h2 className="mt-2 text-2xl font-bold">
                {selectedReport.id}
              </h2>
            </div>

            <button
              onClick={() => setSelectedReport(null)}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/10"
              aria-label="Close report preview"
            >
              <X size={20} />
            </button>
          </div>

          <div id="report-print-area" className="space-y-5 rounded-lg border border-white/10 bg-[#0B1120] p-5">
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold">
                TERRAWATCH
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Land Monitoring & Potential Encroachment Analysis Report
              </p>
              <p className="mt-3 text-sm">
                Report Reference: {selectedReport.id}
              </p>
            </div>

            <div>
              <h3 className="mb-3 font-semibold">Case Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Case ID</p>
                  <p className="mt-1">{selectedReport.caseId}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Parcel ID</p>
                  <p className="mt-1">{selectedReport.parcel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="mt-1">{selectedReport.location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Affected Area</p>
                  <p className="mt-1">{selectedReport.area} sq.m</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Detection Date</p>
                  <p className="mt-1">{selectedReport.date}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <p className="mt-1">{selectedReport.risk}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Review Status</p>
                  <p className="mt-1">{selectedReport.status}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Illustrative Model Confidence</p>
                  <p className="mt-1">{selectedReport.confidence}%</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="font-semibold">Detection Summary</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                {selectedReport.description}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="font-semibold">Evidence & Imagery</h3>
              <p className="mt-2 text-sm text-gray-400">
                Historical imagery, latest imagery, change-detection
                overlays and GIS parcel evidence will be attached here
                when the backend integration is completed.
              </p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-gray-500">
                  Historical Image – Pending
                </div>
                <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-gray-500">
                  Latest Image – Pending
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4">
              <h3 className="font-semibold">Important Disclaimer</h3>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                This report presents a potential change identified for
                further investigation. AI output does not establish
                illegal encroachment. Official conclusions require
                human verification and authoritative land records.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium hover:bg-blue-500"
            >
              <Printer size={17} />
              Print / Save as PDF
            </button>

            <button
              onClick={() => setSelectedReport(null)}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Demo Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle size={19} className="mt-0.5 shrink-0 text-amber-400" />
        <p className="text-xs leading-5 text-gray-400">
          All report records and confidence values are illustrative.
          Image evidence is not yet connected. Reports are generated
          from frontend demo data.
        </p>
      </div>

      {/* Print Styling */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }

          body * {
            visibility: hidden !important;
          }

          #report-print-area,
          #report-print-area * {
            visibility: visible !important;
            color: black !important;
          }

          #report-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            border: none !important;
          }

          #report-print-area .border-white\\/10 {
            border-color: #ddd !important;
          }
        }
      `}</style>
    </div>
  );
}
