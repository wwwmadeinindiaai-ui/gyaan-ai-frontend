"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface UserPreferences {
  topics: string[];
  sources: string[];
  customApiConnections: { name: string; endpoint: string; apiKey: string }[];
  resultFormat: "detailed" | "summary" | "brief";
}

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    topics: [],
    sources: [],
    customApiConnections: [],
    resultFormat: "detailed",
  });
  
  const [newTopic, setNewTopic] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newAPI, setNewAPI] = useState({ name: "", endpoint: "", apiKey: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      loadPreferences();
    }
  }, [session]);

  const loadPreferences = async () => {
    try {
      const response = await fetch("/api/preferences");
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        console.error("Failed to load preferences");
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    setError("");
    setSuccess(false);
    
    try {
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to save preferences");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      setError("An error occurred while saving preferences");
    } finally {
      setLoading(false);
    }
  };

  const addTopic = () => {
    if (newTopic && !preferences.topics.includes(newTopic)) {
      setPreferences({ ...preferences, topics: [...preferences.topics, newTopic] });
      setNewTopic("");
    }
  };

  const removeTopic = (topic: string) => {
    setPreferences({
      ...preferences,
      topics: preferences.topics.filter((t) => t !== topic),
    });
  };

  const addSource = () => {
    if (newSource && !preferences.sources.includes(newSource)) {
      setPreferences({ ...preferences, sources: [...preferences.sources, newSource] });
      setNewSource("");
    }
  };

  const removeSource = (source: string) => {
    setPreferences({
      ...preferences,
      sources: preferences.sources.filter((s) => s !== source),
    });
  };
  
  const addCustomAPI = () => {
    if (newAPI.name && newAPI.endpoint) {
      setPreferences({
        ...preferences,
        customApiConnections: [...preferences.customApiConnections, newAPI],
      });
      setNewAPI({ name: "", endpoint: "", apiKey: "" });
    }
  };

  const removeCustomAPI = (index: number) => {
    setPreferences({
      ...preferences,
      customApiConnections: preferences.customApiConnections.filter((_, i) => i !== index),
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Preferences</h1>
          
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              Preferences saved successfully!
            </div>
          )}
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Topics Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferred Topics</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addTopic()}
                placeholder="Add a topic (e.g., Technology, AI, Health)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={addTopic}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {topic}
                  <button
                    onClick={() => removeTopic(topic)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sources Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferred Sources</h2>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addSource()}
                placeholder="Add a source (e.g., TechCrunch, BBC, Reuters)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={addSource}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferences.sources.map((source) => (
                <span
                  key={source}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                >
                  {source}
                  <button
                    onClick={() => removeSource(source)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Custom API Connections Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Custom API Connections</h2>
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={newAPI.name}
                onChange={(e) => setNewAPI({ ...newAPI, name: e.target.value })}
                placeholder="API Name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="text"
                value={newAPI.endpoint}
                onChange={(e) => setNewAPI({ ...newAPI, endpoint: e.target.value })}
                placeholder="API Endpoint URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="password"
                value={newAPI.apiKey}
                onChange={(e) => setNewAPI({ ...newAPI, apiKey: e.target.value })}
                placeholder="API Key (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={addCustomAPI}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Custom API
              </button>
            </div>
            <div className="space-y-2">
              {preferences.customApiConnections.map((api, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">{api.name}</p>
                    <p className="text-sm text-gray-600">{api.endpoint}</p>
                  </div>
                  <button
                    onClick={() => removeCustomAPI(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Result Format Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Default Result Format</h2>
            <div className="flex gap-4">
              {["detailed", "summary", "brief"].map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="radio"
                    name="resultFormat"
                    value={format}
                    checked={preferences.resultFormat === format}
                    onChange={(e) =>
                      setPreferences({ ...preferences, resultFormat: e.target.value as any })
                    }
                    className="mr-2"
                  />
                  <span className="capitalize">{format}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={savePreferences}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
