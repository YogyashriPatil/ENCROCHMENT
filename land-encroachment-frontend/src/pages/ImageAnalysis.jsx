
import { useState } from "react";
import {
  Upload,
  Image as ImageIcon,
  Satellite,
  Drone,
  ArrowRight,
  ScanSearch,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  CalendarDays,
  Activity,
} from "lucide-react";

function ImageUploadCard({
  title,
  description,
  file,
  onChange,
  date,
  onDateChange,
  icon: Icon,
}) {
  return (
    <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5">

      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Icon size={20} className="text-emerald-400" />
        </div>

        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {description}
          </p>
        </div>
      </div>

      <label className="block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] || null)}
        />

        <div className="h-52 border-2 border-dashed border-white/15 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center overflow-hidden transition">

          {file ? (
            <img
              src={URL.createObjectURL(file)}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <>
              <Upload size={30} className="text-emerald-400 mb-3" />

              <p className="text-sm text-gray-300">
                Click to upload image
              </p>

              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, JPEG, WebP
              </p>
            </>
          )}

        </div>
      </label>

      {file && (
        <div className="flex items-center justify-between mt-3 gap-2">
          <p className="text-xs text-emerald-400 truncate">
            {file.name}
          </p>

          <button
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-red-400"
            type="button"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className="mt-4">
        <label className="text-xs text-gray-400 flex items-center gap-2 mb-2">
          <CalendarDays size={14} />
          Image Capture Date
        </label>

        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full bg-[#0b1424] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        />
      </div>

    </div>
  );
}

export default function ImageAnalysis() {
  const [oldImage, setOldImage] = useState(null);
  const [newImage, setNewImage] = useState(null);

  const [oldDate, setOldDate] = useState("2025-01-15");
  const [newDate, setNewDate] = useState("2026-01-15");

  const [analysisDone, setAnalysisDone] = useState(false);
  const [error, setError] = useState("");

  const handleAnalysis = () => {
    if (!oldImage || !newImage) {
      setError("Please upload both old and new satellite images.");
      return;
    }

    setError("");
    setAnalysisDone(true);
  };

  const resetAnalysis = () => {
    setOldImage(null);
    setNewImage(null);
    setAnalysisDone(false);
    setError("");
  };

  return (
    <div className="space-y-7 text-white">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold">
            AI Image Analysis
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Analyze satellite and drone imagery to identify land changes.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm">
          <Activity size={16} />
          Analysis Workspace
        </div>

      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {[
          {
            title: "Image Comparison",
            description: "Compare images from different dates",
            icon: ImageIcon,
          },
          {
            title: "Change Detection",
            description: "Identify newly developed structures",
            icon: ScanSearch,
          },
          {
            title: "AI Risk Assessment",
            description: "Prioritize suspicious locations",
            icon: AlertTriangle,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-[#111c2e] border border-white/10 rounded-xl p-5"
            >
              <Icon size={22} className="text-emerald-400" />

              <h3 className="font-semibold mt-4">
                {item.title}
              </h3>

              <p className="text-xs text-gray-400 mt-2">
                {item.description}
              </p>
            </div>
          );
        })}

      </div>

      {/* Upload Section */}
      <div>
        <div className="mb-5">
          <h2 className="text-lg font-semibold">
            Upload Satellite Images
          </h2>

          <p className="text-gray-400 text-sm mt-1">
            Upload two images of the same geographical area captured at different times.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <ImageUploadCard
            title="Previous Image"
            description="Historical satellite imagery"
            file={oldImage}
            onChange={setOldImage}
            date={oldDate}
            onDateChange={setOldDate}
            icon={Satellite}
          />

          <ImageUploadCard
            title="Latest Image"
            description="Recent satellite or drone imagery"
            file={newImage}
            onChange={setNewImage}
            date={newDate}
            onDateChange={setNewDate}
            icon={Drone}
          />

        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">

        <button
          onClick={handleAnalysis}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition"
        >
          <ScanSearch size={18} />
          Compare Images
          <ArrowRight size={17} />
        </button>

        <button
          onClick={resetAnalysis}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-xl text-sm"
        >
          <RefreshCw size={16} />
          Reset
        </button>

      </div>

      {/* Demonstration Results */}
      {analysisDone && (
        <div className="space-y-5">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" />

            <h2 className="text-xl font-semibold">
              Image Comparison Preview
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {[oldImage, newImage].map((file, index) => (
              <div
                key={index}
                className="bg-[#111c2e] border border-white/10 rounded-xl p-4"
              >
                <h3 className="font-medium mb-3">
                  {index === 0 ? "Previous Image" : "Latest Image"}
                </h3>

                <img
                  src={URL.createObjectURL(file)}
                  alt="Uploaded satellite imagery"
                  className="w-full h-64 object-cover rounded-lg"
                />

                <p className="text-xs text-gray-400 mt-3">
                  {index === 0 ? oldDate : newDate}
                </p>
              </div>
            ))}

          </div>

          <div className="bg-[#111c2e] border border-yellow-500/20 rounded-2xl p-5">

            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle size={20} />

              <h3 className="font-semibold">
                Analysis Preview
              </h3>
            </div>

            <p className="text-gray-300 text-sm mt-3">
              Both images have been uploaded successfully. They are ready
              for processing by the change-detection model.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-xs">
                  Uploaded Images
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  2
                </h3>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-xs">
                  Processing Status
                </p>

                <h3 className="text-lg font-semibold text-yellow-400 mt-2">
                  Awaiting AI Processing
                </h3>
              </div>

            </div>

            <p className="text-xs text-gray-500 mt-4">
              This is an upload and comparison preview only.
              No actual AI change detection or encroachment prediction
              has been performed yet.
            </p>

          </div>

        </div>
      )}

    </div>
  );
}
