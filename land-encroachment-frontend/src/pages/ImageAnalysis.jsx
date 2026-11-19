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
          accept="image/jpeg,image/png,image/webp,image/tiff"
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
    setUploadedImages([]);
    setLoading(true);

    try {
      const uploadOneImage = async (file, imageType, imageDate) => {
        const formData = new FormData();

        formData.append("image", file);
        formData.append("image_type", imageType);
        formData.append("image_date", imageDate);

        const response = await API.post(
          "/images/upload",
          formData
        );

        return response.data;
      };

      // Upload previous image first.
      const oldResult = await uploadOneImage(
        oldImage,
        oldType,
        oldDate
      );

      // Upload latest image.
      const newResult = await uploadOneImage(
        newImage,
        newType,
        newDate
      );

      setUploadedImages([
        oldResult.data,
        newResult.data,
      ]);

      setSuccess("Both images uploaded successfully to Supabase Storage!");
      setAnalysisDone(true);
      await loadGalleryImages();
    } catch (err) {
      console.error("Image upload error:", err);

      setError(
        err.response?.data?.message ||
        "Image upload failed. Please check your backend connection."
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
    setError("");
    setSuccess("");
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

          {loading ? "Uploading Images..." : "Upload & Compare"}

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
