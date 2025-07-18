'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { IconRenderer } from '@/components/ui/IconRenderer';
import { connectionStatusService } from '@/services/ConnectionStatusService';
import { ALL_TOOLS } from '@/lib/config';

interface ConnectionSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ToolSettings {
  toolId: string;
  autoRetry: boolean;
  retryInterval: number; // in minutes
  healthCheckEnabled: boolean;
  syncInterval: number; // in minutes
  maxRetries: number;
}

export function ConnectionSettings({ isOpen, onClose }: ConnectionSettingsProps) {
  const [settings, setSettings] = useState<Record<string, ToolSettings>>({});
  const [globalSettings, setGlobalSettings] = useState({
    autoRetryEnabled: true,
    globalRetryInterval: 5,
    healthCheckInterval: 1,
    maxConcurrentConnections: 10,
    connectionTimeout: 30,
    enableNotifications: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) return;

    // Initialize settings for all tools
    const initialSettings: Record<string, ToolSettings> = {};
    ALL_TOOLS.forEach(tool => {
      initialSettings[tool.id] = {
        toolId: tool.id,
        autoRetry: true,
        retryInterval: 5,
        healthCheckEnabled: true,
        syncInterval: 30,
        maxRetries: 3
      };
    });

    // Load saved settings from localStorage
    try {
      const saved = localStorage.getItem('connection-settings');
      if (saved) {
        const parsedSettings = JSON.parse(saved);
        Object.assign(initialSettings, parsedSettings.toolSettings || {});
        setGlobalSettings(prev => ({ ...prev, ...parsedSettings.globalSettings }));
      }
    } catch (error) {
      console.error('Failed to load connection settings:', error);
    }

    setSettings(initialSettings);
  }, [isOpen]);

  const handleToolSettingChange = (toolId: string, key: keyof ToolSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [toolId]: {
        ...prev[toolId],
        [key]: value
      }
    }));
  };

  const handleGlobalSettingChange = (key: keyof typeof globalSettings, value: any) => {
    setGlobalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Save to localStorage
      const settingsToSave = {
        toolSettings: settings,
        globalSettings
      };
      localStorage.setItem('connection-settings', JSON.stringify(settingsToSave));

      // Apply settings (in a real app, this would update the connection service)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save delay

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    // Reset to defaults
    const defaultSettings: Record<string, ToolSettings> = {};
    ALL_TOOLS.forEach(tool => {
      defaultSettings[tool.id] = {
        toolId: tool.id,
        autoRetry: true,
        retryInterval: 5,
        healthCheckEnabled: true,
        syncInterval: 30,
        maxRetries: 3
      };
    });

    setSettings(defaultSettings);
    setGlobalSettings({
      autoRetryEnabled: true,
      globalRetryInterval: 5,
      healthCheckInterval: 1,
      maxConcurrentConnections: 10,
      connectionTimeout: 30,
      enableNotifications: true
    });
  };

  const renderToolSettings = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Tool-Specific Settings
        </h3>
        
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {ALL_TOOLS.map(tool => {
            const toolSettings = settings[tool.id];
            if (!toolSettings) return null;

            return (
              <div key={tool.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
                    style={{ backgroundColor: tool.color }}
                  >
                    <IconRenderer icon={tool.icon} className="text-white" size={16} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{tool.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tool.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={toolSettings.autoRetry}
                        onChange={(e) => handleToolSettingChange(tool.id, 'autoRetry', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Auto Retry</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={toolSettings.healthCheckEnabled}
                        onChange={(e) => handleToolSettingChange(tool.id, 'healthCheckEnabled', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Health Check</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Retry Interval (min)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={toolSettings.retryInterval}
                      onChange={(e) => handleToolSettingChange(tool.id, 'retryInterval', parseInt(e.target.value))}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Sync Interval (min)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={toolSettings.syncInterval}
                      onChange={(e) => handleToolSettingChange(tool.id, 'syncInterval', parseInt(e.target.value))}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                      Max Retries
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={toolSettings.maxRetries}
                      onChange={(e) => handleToolSettingChange(tool.id, 'maxRetries', parseInt(e.target.value))}
                      className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGlobalSettings = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Global Settings
        </h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={globalSettings.autoRetryEnabled}
                onChange={(e) => handleGlobalSettingChange('autoRetryEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable Auto Retry</span>
            </label>

            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={globalSettings.enableNotifications}
                onChange={(e) => handleGlobalSettingChange('enableNotifications', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Enable Notifications</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Global Retry Interval (min)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={globalSettings.globalRetryInterval}
                onChange={(e) => handleGlobalSettingChange('globalRetryInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Health Check Interval (min)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={globalSettings.healthCheckInterval}
                onChange={(e) => handleGlobalSettingChange('healthCheckInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Connection Timeout (sec)
              </label>
              <input
                type="number"
                min="10"
                max="120"
                value={globalSettings.connectionTimeout}
                onChange={(e) => handleGlobalSettingChange('connectionTimeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                Max Concurrent Connections
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={globalSettings.maxConcurrentConnections}
                onChange={(e) => handleGlobalSettingChange('maxConcurrentConnections', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Connection Settings"
      size="xl"
    >
      <div className="space-y-8 max-h-[70vh] overflow-y-auto">
        {renderGlobalSettings()}
        {renderToolSettings()}
      </div>

      <ModalFooter>
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Save failed</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
