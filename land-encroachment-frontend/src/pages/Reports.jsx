
import { useEffect, useMemo, useState } from "react";
import API from "../services/api";

import {
  FileText,
  Search,
  Eye,
  X,
  CalendarDays,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Printer,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{title}</p>
        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      <h2 className="mt-4 text-3xl font-bold text-white">{value}</h2>
    </div>
  );
}

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [images, setImages] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [verificationHistory, setVerificationHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

  // Retrieve cases and uploaded images
  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      const [caseResponse, imageResponse] = await Promise.all([
        API.get("/cases"),
        API.get("/images"),
      ]);

      const caseRecords = caseResponse.data.data || [];
      const imageRecords = imageResponse.data.data || [];

      setImages(imageRecords);

      const formattedReports = caseRecords.map((item) => ({
        id: item.id,
        reportId: `RPT-${String(item.case_code || item.id).slice(-8)}`,
        caseId: item.case_code || item.id,
        parcelId: item.parcel_id,
        parcel: item.parcel_code || item.parcel_id || "Not linked",
        location: item.location_name || "Location unavailable",
        area: item.affected_area_sq_m ?? null,
        risk: item.risk_level || "Not available",
        status: item.status || "Under Review",
        date: item.created_at
          ? new Date(item.created_at).toLocaleDateString("en-IN")
          : "N/A",
        confidence: item.confidence ?? item.change_confidence ?? null,
        description: item.description || "No case description available.",
        images: imageRecords.filter(
          (image) =>
            image.parcel_id &&
            item.parcel_id &&
            image.parcel_id === item.parcel_id
        ),
      }));

      setReports(formattedReports);

      setSelectedReport((previous) => {
        if (!previous) return null;
        return formattedReports.find(
          (report) => report.id === previous.id
        ) || null;
      });

    } catch (err) {
      console.error("Fetch reports error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to retrieve report records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Fetch verification history for selected report
  const fetchVerificationHistory = async (caseId) => {
    try {
      setHistoryLoading(true);

      const response = await API.get(
        `/verifications/case/${caseId}`
      );

      setVerificationHistory(response.data.data || []);

    } catch (err) {
      console.error("Verification history error:", err);
      setVerificationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openReport = (report) => {
    setSelectedReport(report);
    setVerificationHistory([]);
    fetchVerificationHistory(report.id);
  };

  // Search reports
  const filteredReports = useMemo(() => {
    const searchText = search.toLowerCase();

    return reports.filter((report) =>
      [
        report.reportId,
        report.caseId,
        report.parcel,
        report.location,
      ].some((value) =>
        String(value).toLowerCase().includes(searchText)
      )
    );
  }, [reports, search]);

  // Real database statistics
  const stats = {
    total: reports.length,
    verified: reports.filter((r) => r.status === "Verified").length,
    highRisk: reports.filter((r) => r.risk === "High").length,
    review: reports.filter((r) => r.status === "Under Review").length,
  };

  const downloadReport = () => {
    window.print();
  };

  const riskColor = (risk) => {
    if (risk === "High") return "bg-red-500/10 text-red-400";
    if (risk === "Medium") return "bg-amber-500/10 text-amber-400";
    if (risk === "Low") return "bg-emerald-500/10 text-emerald-400";
    return "bg-gray-500/10 text-gray-400";
  };

  const statusColor = (status) => {
    if (status === "Verified") return "text-emerald-400";
    if (status === "Rejected") return "text-red-400";
    return "text-yellow-400";
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

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

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
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />

            <input
              type="text"
              placeholder="Search case ID, parcel or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-[#0B1120] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
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
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-12 text-center text-gray-400">
                    Loading reports...
                  </td>
                </tr>
              ) : (
                <>
                  {filteredReports.map((report) => (
                    <tr
                      key={report.id}
                      className="transition hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4 font-semibold text-blue-400">
                        {report.reportId}
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
                        <span className={`rounded-full px-3 py-1 text-xs ${riskColor(report.risk)}`}>
                          {report.risk}
                        </span>
                      </td>

                      <td className={`px-5 py-4 ${statusColor(report.status)}`}>
                        {report.status}
                      </td>

                      <td className="px-5 py-4 text-gray-400">
                        {report.date}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => openReport(report)}
                          title="View report"
                          className="rounded-lg border border-white/10 p-2 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredReports.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-5 py-12 text-center text-gray-500">
                        {reports.length === 0
                          ? "No reports available. Create an encroachment case first."
                          : "No matching reports found."}
                      </td>
                    </tr>
                  )}
                </>
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
                {selectedReport.reportId}
              </h2>
            </div>

            <button
              onClick={() => {
                setSelectedReport(null);
                setVerificationHistory([]);
              }}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/10"
              aria-label="Close report preview"
            >
              <X size={20} />
            </button>
          </div>

          <div
            id="report-print-area"
            className="space-y-5 rounded-lg border border-white/10 bg-[#0B1120] p-5"
          >
            <div className="border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold">TERRAWATCH</h2>

              <p className="mt-1 text-sm text-gray-400">
                Land Monitoring & Potential Encroachment Analysis Report
              </p>

              <p className="mt-3 text-sm">
                Report Reference: {selectedReport.reportId}
              </p>
            </div>

            {/* Case Information */}
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
                  <p className="mt-1 flex items-center gap-2">
                    <MapPin size={15} />
                    {selectedReport.location}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Affected Area</p>
                  <p className="mt-1">
                    {selectedReport.area != null
                      ? `${Number(selectedReport.area).toLocaleString("en-IN")} sq.m`
                      : "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Case Date</p>
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
                  <p className="text-xs text-gray-500">Model Confidence</p>
                  <p className="mt-1">
                    {selectedReport.confidence != null
                      ? `${selectedReport.confidence}%`
                      : "Not available"}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-semibold">Detection Summary</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                {selectedReport.description}
              </p>
            </div>

            {/* Image Evidence */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-semibold">Evidence & Imagery</h3>

              <p className="mt-2 text-sm text-gray-400">
                Uploaded images associated with this parcel.
              </p>

              {selectedReport.images.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {selectedReport.images.map((image) => (
                    <div
                      key={image.id}
                      className="rounded-lg border border-white/10 p-3"
                    >
                      {image.signed_url ? (
                        <img
                          src={image.signed_url}
                          alt={image.image_name}
                          className="h-48 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center rounded-lg bg-white/5 text-gray-500">
                          Image unavailable
                        </div>
                      )}

                      <p className="mt-2 truncate text-sm">
                        {image.image_name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {image.image_type} · {image.image_date || "Date unavailable"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-white/20 text-sm text-gray-500">
                  <ImageIcon size={24} className="mb-2" />
                  No images linked to this parcel.
                </div>
              )}
            </div>

            {/* Verification History */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-semibold">Verification History</h3>

              {historyLoading ? (
                <p className="mt-3 text-sm text-gray-400">
                  Loading verification history...
                </p>
              ) : verificationHistory.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {verificationHistory.map((record, index) => (
                    <div
                      key={record.id || index}
                      className="rounded-lg border border-white/10 p-4"
                    >
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className={`font-semibold ${statusColor(record.decision)}`}>
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

            {/* Disclaimer */}
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

          {/* Export */}
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={downloadReport}
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

      {/* Information Notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <AlertTriangle
          size={19}
          className="mt-0.5 shrink-0 text-amber-400"
        />

        <p className="text-xs leading-5 text-gray-400">
          Reports are generated from database case records. Images are
          displayed only when associated with the case parcel. AI
          confidence is shown only when supplied by the backend.
          Reports do not independently establish legal encroachment.
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

          #report-print-area img {
            max-height: 250px;
            object-fit: contain;
          }

          #report-print-area .border-white\\/10 {
            border-color: #ddd !important;
          }
        }
      `}</style>
    </div>
  );
}
