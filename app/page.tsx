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

  // --- Image generation state (per-panel) ---
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});

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

  // Update a single dialogue line's text for a specific panel, immutably.
  const updateDialogueLine = (
    panelId: string,
    dialogueIndex: number,
    newLine: string
  ) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        panels: prev.panels.map((panel) => {
          if (panel.panel_id !== panelId) return panel;
          return {
            ...panel,
            dialogue: panel.dialogue.map((d, i) =>
              i === dialogueIndex ? { ...d, line: newLine } : d
            ),
          };
        }),
      };
    });
  };

  // Update a panel's image_prompt, immutably.
  const updateImagePrompt = (panelId: string, newPrompt: string) => {
    setResult((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        panels: prev.panels.map((panel) =>
          panel.panel_id === panelId
            ? { ...panel, image_prompt: newPrompt }
            : panel
        ),
      };
    });
  };

  // page.tsx -> POST /api/image/generate -> Stability AI -> image -> page.tsx
  const handleGenerateImage = async (panelId: string, prompt: string) => {
    if (!prompt.trim()) return;

    setGeneratingPanelId(panelId);
    setImageErrors((prev) => ({ ...prev, [panelId]: "" }));

    try {
      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Image generation failed.");
      }

      setGeneratedImages((prev) => ({ ...prev, [panelId]: data.image }));
    } catch (err: any) {
      setImageErrors((prev) => ({
        ...prev,
        [panelId]: err.message || "Failed to generate image.",
      }));
    } finally {
      setGeneratingPanelId(null);
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
            {/* STORY LEVEL — title + characters (read-only) */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Story
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-4">{result.analysis.title}</h2>

                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Characters
                </h4>
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
            </section>

            {/* SCENE LEVEL */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Scenes
              </h3>

              <div className="space-y-6">
                {panelsByScene.map(({ scene, panels }) => (
                  <div
                    key={scene.scene_id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
                  >
                    {/* Scene header (read-only) */}
                    <div className="mb-4">
                      <p className="text-xs text-indigo-400 font-mono mb-1">
                        {scene.scene_id}
                      </p>
                      <p className="text-slate-200">{scene.summary}</p>
                    </div>

                    {/* PANEL LEVEL */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {panels.map((panel) => {
                        const isGenerating = generatingPanelId === panel.panel_id;
                        const generatedImage = generatedImages[panel.panel_id];
                        const imageError = imageErrors[panel.panel_id];

                        return (
                          <div
                            key={panel.panel_id}
                            className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
                          >
                            {/* Panel meta (read-only) */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono text-slate-500">
                                {panel.panel_id}
                              </span>
                              {panel.characters.length > 0 && (
                                <span className="text-xs text-slate-400">
                                  {panel.characters.join(", ")}
                                </span>
                              )}
                            </div>

                            {/* Panel description (read-only) */}
                            <p className="text-sm text-slate-200">{panel.description}</p>

                            {/* DIALOGUE (editable) */}
                            {panel.dialogue.length > 0 && (
                              <div className="space-y-2">
                                <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                  Dialogue
                                </h5>
                                {panel.dialogue.map((d, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <span className="text-xs text-slate-400 font-medium mt-2 shrink-0">
                                      {d.speaker}:
                                    </span>
                                    <input
                                      type="text"
                                      value={d.line}
                                      onChange={(e) =>
                                        updateDialogueLine(panel.panel_id, i, e.target.value)
                                      }
                                      className="flex-1 text-xs bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* IMAGE PROMPT (editable) */}
                            <div className="space-y-2">
                              <h5 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                                Image Prompt
                              </h5>
                              <textarea
                                value={panel.image_prompt}
                                onChange={(e) =>
                                  updateImagePrompt(panel.panel_id, e.target.value)
                                }
                                rows={4}
                                className="w-full text-xs leading-relaxed bg-slate-900 border border-slate-800 rounded-md px-2 py-2 text-slate-300 resize-y focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                              />
                            </div>

                            {/* IMAGE GENERATION (test) */}
                            <div className="space-y-2">
                              <button
                                onClick={() =>
                                  handleGenerateImage(panel.panel_id, panel.image_prompt)
                                }
                                disabled={isGenerating || !panel.image_prompt.trim()}
                                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                              >
                                {isGenerating ? "Generating..." : "Generate Image (test)"}
                              </button>

                              {imageError && (
                                <p className="text-xs text-red-400">{imageError}</p>
                              )}

                              {generatedImage && (
                                <img
                                  src={generatedImage}
                                  alt={`Generated art for ${panel.panel_id}`}
                                  className="rounded-lg border border-slate-800 w-full"
                                />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-6">
          Illustria will analyze your story, break it into scenes and panels, and generate comic artwork.
        </p>
      </div>
    </main>
  );
}