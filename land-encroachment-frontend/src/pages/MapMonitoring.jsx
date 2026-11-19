
import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  LayersControl,
  LayerGroup,
  ZoomControl,
  Popup,
} from "react-leaflet";

import {
  MapPin,
  Layers,
  AlertTriangle,
  Activity,
  Maximize2,
  RefreshCw,
} from "lucide-react";

import API from "../services/api";

const DEFAULT_CENTER = [19.9975, 73.7860];

function getPolygonPositions(geojson) {
  if (!geojson?.coordinates) return [];

  const convertRing = (ring) =>
    ring.map(([lng, lat]) => [lat, lng]);

  if (geojson.type === "Polygon") {
    return geojson.coordinates.map(convertRing);
  }

  if (geojson.type === "MultiPolygon") {
    return geojson.coordinates.map((polygon) =>
      polygon.map(convertRing)
    );
  }

  return [];
}

function getStatus(caseItem) {
  if (caseItem.status === "Verified") return "Verified";
  if (caseItem.status === "Rejected") return "Rejected";
  return "Under Review";
}

export default function MapMonitoring() {
  const [parcels, setParcels] = useState([]);
  const [changes, setChanges] = useState([]);
  const [cases, setCases] = useState([]);
  const [spatialResults, setSpatialResults] = useState([]);
  const [showOverlaps, setShowOverlaps] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [showRiskLayer, setShowRiskLayer] = useState(true);
  const [showParcels, setShowParcels] = useState(true);
  const [showChanges, setShowChanges] = useState(true);
  const [showCases, setShowCases] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadGISData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        parcelResponse,
        changeResponse,
        caseResponse,
        spatialResponse,
        riskResponse,
      ] = await Promise.all([
        API.get("/parcels"),
        API.get("/changes"),
        API.get("/cases"),
        API.get("/gis/spatial-analysis"),
        API.get("/gis/risk-assessment"),
      ]);

      const parcelData = parcelResponse.data.data || [];
      const changeData = changeResponse.data.data || [];
      const caseData = caseResponse.data.data || [];
      
      setParcels(parcelData);
      setChanges(changeData);
      setCases(caseData);
      setSpatialResults(spatialResponse.data.data || []);
      setRiskAssessments(riskResponse.data.data || []);
      setSelectedParcel((previous) => {
        if (previous) {
          return parcelData.find(
            (parcel) => parcel.id === previous.id
          ) || parcelData[0] || null;
        }

        return parcelData[0] || null;
      });
    } catch (err) {
      console.error("GIS loading error:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load GIS data. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGISData();
  }, []);

  const totalHighRisk = cases.filter(
    (item) => item.risk_level === "High"
  ).length;

  const stats = [
    {
      title: "Total Parcels",
      value: parcels.length,
      icon: MapPin,
      color: "text-blue-400",
    },
    {
      title: "Detected Changes",
      value: changes.length,
      icon: Activity,
      color: "text-emerald-400",
    },
    {
      title: "Potential Cases",
      value: cases.length,
      icon: AlertTriangle,
      color: "text-red-400",
    },
    {
      title: "High Risk Cases",
      value: totalHighRisk,
      icon: AlertTriangle,
      color: "text-yellow-400",
    },
    
  ];

  const selectedCases = selectedParcel
    ? cases.filter(
        (item) => item.parcel_id === selectedParcel.id
      )
    : [];
  const selectedSpatialResults = selectedParcel
    ? spatialResults.filter(
        (item) => item.parcel_id === selectedParcel.id
      )
    : [];

  const selectedRiskAssessments = selectedParcel
    ? riskAssessments.filter(
        (item) => item.parcel_id === selectedParcel.id
      )
    : [];
  const selectedChanges = selectedParcel
    ? changes.filter(
        (item) => item.parcel_id === selectedParcel.id
      )
    : [];

  return (
    <div className="space-y-6 text-white">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            GIS Monitoring
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Monitor land parcels and potential changes using GIS data.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl">
          <Activity size={16} />
          Live Database Connection
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="bg-[#111c2e] border border-white/10 rounded-xl p-5"
            >
              <div className="flex justify-between items-center">
                <p className="text-gray-400 text-sm">
                  {item.title}
                </p>

                <Icon size={20} className={item.color} />
              </div>

              <h2 className="text-2xl font-bold mt-3">
                {item.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-[#111c2e] border border-white/10 rounded-xl p-5 text-gray-300">
          Loading GIS data...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400">
          {error}

          <button
            onClick={loadGISData}
            className="ml-3 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Map and Details */}
      {!loading && !error && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

          {/* Map */}
          <div className="xl:col-span-3 bg-[#111c2e] border border-white/10 rounded-2xl p-4">

            <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">
              <div>
                <h2 className="font-semibold text-lg">
                  Interactive Land Map
                </h2>

                <p className="text-gray-400 text-xs mt-1">
                  Real parcel and detected-change records
                </p>
              </div>

              <button
                onClick={loadGISData}
                className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg"
              >
                <RefreshCw size={15} />
                Refresh Map
              </button>
            </div>

            {/* Layer Controls */}
            <div className="flex flex-wrap gap-3 mb-4">
              {[
                {
                  label: "Parcels",
                  checked: showParcels,
                  setter: setShowParcels,
                  color: "bg-blue-500",
                },
                {
                  label: "Detected Changes",
                  checked: showChanges,
                  setter: setShowChanges,
                  color: "bg-emerald-500",
                },
                {
                  label: "Potential Cases",
                  checked: showCases,
                  setter: setShowCases,
                  color: "bg-red-500",
                },
                {
                  label: "Spatial Overlaps",
                  checked: showOverlaps,
                  setter: setShowOverlaps,
                  color: "bg-yellow-500",
                },
                {
                  label: "Risk Assessment",
                  checked: showRiskLayer,
                  setter: setShowRiskLayer,
                  color: "bg-red-500",
                },
              ].map((layer) => (
                <label
                  key={layer.label}
                  className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer bg-white/5 px-3 py-2 rounded-lg"
                >
                  <input
                    type="checkbox"
                    checked={layer.checked}
                    onChange={(e) =>
                      layer.setter(e.target.checked)
                    }
                    className="accent-emerald-500"
                  />

                  <span className={`w-2 h-2 rounded-full ${layer.color}`} />

                  {layer.label}
                </label>
              ))}
            </div>

            {/* Leaflet */}
            <div className="h-[500px] rounded-xl overflow-hidden border border-white/10">

              <MapContainer
                center={DEFAULT_CENTER}
                zoom={17}
                scrollWheelZoom={true}
                zoomControl={false}
                className="h-full w-full"
              >
                <ZoomControl position="bottomright" />

                <LayersControl position="topright">

                  <LayersControl.BaseLayer
                    checked
                    name="Satellite Imagery"
                  >
                    <TileLayer
                      attribution="Tiles &copy; Esri"
                      url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    />
                  </LayersControl.BaseLayer>

                  <LayersControl.BaseLayer name="Street Map">
                    <TileLayer
                      attribution="&copy; OpenStreetMap contributors"
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                  </LayersControl.BaseLayer>

                  {/* Parcel Boundaries */}
                  {showParcels && (
                    <LayersControl.Overlay
                      checked
                      name="Land Parcels"
                    >
                      <LayerGroup>
                        {parcels.map((parcel) => {
                          const positions = getPolygonPositions(
                            parcel.boundary
                          );

                          if (!positions.length) return null;

                          return positions.map((polygon, index) => (
                            <Polygon
                              key={`${parcel.id}-${index}`}
                              positions={polygon}
                              pathOptions={{
                                color:
                                  selectedParcel?.id === parcel.id
                                    ? "#facc15"
                                    : "#3b82f6",
                                weight: 2,
                                fillColor: "#3b82f6",
                                fillOpacity: 0.12,
                              }}
                              eventHandlers={{
                                click: () => setSelectedParcel(parcel),
                              }}
                            >
                              <Popup>
                                <strong>{parcel.parcel_code}</strong>
                                <br />
                                {parcel.location_name || "Location unavailable"}
                                <br />
                                Area: {parcel.area_sq_m ?? "N/A"} sq.m
                              </Popup>
                            </Polygon>
                          ));
                        })}
                      </LayerGroup>
                    </LayersControl.Overlay>
                  )}

                  {/* Detected Changes */}
                  {showChanges && (
                    <LayersControl.Overlay
                      checked
                      name="Detected Changes"
                    >
                      <LayerGroup>
                        {changes.map((change) => {
                          const positions = getPolygonPositions(
                            change.change_geometry
                          );

                          if (!positions.length) return null;

                          return positions.map((polygon, index) => (
                            <Polygon
                              key={`${change.id}-${index}`}
                              positions={polygon}
                              pathOptions={{
                                color: "#10b981",
                                fillColor: "#10b981",
                                fillOpacity: 0.4,
                                weight: 2,
                              }}
                            >
                              <Popup>
                                <strong>
                                  {change.change_type || "Detected change"}
                                </strong>
                                <br />
                                Confidence: {change.confidence ?? "N/A"}%
                                <br />
                                Affected area: {change.affected_area_sq_m ?? "N/A"} sq.m
                              </Popup>
                            </Polygon>
                          ));
                        })}
                      </LayerGroup>
                    </LayersControl.Overlay>
                  )}

                  {/* Spatial Analysis Overlaps */}
                  {showOverlaps && (
                    <LayersControl.Overlay
                      checked
                      name="Spatial Analysis Overlaps"
                    >
                      <LayerGroup>
                        {spatialResults.map((result) => {
                          const positions = getPolygonPositions(
                            result.overlap_geojson
                          );

                          if (!positions.length) return null;

                          return positions.map((polygon, index) => (
                            <Polygon
                              key={`${result.change_id}-${index}`}
                              positions={polygon}
                              pathOptions={{
                                color: "#facc15",
                                fillColor: "#facc15",
                                fillOpacity: 0.55,
                                weight: 3,
                              }}
                            >
                              <Popup>
                                <strong>Spatial Overlap</strong>
                                <br />
                                Parcel: {result.parcel_code}
                                <br />
                                Overlap Area: {result.overlap_area_sq_m} sq.m
                                <br />
                                Overlap Percentage: {result.overlap_percentage}%
                                <br />
                                Change Type: {result.change_type || "N/A"}
                              </Popup>
                            </Polygon>
                          ));
                        })}
                      </LayerGroup>
                    </LayersControl.Overlay>
                  )}


                  {/* Risk Assessment Layer */}
                  {showRiskLayer && (
                    <LayersControl.Overlay
                      checked
                      name="Risk Assessment"
                    >
                      <LayerGroup>
                        {riskAssessments.map((risk) => {
                          const change = changes.find(
                            (item) => item.id === risk.change_id
                          );

                          const positions = getPolygonPositions(
                            change?.change_geometry
                          );

                          if (!positions.length) return null;

                          const color =
                            risk.risk_level === "High"
                              ? "#ef4444"
                              : risk.risk_level === "Medium"
                              ? "#f59e0b"
                              : "#22c55e";

                          return positions.map((polygon, index) => (
                            <Polygon
                              key={`${risk.change_id}-${index}`}
                              positions={polygon}
                              pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.20,
                                weight: 3,
                                dashArray: "5 5",
                              }}
                            >
                              <Popup>
                                <strong>Risk Assessment</strong>
                                <br />
                                Parcel: {risk.parcel_code}
                                <br />
                                Risk Level: {risk.risk_level}
                                <br />
                                Risk Score: {risk.risk_score}/100
                                <br />
                                Overlap Area: {risk.overlap_area_sq_m} sq.m
                                <br />
                                Overlap: {risk.overlap_percentage}%
                              </Popup>
                            </Polygon>
                          ));
                        })}
                      </LayerGroup>
                    </LayersControl.Overlay>
                  )}

                  

                  {/* Potential Cases */}
                  {showCases && (
                    <LayersControl.Overlay
                      checked
                      name="Potential Cases"
                    >
                      <LayerGroup>
                        {cases.map((caseItem) => {
                          const change = changes.find(
                            (item) => item.id === caseItem.detected_change_id
                          );

                          const positions = getPolygonPositions(
                            change?.change_geometry
                          );

                          if (!positions.length) return null;

                          const color =
                            caseItem.risk_level === "High"
                              ? "#ef4444"
                              : caseItem.risk_level === "Medium"
                              ? "#f59e0b"
                              : "#22c55e";

                          return positions.map((polygon, index) => (
                            <Polygon
                              key={`${caseItem.id}-${index}`}
                              positions={polygon}
                              pathOptions={{
                                color,
                                fillColor: color,
                                fillOpacity: 0.35,
                                weight: 3,
                                dashArray: "6 5",
                              }}
                            >
                              <Popup>
                                <strong>{caseItem.case_code}</strong>
                                <br />
                                Risk: {caseItem.risk_level}
                                <br />
                                Status: {getStatus(caseItem)}
                                <br />
                                {caseItem.location_name || "Location unavailable"}
                              </Popup>
                            </Polygon>
                          ));
                        })}
                      </LayerGroup>
                    </LayersControl.Overlay>
                  )}

                </LayersControl>
              </MapContainer>
            </div>

            <p className="text-xs text-gray-500 mt-3">
              Map features are displayed only when valid geometries exist in the database.
              Potential cases require human and administrative verification.
            </p>
          </div>

          {/* Parcel Information */}
          <div className="bg-[#111c2e] border border-white/10 rounded-2xl p-5 space-y-5">

            <div>
              <h2 className="font-semibold text-lg">
                Parcel Information
              </h2>

              <p className="text-gray-400 text-xs mt-1">
                Select a parcel on the map
              </p>
            </div>

            {selectedParcel ? (
              <div className="bg-white/5 rounded-xl p-4 space-y-4">

                <div>
                  <p className="text-gray-500 text-xs">Parcel Code</p>
                  <h3 className="font-semibold mt-1">
                    {selectedParcel.parcel_code}
                  </h3>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Location</p>
                  <p className="text-sm mt-1">
                    {selectedParcel.location_name || "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Land Area</p>
                  <p className="text-sm mt-1">
                    {selectedParcel.area_sq_m ?? "Not provided"} sq.m
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Boundary Geometry</p>
                  <p className="text-sm mt-1">
                    {selectedParcel.boundary
                      ? "Available"
                      : "Not uploaded"}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Detected Changes</p>
                  <p className="text-sm mt-1">
                    {selectedChanges.length}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">
                    Spatial Overlaps
                  </p>
                  <p className="text-sm mt-1">
                    {selectedSpatialResults.length}
                  </p>
                </div>

                {selectedSpatialResults.map((item) => (
                  <div
                    key={item.change_id}
                    className="border-t border-white/10 pt-3"
                  >
                    <p className="text-gray-400 text-xs">
                      Overlapping Area
                    </p>

                    <p className="text-lg font-semibold text-yellow-400 mt-1">
                      {Number(item.overlap_area_sq_m).toFixed(2)} sq.m
                    </p>

                    <p className="text-gray-400 text-xs mt-2">
                      Overlap Percentage: {item.overlap_percentage}%
                    </p>
                  </div>
                ))}


                {/* Risk Assessment Information */}
                <div className="border-t border-white/10 pt-3">
                  <p className="text-gray-500 text-xs">
                    Risk Assessments
                  </p>

                  <p className="text-sm mt-1">
                    {selectedRiskAssessments.length}
                  </p>
                </div>

                {selectedRiskAssessments.map((item) => (
                  <div
                    key={item.change_id}
                    className="bg-white/5 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Risk Score
                      </span>

                      <span className="text-lg font-bold">
                        {Number(item.risk_score).toFixed(2)}
                      </span>
                    </div>

                    <span
                      className={`inline-block text-xs px-3 py-1 rounded-full ${
                        item.risk_level === "High"
                          ? "bg-red-500/10 text-red-400"
                          : item.risk_level === "Medium"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {item.risk_level} Priority
                    </span>

                    <div className="text-xs text-gray-400 space-y-1">
                      <p>
                        Confidence contribution:{" "}
                        {item.score_breakdown?.confidence_contribution ?? "N/A"}
                      </p>

                      <p>
                        Overlap contribution:{" "}
                        {item.score_breakdown?.overlap_contribution ?? "N/A"}
                      </p>

                      <p>
                        Area contribution:{" "}
                        {item.score_breakdown?.area_contribution ?? "N/A"}
                      </p>
                    </div>
                  </div>
                ))}


                <div>
                  <p className="text-gray-500 text-xs">Potential Cases</p>
                  <p className="text-sm mt-1">
                    {selectedCases.length}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 text-xs">Case Status</p>

                  {selectedCases.length > 0 ? (
                    selectedCases.map((item) => (
                      <div key={item.id} className="mt-2 text-sm">
                        <span className="font-medium">
                          {item.case_code}
                        </span>
                        <span className="text-gray-400">
                          {" "}— {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 mt-1">
                      No cases recorded
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 rounded-xl p-4 text-sm text-gray-400">
                No parcels available. Add a parcel with a valid GeoJSON boundary to display it on the map.
              </div>
            )}

            {/* Legend */}
            <div>
              <h3 className="font-semibold text-sm mb-3">
                Map Legend
              </h3>

              {[
                ["bg-blue-500", "Land Parcel"],
                ["bg-emerald-500", "Detected Change"],
                ["bg-red-500", "High Risk Case"],
                ["bg-yellow-500", "Selected Parcel"],
                ["bg-yellow-500", "Spatial Overlap"],
                ["bg-red-500", "High Risk"],
                ["bg-orange-500", "Medium Risk"],
                ["bg-emerald-500", "Low Risk"],
              ].map(([color, label]) => (
                <div
                  key={label}
                  className="flex items-center gap-3 mb-3"
                >
                  <span className={`w-3 h-3 rounded-sm ${color}`} />
                  <span className="text-gray-400 text-xs">
                    {label}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Layers size={16} />
                <span className="text-sm font-medium">
                  GIS Layer Management
                </span>
              </div>

              <p className="text-gray-500 text-xs mt-2">
                Enable or disable map layers to explore database records.
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
