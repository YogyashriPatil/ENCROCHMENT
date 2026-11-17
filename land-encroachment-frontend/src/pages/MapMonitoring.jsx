
import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  LayersControl,
  LayerGroup,
  ZoomControl,
} from "react-leaflet";

import {
  MapPin,
  Layers,
  Building2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Maximize2,
} from "lucide-react";

// Sample GIS data for frontend demonstration
const parcels = [
  {
    id: "P-101",
    name: "Parcel A",
    area: "750 sq.m",
    status: "Normal",
    positions: [
      [19.9985, 73.7850],
      [19.9985, 73.7860],
      [19.9977, 73.7860],
      [19.9977, 73.7850],
    ],
  },
  {
    id: "P-102",
    name: "Parcel B",
    area: "920 sq.m",
    status: "Potential Encroachment",
    positions: [
      [19.9985, 73.7863],
      [19.9985, 73.7874],
      [19.9977, 73.7874],
      [19.9977, 73.7863],
    ],
  },
  {
    id: "P-103",
    name: "Parcel C",
    area: "680 sq.m",
    status: "Under Review",
    positions: [
      [19.9974, 73.7850],
      [19.9974, 73.7860],
      [19.9966, 73.7860],
      [19.9966, 73.7850],
    ],
  },
];

const buildings = [
  [
    [19.9982, 73.7865],
    [19.9982, 73.7869],
    [19.9979, 73.7869],
    [19.9979, 73.7865],
  ],
];

const restrictedZones = [
  [
    [19.9973, 73.7865],
    [19.9973, 73.7874],
    [19.9966, 73.7874],
    [19.9966, 73.7865],
  ],
];

