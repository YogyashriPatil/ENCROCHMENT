import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
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
  LoaderCircle,
} from "lucide-react";

import API from "../services/api";

function ImageUploadCard({
  title,
  description,
  file,
  onChange,
  date,
  onDateChange,
  imageType,
  onImageTypeChange,
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
          accept="image/jpeg,image/png,image/tiff"
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
                PNG, JPG, JPEG, WebP, TIFF
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
        <label className="text-xs text-gray-400 mb-2 block">
          Image Source
        </label>

        <select
          value={imageType}
          onChange={(e) => onImageTypeChange(e.target.value)}
          className="w-full bg-[#0b1424] border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="Satellite">Satellite</option>
          <option value="Drone">Drone</option>
        </select>
      </div>

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

  const [oldType, setOldType] = useState("Satellite");
  const [newType, setNewType] = useState("Satellite");

  const [analysisDone, setAnalysisDone] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [visualizationSize, setVisualizationSize] = useState({
    width: 0,
    height: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryError, setGalleryError] = useState("");
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const loadGalleryImages = async () => {
    try {
      setGalleryLoading(true);
      setGalleryError("");

      const response = await API.get("/images");

      setGalleryImages(response.data.data || []);
    } catch (err) {
      console.error("Gallery loading error:", err);

      setGalleryError(
        err.response?.data?.message ||
        "Unable to retrieve uploaded images."
      );
    } finally {
      setGalleryLoading(false);
    }
  };
  useEffect(() => {
    loadGalleryImages();
  }, []);
  
  useEffect(() => {
    if (selectedGalleryIndex === null && !previewImage) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedGalleryIndex(null);
        setPreviewImage(null);
      }

      if (selectedGalleryIndex !== null && event.key === "ArrowRight") {
        setSelectedGalleryIndex((current) =>
          current === null
            ? null
            : (current + 1) % galleryImages.length
        );
      }

      if (selectedGalleryIndex !== null && event.key === "ArrowLeft") {
        setSelectedGalleryIndex((current) =>
          current === null
            ? null
            : (current - 1 + galleryImages.length) % galleryImages.length
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedGalleryIndex, galleryImages.length, previewImage]);

  const handleAnalysis = async () => {
    if (!oldImage || !newImage) {
      setError("Please upload both previous and latest images.");
      return;
    }

    if (oldDate >= newDate) {
      setError("Latest image date must be after previous image date.");
      return;
    }

    setError("");
    setSuccess("");
    setAnalysisDone(false);
    setAiAnalysis(null);
    setUploadedImages([]);
    setLoading(true);

    try {
      // Step 1: Upload an image to Supabase.
      const uploadOneImage = async (file, imageType, imageDate) => {
        const formData = new FormData();

        formData.append("image", file);
        formData.append("image_type", imageType);
        formData.append("image_date", imageDate);

        const response = await API.post("/images/upload", formData);

        return response.data;
      };

      // Step 2: Upload previous image.
      const oldResult = await uploadOneImage(
        oldImage,
        oldType,
        oldDate
      );

      const oldRecord =
        oldResult?.data ?? oldResult?.image ?? oldResult;

      // Step 3: Upload latest image.
      const newResult = await uploadOneImage(
        newImage,
        newType,
        newDate
      );

      const newRecord =
        newResult?.data ?? newResult?.image ?? newResult;

      setUploadedImages([oldRecord, newRecord]);

      // Step 4: Prepare AI request.
      const aiFormData = new FormData();

      aiFormData.append("before_image", oldImage);
      aiFormData.append("after_image", newImage);

      // Associate detections with the uploaded image records.
      if (oldRecord?.id) {
        aiFormData.append("old_image_id", oldRecord.id);
      }

      if (newRecord?.id) {
        aiFormData.append("new_image_id", newRecord.id);
      }

      // Step 5: Send images to Express -> FastAPI.
      const aiResponse = await API.post(
        "/ai/analyze",
        aiFormData,
        {
          timeout: 240000
        }
      );

      const result = aiResponse.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "AI analysis was unsuccessful."
        );
      }

      // Step 6: Display saved AI results.
      setAiAnalysis(result);
      setAnalysisDone(true);

      setSuccess(
        "AI analysis completed! Building detections have been saved in Supabase."
      );

      // Step 7: Refresh the uploaded image gallery.
      await loadGalleryImages();

    } catch (err) {
      console.error("AI image analysis error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Image upload or AI analysis failed."
      );

    } finally {
      setLoading(false);
    }
  };


  const resetAnalysis = () => {
    setOldImage(null);
    setNewImage(null);

    setOldDate("2025-01-15");
    setNewDate("2026-01-15");

    setOldType("Satellite");
    setNewType("Satellite");

    setAnalysisDone(false);
    setUploadedImages([]);
    setAiAnalysis(null);

    setError("");
    setSuccess("");

    setSelectedBuilding(null);
    setVisualizationSize({ width: 0, height: 0 });  
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
            Upload and compare satellite and drone imagery.
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
            Upload two images of the same geographical area
            captured at different times.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <ImageUploadCard
            title="Previous Image"
            description="Historical imagery"
            file={oldImage}
            onChange={setOldImage}
            date={oldDate}
            onDateChange={setOldDate}
            imageType={oldType}
            onImageTypeChange={setOldType}
            icon={Satellite}
          />

          <ImageUploadCard
            title="Latest Image"
            description="Recent satellite or drone imagery"
            file={newImage}
            onChange={setNewImage}
            date={newDate}
            onDateChange={setNewDate}
            imageType={newType}
            onImageTypeChange={setNewType}
            icon={Drone}
          />

        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm">
          <CheckCircle2 size={18} />
          {success}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">

        <button
          onClick={handleAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition"
        >
          {loading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <ScanSearch size={18} />
          )}

          {loading ? "Uploading & Running AI..." : "Upload & Analyze"}

          {!loading && <ArrowRight size={17} />}
        </button>

        <button
          onClick={resetAnalysis}
          disabled={loading}
          className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-5 py-3 rounded-xl text-sm disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Reset
        </button>

      </div>

      
      {/* Upload Results */}
      {analysisDone && aiAnalysis && (
        <div className="space-y-5">

          {/* Results Heading */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" size={22} />
            <div>
              <h2 className="text-xl font-semibold">
                AI Analysis Completed
              </h2>
              <p className="text-xs text-gray-400">
                Analysis ID: {aiAnalysis.analysis_run_id}
              </p>
            </div>
          </div>

          {/* Four Image Results */}
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-5">

            {/* Left: Before, After and Change Mask */}
            <div className="space-y-4">

              {/* Before Image */}
              <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-3">
                  1. Previous Image
                </h3>

                {aiAnalysis.before_image_url ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({
                        src: aiAnalysis.before_image_url,
                        title: "Previous Satellite Image",
                        description: `Capture Date: ${oldDate}`
                      })
                    }
                    className="block w-full cursor-zoom-in"
                  >
                    <img
                      src={aiAnalysis.before_image_url}
                      alt="Previous satellite image"
                      className="w-full h-36 object-contain bg-black/30 rounded-lg hover:opacity-80 transition"
                    />
                    <p className="text-xs text-emerald-400 mt-2 text-right">
                      <ImageIcon size={13} className="inline mr-1" />
                      Click to enlarge
                    </p>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">Previous image unavailable.</p>
                )}

                <p className="text-xs text-gray-400 mt-2">
                  Capture Date: {oldDate}
                </p>
              </div>

              {/* After Image */}
              <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-3">
                  2. Latest Image
                </h3>

                {aiAnalysis.after_image_url ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({
                        src: aiAnalysis.after_image_url,
                        title: "Latest Satellite Image",
                        description: `Capture Date: ${newDate}`
                      })
                    }
                    className="block w-full cursor-zoom-in"
                  >
                    <img
                      src={aiAnalysis.after_image_url}
                      alt="Latest satellite image"
                      className="w-full h-36 object-contain bg-black/30 rounded-lg hover:opacity-80 transition"
                    />
                    <p className="text-xs text-emerald-400 mt-2 text-right">
                      <ImageIcon size={13} className="inline mr-1" />
                      Click to enlarge
                    </p>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">Latest image unavailable.</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Capture Date: {newDate}
                </p>
              </div>

              {/* Change Detection Mask */}
              <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-3">
                  3. Change Detection Mask
                </h3>

                {aiAnalysis.change_mask_url ? (
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewImage({
                        src: aiAnalysis.change_mask_url,
                        title: "Change Detection Mask",
                        description: "White: Changed pixels | Black: Unchanged pixels"
                      })
                    }
                    className="block w-full cursor-zoom-in"
                  >
                    <img
                      src={aiAnalysis.change_mask_url}
                      alt="Change detection mask"
                      className="w-full h-36 object-contain bg-black rounded-lg hover:opacity-80 transition"
                    />
                    <p className="text-xs text-emerald-400 mt-2 text-right">
                      <ImageIcon size={13} className="inline mr-1" />
                      Click to enlarge
                    </p>
                  </button>
                ) : (
                  <p className="text-sm text-gray-400">Change mask unavailable.</p>
                )}
                <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-300">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-white rounded-sm" />
                    Changed pixels
                  </span>

                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-black border border-gray-500 rounded-sm" />
                    Unchanged pixels
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Detected Buildings */}
            <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4 space-y-4">

              <div>
                <h3 className="font-semibold text-lg">
                  4. Detected Buildings
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  YOLO building detection with ChangeFormer change analysis
                </p>
              </div>

              {aiAnalysis.visualization_url ? (
                <div className="relative w-full bg-black/30 rounded-xl overflow-hidden">

                  <img
                    src={aiAnalysis.visualization_url}
                    alt="AI detected buildings"
                    onClick={() =>
                      setPreviewImage({
                        src: aiAnalysis.visualization_url,
                        title: "AI Detected Buildings",
                        description: "YOLO building detection with ChangeFormer change analysis"
                      })
                    }
                    className="block w-full max-h-[430px] object-contain mx-auto cursor-zoom-in hover:opacity-90 transition"
                    onLoad={(event) => {
                      setVisualizationSize({
                        width: event.currentTarget.naturalWidth,
                        height: event.currentTarget.naturalHeight
                      });
                    }}
                  />

                  {visualizationSize.width > 0 && (
                    <svg
                      viewBox={`0 0 ${visualizationSize.width} ${visualizationSize.height}`}
                      preserveAspectRatio="none"
                      className="absolute inset-0 w-full h-full"
                      style={{ pointerEvents: "none" }}
                    >
                      {(aiAnalysis.data?.building_analysis || []).map((building) => {
                        const [x1, y1, x2, y2] =
                          building.bounding_box || [];

                        const isSelected =
                          selectedBuilding?.building_id === building.building_id;

                        if (![x1, y1, x2, y2].every(Number.isFinite)) {
                          return null;
                        }

                        return (
                          <g
                            key={building.building_id}
                            onClick={() => setSelectedBuilding(building)}
                            style={{
                              pointerEvents: "auto",
                              cursor: "pointer"
                            }}
                          >
                            <rect
                              x={x1}
                              y={y1}
                              width={Math.max(0, x2 - x1)}
                              height={Math.max(0, y2 - y1)}
                              fill={
                                isSelected
                                  ? "rgba(59,130,246,0.25)"
                                  : "transparent"
                              }
                              stroke={
                                isSelected ? "#3B82F6" : "transparent"
                              }
                              strokeWidth={Math.max(
                                2,
                                visualizationSize.width / 400
                              )}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Detected building visualization unavailable.
                </p>
              )}

              <p className="text-xs text-gray-400">
                Select a building from the table below to highlight it.
              </p>

              {/* Selected Building Details */}
              {selectedBuilding && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">

                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-blue-400">
                      Building #{selectedBuilding.building_id}
                    </h3>

                    <button
                      onClick={() => setSelectedBuilding(null)}
                      className="text-sm text-gray-400 hover:text-white"
                    >
                      Clear selection
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">

                    <div>
                      <p className="text-xs text-gray-400">Confidence</p>
                      <p className="font-semibold">
                        {(Number(selectedBuilding.confidence) * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Change Overlap</p>
                      <p className="font-semibold">
                        {Number(selectedBuilding.overlap_percentage).toFixed(2)}%
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Changed Pixels</p>
                      <p className="font-semibold">
                        {selectedBuilding.changed_pixels}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Total Pixels</p>
                      <p className="font-semibold">
                        {selectedBuilding.total_pixels}
                      </p>
                    </div>

                  </div>

                  <p className="text-sm">
                    Status: {selectedBuilding.detection_status}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

            <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs">Total Buildings</p>
              <h3 className="text-2xl font-bold mt-2">
                {aiAnalysis.total_buildings ?? 0}
              </h3>
            </div>

            <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs">Potential Changes</p>
              <h3 className="text-2xl font-bold text-yellow-400 mt-2">
                {aiAnalysis.potential_changes ?? 0}
              </h3>
            </div>

            <div className="bg-[#111c2e] border border-white/10 rounded-xl p-4">
              <p className="text-gray-400 text-xs">Saved Records</p>
              <h3 className="text-2xl font-bold text-emerald-400 mt-2">
                {aiAnalysis.saved_records ?? 0}
              </h3>
            </div>

          </div>

          {/* Building-wise Results Table */}
          <div className="bg-[#111c2e] border border-white/10 rounded-xl p-5">

            <h3 className="font-semibold mb-4">
              Building-wise Detection Results
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">

                <thead className="text-gray-400 border-b border-white/10">
                  <tr>
                    <th className="p-3">Building</th>
                    <th className="p-3">Confidence</th>
                    <th className="p-3">Overlap</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {(aiAnalysis.data?.building_analysis || []).map((building) => (
                    <tr
                      key={building.id || building.building_id}
                      onClick={() => setSelectedBuilding(building)}
                      className={`border-b border-white/5 cursor-pointer transition ${
                        selectedBuilding?.building_id === building.building_id
                          ? "bg-blue-500/20"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <td className="p-3">
                        {building.building_id}
                      </td>

                      <td className="p-3">
                        {(Number(building.confidence) * 100).toFixed(2)}%
                      </td>

                      <td className="p-3">
                        {Number(building.overlap_percentage).toFixed(2)}%
                      </td>

                      <td className="p-3">
                        {building.detection_status}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

            <p className="text-xs text-gray-400 mt-4">
              AI-generated potential changes require spatial assessment
              and human verification. They do not independently establish
              illegal land encroachment.
            </p>

          </div>

        </div>
      )}

      {/* Uploaded Image Gallery */}

      {/* Uploaded Image Gallery */}
      <div className="space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Uploaded Image Gallery
            </h2>

            <p className="text-gray-400 text-sm mt-1">
              Images retrieved from Supabase Storage
            </p>
          </div>

          <button
            onClick={loadGalleryImages}
            disabled={galleryLoading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {galleryError && (
          <p className="text-red-400 text-sm">
            {galleryError}
          </p>
        )}

        {galleryLoading ? (
          <p className="text-gray-400 text-sm">
            Loading uploaded images...
          </p>
        ) : galleryImages.length === 0 ? (
          <div className="bg-[#111c2e] border border-white/10 rounded-xl p-8 text-center">
            <ImageIcon
              size={35}
              className="mx-auto text-gray-500 mb-3"
            />

            <p className="text-gray-400">
              No uploaded images found.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

            {galleryImages.map((image,index) => (
              <div
                key={image.id}
                className="bg-[#111c2e] border border-white/10 rounded-xl p-4"
              >
                
              {image.signed_url ? (
                <button
                  type="button"
                  onClick={() => setSelectedGalleryIndex(index)}
                  className="block w-full text-left group relative overflow-hidden rounded-lg"
                  title="Click to view full image"
                >
                  <img
                    src={image.signed_url}
                    alt={image.image_name}
                    className="w-full h-48 object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-4 py-2 rounded-lg flex items-center gap-2 transition">
                      <ImageIcon size={15} />
                      View Full Image
                    </span>
                  </div>
                </button>
              ) : (

                  <div className="h-48 flex items-center justify-center bg-white/5 rounded-lg">
                    <ImageIcon className="text-gray-500" />
                  </div>
                )}

                <h3 className="font-medium mt-3 truncate">
                  {image.image_name}
                </h3>

                <p className="text-xs text-emerald-400 mt-2">
                  {image.image_type}
                </p>

                <p className="text-xs text-gray-400 mt-1">
                  Capture Date: {image.image_date || "Not available"}
                </p>
              </div>
            ))}

          </div>
        )}

      </div>

      {/* Full Image Preview Popup */}
      {selectedGalleryIndex !== null &&
        galleryImages[selectedGalleryIndex]?.signed_url &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onMouseDown={() => setSelectedGalleryIndex(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              className="relative w-full max-w-6xl max-h-[92vh] bg-[#111c2e] border border-white/20 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="min-w-0">
                  <h2 className="text-white font-semibold truncate">
                    {galleryImages[selectedGalleryIndex].image_name}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    {galleryImages[selectedGalleryIndex].image_type || "Image"}
                    {" • "}
                    {galleryImages[selectedGalleryIndex].image_date || "Date unavailable"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedGalleryIndex(null)}
                  className="w-10 h-10 shrink-0 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center"
                  aria-label="Close preview"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Image Preview */}
              <div className="relative flex-1 min-h-0 bg-black flex items-center justify-center p-4">
                <img
                  src={galleryImages[selectedGalleryIndex].signed_url}
                  alt={galleryImages[selectedGalleryIndex].image_name}
                  className="max-w-full max-h-[65vh] object-contain"
                />

                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGalleryIndex((current) =>
                          (current - 1 + galleryImages.length) % galleryImages.length
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-emerald-500 text-white rounded-full p-3"
                      aria-label="Previous image"
                    >
                      <ArrowRight className="rotate-180" size={22} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedGalleryIndex((current) =>
                          (current + 1) % galleryImages.length
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-emerald-500 text-white rounded-full p-3"
                      aria-label="Next image"
                    >
                      <ArrowRight size={22} />
                    </button>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-white/10">
                <div>
                  <p className="text-sm text-gray-300">
                    Source: {galleryImages[selectedGalleryIndex].image_type || "Not available"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Image {selectedGalleryIndex + 1} of {galleryImages.length}
                  </p>
                </div>

                <a
                  href={galleryImages[selectedGalleryIndex].signed_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm"
                >
                  Open Original
                </a>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* AI Analysis Image Preview Popup */}
      {previewImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-md flex items-center justify-center p-4"
            onMouseDown={() => setPreviewImage(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-label={previewImage.title}
              className="w-full max-w-7xl max-h-[94vh] bg-[#111c2e] border border-white/20 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              onMouseDown={(event) => event.stopPropagation()}
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between gap-4 p-4 border-b border-white/10">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-white truncate">
                    {previewImage.title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {previewImage.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="w-11 h-11 shrink-0 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition"
                  aria-label="Close image preview"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Full-size image */}
              <div className="flex-1 min-h-0 bg-black flex items-center justify-center p-3 sm:p-6">
                <img
                  src={previewImage.src}
                  alt={previewImage.title}
                  className="block max-w-full max-h-[76vh] w-auto h-auto object-contain"
                />
              </div>

              {/* Preview Footer */}
              <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10">
                <p className="text-xs text-gray-400">
                  Click outside the image or press Escape to close.
                </p>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm transition"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

    </div>
  );
}
