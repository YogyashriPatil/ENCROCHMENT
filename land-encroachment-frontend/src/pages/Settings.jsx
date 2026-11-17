
import { useState } from "react";
import {
  User,
  Bell,
  Map,
  Shield,
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Info,
  Mail,
  Building2,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export default function Settings() {
  const [profile, setProfile] = useState({
    name: "System Administrator",
    email: "admin@terrawatch.com",
    role: "Administrator",
    organization: "TerraWatch Monitoring",
  });

  const [notifications, setNotifications] = useState({
    highRisk: true,
    newDetection: true,
    reportGenerated: false,
    systemUpdates: true,
  });

  const [mapSettings, setMapSettings] = useState({
    defaultLayer: "Satellite",
    showParcels: true,
    showBuildings: true,
    showRestrictedZones: true,
  });

  const [saved, setSaved] = useState(false);

  const updateProfile = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSaved(false);
  };

  const updateNotification = (field) => {
    setNotifications((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
    setSaved(false);
  };

  const updateMapSetting = (field, value) => {
    setMapSettings((previous) => ({
      ...previous,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    // Demo only: settings are not yet stored in a backend.
    localStorage.setItem(
      "terrawatch-settings",
      JSON.stringify({
        profile,
        notifications,
        mapSettings,
      })
    );
    setSaved(true);
  };

  const handleReset = () => {
    setProfile({
      name: "System Administrator",
      email: "admin@terrawatch.com",
      role: "Administrator",
      organization: "TerraWatch Monitoring",
    });

    setNotifications({
      highRisk: true,
      newDetection: true,
      reportGenerated: false,
      systemUpdates: true,
    });

    setMapSettings({
      defaultLayer: "Satellite",
      showParcels: true,
      showBuildings: true,
      showRestrictedZones: true,
    });

    setSaved(false);
  };

  const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="mt-1 text-xs text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-blue-600" : "bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );

  const InputField = ({ label, icon: Icon, value, onChange, type = "text" }) => (
    <div>
      <label className="mb-2 block text-sm text-gray-400">
        {label}
      </label>
      <div className="relative">
        <Icon
          size={17}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#0B1120] py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen space-y-6 text-white">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-gray-400">
          Manage your profile, notifications and monitoring preferences.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-500/10 p-3 text-blue-400">
            <User size={21} />
          </div>
          <div>
            <h2 className="font-semibold">Profile Information</h2>
            <p className="text-xs text-gray-500">
              Manage your account details.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Full Name"
            icon={User}
            value={profile.name}
            onChange={(value) => updateProfile("name", value)}
          />

          <InputField
            label="Email Address"
            icon={Mail}
            type="email"
            value={profile.email}
            onChange={(value) => updateProfile("email", value)}
          />

          <InputField
            label="Role"
            icon={Shield}
            value={profile.role}
            onChange={(value) => updateProfile("role", value)}
          />

          <InputField
            label="Organization"
            icon={Building2}
            value={profile.organization}
            onChange={(value) => updateProfile("organization", value)}
          />
        </div>
      </section>

      {/* Notifications */}
      <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-3 text-amber-400">
            <Bell size={21} />
          </div>
          <div>
            <h2 className="font-semibold">Notification Preferences</h2>
            <p className="text-xs text-gray-500">
              Choose which system events you want to receive.
            </p>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          <Toggle
            label="High Risk Alerts"
            description="Notifications for high-risk potential cases."
            checked={notifications.highRisk}
            onChange={() => updateNotification("highRisk")}
          />

          <Toggle
            label="New Detection Alerts"
            description="Notifications when a new potential change is detected."
            checked={notifications.newDetection}
            onChange={() => updateNotification("newDetection")}
          />

          <Toggle
            label="Report Generation"
            description="Notifications when a report is generated."
            checked={notifications.reportGenerated}
            onChange={() => updateNotification("reportGenerated")}
          />

          <Toggle
            label="System Updates"
            description="Notifications about application updates."
            checked={notifications.systemUpdates}
            onChange={() => updateNotification("systemUpdates")}
          />
        </div>
      </section>

      {/* Map Preferences */}
      <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-400">
            <Map size={21} />
          </div>
          <div>
            <h2 className="font-semibold">GIS Map Preferences</h2>
            <p className="text-xs text-gray-500">
              Configure your preferred map display.
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-gray-400">
            Default Map Layer
          </label>

          <select
            value={mapSettings.defaultLayer}
            onChange={(e) =>
              updateMapSetting("defaultLayer", e.target.value)
            }
            className="w-full rounded-lg border border-white/10 bg-[#0B1120] px-4 py-3 text-sm text-white outline-none focus:border-blue-500 md:w-1/2"
          >
            <option value="Satellite">Satellite View</option>
            <option value="Street">Street Map</option>
          </select>
        </div>

        <div className="mt-5 divide-y divide-white/5">
          <Toggle
            label="Show Parcel Boundaries"
            description="Display monitored land parcel boundaries."
            checked={mapSettings.showParcels}
            onChange={() => updateMapSetting("showParcels", !mapSettings.showParcels)}
          />

          <Toggle
            label="Show Buildings"
            description="Display detected building footprints."
            checked={mapSettings.showBuildings}
            onChange={() => updateMapSetting("showBuildings", !mapSettings.showBuildings)}
          />

          <Toggle
            label="Show Restricted Zones"
            description="Display protected or restricted geographical zones."
            checked={mapSettings.showRestrictedZones}
            onChange={() => updateMapSetting("showRestrictedZones", !mapSettings.showRestrictedZones)}
          />
        </div>
      </section>

      {/* Application Information */}
      <section className="rounded-xl border border-white/10 bg-[#111827] p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-500/10 p-3 text-purple-400">
            <Info size={21} />
          </div>
          <div>
            <h2 className="font-semibold">Application Information</h2>
            <p className="text-xs text-gray-500">
              TerraWatch system details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">Application</p>
            <p className="mt-1 font-medium">TerraWatch</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Version</p>
            <p className="mt-1 font-medium">1.0.0 (Development)</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Platform</p>
            <p className="mt-1 font-medium">AI & GIS Monitoring</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Project Status</p>
            <p className="mt-1 font-medium text-emerald-400">
              Development
            </p>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-3 text-sm text-gray-300 transition hover:bg-white/5"
        >
          <RotateCcw size={17} />
          Reset Settings
        </button>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500"
        >
          {saved ? <CheckCircle2 size={17} /> : <Save size={17} />}
          {saved ? "Settings Saved" : "Save Changes"}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        Demo implementation: settings are saved in this browser's local storage.
        Backend account management and notification delivery are not yet connected.
      </p>
    </div>
  );
}
