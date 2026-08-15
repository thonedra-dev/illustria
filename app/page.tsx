"use client";

import { useState } from "react";

type Character = {
  name: string;
  description: string;
};

type Scene = {
  scene_id: string;
  summary: string;
  charactersInvolved: string[];
};

type DialogueLine = {
  speaker: string;
  line: string;
};

type Panel = {
  panel_id: string;
  scene_id: string;
  description: string;
  characters: string[];
  dialogue: DialogueLine[];
  image_prompt: string;
};

type AnalysisResult = {
  title: string;
  characters: Character[];
  scenes: Scene[];
};

type ApiResponse = {
  analysis: AnalysisResult;
  panels: Panel[];
};

export default function HomePage() {
  const [story, setStory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const handleSubmit = async () => {
    if (!story.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/story/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to analyze story.");
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = story.trim().length === 0 ? 0 : story.trim().split(/\s+/).length;

  // Group panels by their parent scene, in scene order
  const panelsByScene = result
    ? result.analysis.scenes.map((scene) => ({
        scene,
        panels: result.panels.filter((p) => p.scene_id === scene.scene_id),
      }))
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Illustria</h1>
          <p className="text-slate-400">
            Turn your story into a comic. Paste your story below to get started.
          </p>
        </div>

        {/* Story input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <label htmlFor="story" className="block text-sm font-medium text-slate-300 mb-2">
            Your Story
          </label>
          <textarea
            id="story"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Once upon a time, in a small clock shop at the edge of town..."
            className="w-full h-64 resize-none rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-600 transition-colors"
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>

            <button
              onClick={handleSubmit}
              disabled={!story.trim() || isLoading}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isLoading ? "Analyzing & Planning Panels..." : "Generate Comic"}
            </button>
          </div>

          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-8">
            {/* Title + characters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-4">{result.analysis.title}</h2>

              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Characters
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {result.analysis.characters.map((c) => (
                  <div
                    key={c.name}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3"
                  >
                    <p className="font-medium text-indigo-300">{c.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{c.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenes with their panels */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Scenes &amp; Panels
              </h3>

              <div className="space-y-6">
                {panelsByScene.map(({ scene, panels }) => (
                  <div
                    key={scene.scene_id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                  >
                    <p className="text-xs text-indigo-400 font-mono mb-1">{scene.scene_id}</p>
                    <p className="text-slate-200 mb-4">{scene.summary}</p>

                    <div className="grid sm:grid-cols-2 gap-4">
                      {panels.map((panel) => (
                        <div
                          key={panel.panel_id}
                          className="bg-slate-950 border border-slate-800 rounded-xl p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-slate-500">
                              {panel.panel_id}
                            </span>
                            {panel.characters.length > 0 && (
                              <span className="text-xs text-slate-400">
                                {panel.characters.join(", ")}
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-slate-200 mb-3">{panel.description}</p>

                          {panel.dialogue.length > 0 && (
                            <div className="mb-3 space-y-1">
                              {panel.dialogue.map((d, i) => (
                                <p key={i} className="text-xs text-slate-400 italic">
                                  <span className="text-slate-300 not-italic font-medium">
                                    {d.speaker}:
                                  </span>{" "}
                                  "{d.line}"
                                </p>
                              ))}
                            </div>
                          )}

                          <details className="mt-2">
                            <summary className="text-xs text-indigo-400 cursor-pointer">
                              Image prompt
                            </summary>
                            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                              {panel.image_prompt}
                            </p>
                          </details>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-6">
          Illustria will analyze your story, break it into scenes and panels, and generate comic artwork.
        </p>
      </div>
    </main>
  );
}