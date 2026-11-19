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
      {analysisDone && (
        <div className="space-y-5">

          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-400" />

            <h2 className="text-xl font-semibold">
              Image Upload Successful
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
                  alt="Uploaded imagery"
                  className="w-full h-64 object-cover rounded-lg"
                />

                <p className="text-xs text-gray-400 mt-3">
                  Capture Date: {index === 0 ? oldDate : newDate}
                </p>

                <p className="text-xs text-emerald-400 mt-2">
                  {uploadedImages[index]?.storage_path}
                </p>
              </div>
            ))}

          </div>

          <div className="bg-[#111c2e] border border-yellow-500/20 rounded-2xl p-5">

            <div className="flex items-center gap-2 text-yellow-400">
              <AlertTriangle size={20} />

              <h3 className="font-semibold">
                AI Processing Status
              </h3>
            </div>

            <p className="text-gray-300 text-sm mt-3">
              Both images have been uploaded and their metadata
              saved in the database. They are ready for
              integration with the change-detection model.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-gray-400 text-xs">
                  Uploaded Images
                </p>

                <h3 className="text-2xl font-bold mt-2">
                  {uploadedImages.length}
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
              Upload and comparison preview only.
              Actual AI change detection and encroachment
              prediction have not been implemented yet.
            </p>

          </div>

          {/* Upload Results */}
          {analysisDone && (
            <div className="space-y-5">

              {/* Image Upload Successful */}
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-400" />
                <h2 className="text-xl font-semibold">
                  Image Upload Successful
                </h2>
              </div>

              {/* Your existing Previous and Latest Image preview cards */}
              {/* KEEP YOUR EXISTING IMAGE PREVIEW CODE HERE */}

              {/* REPLACE OLD YELLOW CARD WITH NEW AI RESULTS */}
              {aiAnalysis && (
                <div className="bg-[#111c2e] border border-emerald-500/20 rounded-2xl p-5 space-y-5">

                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 size={20} />
                    <h3 className="font-semibold text-lg">
                      AI Analysis Completed
                    </h3>
                  </div>

                  <p className="text-xs text-gray-400 break-all">
                    Analysis ID: {aiAnalysis.analysis_run_id}
                  </p>
                  {/* Annotated Building Detection Visualization */}
                  
                  {/* Interactive Building Detection Visualization */}
                  {aiAnalysis.visualization_url && (
                    <div className="space-y-4">

                      <h3 className="font-semibold text-lg">
                        Select a Detected Building
                      </h3>

                      <div className="relative w-full bg-black/30 rounded-xl overflow-hidden">

                        <img
                          src={aiAnalysis.visualization_url}
                          alt="Building detection visualization"
                          className="block w-full h-auto"
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
                              const [x1, y1, x2, y2] = building.bounding_box || [];

                              const isSelected =
                                selectedBuilding?.building_id === building.building_id;

                              if (
                                ![x1, y1, x2, y2].every(Number.isFinite)
                              ) {
                                return null;
                              }

                              return (
                                <g
                                  key={building.building_id}
                                  onClick={() => setSelectedBuilding(building)}
                                  style={{ pointerEvents: "auto", cursor: "pointer" }}
                                >
                                  <rect
                                    x={x1}
                                    y={y1}
                                    width={Math.max(0, x2 - x1)}
                                    height={Math.max(0, y2 - y1)}
                                    fill={isSelected ? "rgba(59,130,246,0.25)" : "transparent"}
                                    stroke={isSelected ? "#3B82F6" : "transparent"}
                                    strokeWidth={Math.max(2, visualizationSize.width / 400)}
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        )}
                      </div>

                      <p className="text-xs text-gray-400">
                        Select a building from the detection table below to inspect it.
                        Its bounding box will be highlighted in blue.
                      </p>

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

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

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
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Total Buildings</p>
                      <h3 className="text-2xl font-bold mt-2">
                        {aiAnalysis.total_buildings ?? 0}
                      </h3>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Potential Changes</p>
                      <h3 className="text-2xl font-bold text-yellow-400 mt-2">
                        {aiAnalysis.potential_changes ?? 0}
                      </h3>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-gray-400 text-xs">Saved Records</p>
                      <h3 className="text-2xl font-bold text-emerald-400 mt-2">
                        {aiAnalysis.saved_records ?? 0}
                      </h3>
                    </div>
                  </div>

                  <h3 className="font-semibold">
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
                            <td className="p-3">{building.building_id}</td>
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

                  <p className="text-xs text-gray-400">
                    AI-generated potential changes require spatial assessment
                    and human verification.
                  </p>
                </div>
              )}

            </div>
          )}

        </div>
      )}
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

            {galleryImages.map((image) => (
              <div
                key={image.id}
                className="bg-[#111c2e] border border-white/10 rounded-xl p-4"
              >
                {image.signed_url ? (
                  <img
                    src={image.signed_url}
                    alt={image.image_name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
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
    </div>
  );
}