export default function MapMonitoring() {
  const [selectedParcel, setSelectedParcel] = useState(parcels[0]);
  const [showParcels, setShowParcels] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showEncroachments, setShowEncroachments] = useState(true);
  const [showRestricted, setShowRestricted] = useState(true);

  return (
    <div className="space-y-6 text-white">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            GIS Monitoring
          </h1>

          <p className="text-gray-400 text-sm mt-2">
            Monitor land parcels, detected structures and potential encroachments.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl">
          <Activity size={16} />
          GIS Monitoring Active
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {[
          {
            title: "Total Parcels",
            value: "125",
            icon: MapPin,
            color: "text-blue-400",
          },
          {
            title: "Buildings Detected",
            value: "284",
            icon: Building2,
            color: "text-emerald-400",
          },
          {
            title: "Potential Cases",
            value: "18",
            icon: AlertTriangle,
            color: "text-red-400",
          },
          {
            title: "Restricted Zones",
            value: "12",
            icon: ShieldCheck,
            color: "text-yellow-400",
          },
        ].map((item) => {
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

      {/* Map and Details */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-5">

        {/* Interactive Map */}
        <div className="xl:col-span-3 bg-[#111c2e] border border-white/10 rounded-2xl p-4">

          <div className="flex flex-col sm:flex-row justify-between gap-3 mb-4">

            <div>
              <h2 className="font-semibold text-lg">
                Interactive Land Map
              </h2>

              <p className="text-gray-400 text-xs mt-1">
                Explore parcels and detected structures
              </p>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 text-sm bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg"
            >
              <Maximize2 size={15} />
              Refresh Map
            </button>

          </div>

          {/* Map Layer Controls */}
          <div className="flex flex-wrap gap-3 mb-4">

            {[
              {
                label: "Parcels",
                checked: showParcels,
                setter: setShowParcels,
                color: "bg-blue-500",
              },
              {
                label: "Buildings",
                checked: showBuildings,
                setter: setShowBuildings,
                color: "bg-emerald-500",
              },
              {
                label: "Potential Cases",
                checked: showEncroachments,
                setter: setShowEncroachments,
                color: "bg-red-500",
              },
              {
                label: "Restricted Zones",
                checked: showRestricted,
                setter: setShowRestricted,
                color: "bg-yellow-500",
              },
            ].map((layer) => (
              <label
                key={layer.label}
                className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer bg-white/5 px-3 py-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={layer.checked}
                  onChange={(e) => layer.setter(e.target.checked)}
                  className="accent-emerald-500"
                />

                <span className={`w-2 h-2 rounded-full ${layer.color}`} />

                {layer.label}
              </label>
            ))}

          </div>

          {/* Leaflet Map */}
          <div className="h-[500px] rounded-xl overflow-hidden border border-white/10">

            <MapContainer
              center={[19.9975, 73.7860]}
              zoom={17}
              scrollWheelZoom={true}
              zoomControl={false}
              className="h-full w-full"
            >

              <ZoomControl position="bottomright" />

              <LayersControl position="topright">

                {/* Satellite Layer */}
                <LayersControl.BaseLayer
                  checked
                  name="Satellite Imagery"
                >
                  <TileLayer
                    attribution='Tiles &copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>

                {/* Street Map */}
                <LayersControl.BaseLayer name="Street Map">
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
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
                      {parcels.map((parcel) => (
                        <Polygon
                          key={parcel.id}
                          positions={parcel.positions}
                          pathOptions={{
                            color: "#3b82f6",
                            weight: 2,
                            fillColor: "#3b82f6",
                            fillOpacity: 0.12,
                          }}
                          eventHandlers={{
                            click: () => setSelectedParcel(parcel),
                          }}
                        />
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>
                )}

                {/* Buildings */}
                {showBuildings && (
                  <LayersControl.Overlay
                    checked
                    name="Detected Buildings"
                  >
                    <LayerGroup>
                      {buildings.map((building, index) => (
                        <Polygon
                          key={index}
                          positions={building}
                          pathOptions={{
                            color: "#10b981",
                            fillColor: "#10b981",
                            fillOpacity: 0.65,
                            weight: 2,
                          }}
                        />
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>
                )}

                {/* Potential Encroachments */}
                {showEncroachments && (
                  <LayersControl.Overlay
                    checked
                    name="Potential Encroachments"
                  >
                    <LayerGroup>
                      <Polygon
                        positions={buildings[0]}
                        pathOptions={{
                          color: "#ef4444",
                          fillColor: "#ef4444",
                          fillOpacity: 0.3,
                          weight: 3,
                          dashArray: "6 5",
                        }}
                      />
                    </LayerGroup>
                  </LayersControl.Overlay>
                )}

                {/* Restricted Zones */}
                {showRestricted && (
                  <LayersControl.Overlay
                    checked
                    name="Restricted Zones"
                  >
                    <LayerGroup>
                      {restrictedZones.map((zone, index) => (
                        <Polygon
                          key={index}
                          positions={zone}
                          pathOptions={{
                            color: "#f59e0b",
                            fillColor: "#f59e0b",
                            fillOpacity: 0.35,
                            weight: 2,
                          }}
                        />
                      ))}
                    </LayerGroup>
                  </LayersControl.Overlay>
                )}

              </LayersControl>

            </MapContainer>

          </div>

          <p className="text-xs text-gray-500 mt-3">
            Demonstration map with illustrative parcel coordinates.
            Imagery and sample overlays are not verified land records.
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

          <div className="bg-white/5 rounded-xl p-4 space-y-4">

            <div>
              <p className="text-gray-500 text-xs">
                Parcel ID
              </p>

              <h3 className="font-semibold mt-1">
                {selectedParcel.id}
              </h3>
            </div>

            <div>
              <p className="text-gray-500 text-xs">
                Parcel Name
              </p>

              <p className="text-sm mt-1">
                {selectedParcel.name}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">
                Land Area
              </p>

              <p className="text-sm mt-1">
                {selectedParcel.area}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">
                Monitoring Status
              </p>

              <span className={`inline-block mt-2 text-xs px-3 py-1 rounded-full ${
                selectedParcel.status === "Normal"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : selectedParcel.status === "Under Review"
                  ? "bg-yellow-500/10 text-yellow-400"
                  : "bg-red-500/10 text-red-400"
              }`}>
                {selectedParcel.status}
              </span>
            </div>

          </div>

          <div>
            <h3 className="font-semibold text-sm mb-3">
              Map Legend
            </h3>

            {[
              ["bg-blue-500", "Land Parcel"],
              ["bg-emerald-500", "Detected Building"],
              ["bg-red-500", "Potential Encroachment"],
              ["bg-yellow-500", "Restricted Zone"],
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
              Use the layer checkboxes and map controls to explore different geographical datasets.
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}
