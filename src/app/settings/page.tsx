'use client';

import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    displayName: 'John Research',
    email: 'john@research.com',
    theme: 'dark',
    notifications: true,
    emailUpdates: false,
    language: 'en',
  });

  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setHasChanges(false);
  };

  const handleSave = () => {
    console.log('Settings saved:', settings);
    setHasChanges(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6">Profile</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={settings.displayName}
              onChange={(e) => handleChange('displayName', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6">Preferences</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleChange('language', e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-6">Notifications</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.notifications}
              onChange={(e) => handleChange('notifications', e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-300">Enable notifications</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.emailUpdates}
              onChange={(e) => handleChange('emailUpdates', e.target.checked)}
              className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-slate-300">Receive email updates</span>
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
        <button className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors font-medium">
          Delete Account
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          <Save size={20} />
          Save Changes
        </button>
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors font-medium"
        >
          <RotateCcw size={20} />
          Reset
        </button>
      </div>
    </div>
  );
}
