"use client";

import { useRef, useState } from "react";

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
  characters: string[];
  cover_prompt: string;
  scenes: Scene[];
};

type ApiResponse = {
  analysis: AnalysisResult;
  panels: Panel[];
};

type View = "input" | "results";

type Theme = {
  id: string;
  label: string;
  description: string;
  styleString: string;
};

// Fixed lookup table — theme style text is appended to every generated image's
// final prompt client-side. Not written by Gemini, so it stays consistent

const THEMES: Theme[] = [
  {
    id: "photo-realistic",
    label: "Photo-Realistic",
    description: "Natural lighting, lifelike detail, minimal stylization",
    styleString:
      "photorealistic rendering, natural skin texture, lifelike detail, realistic lighting, minimal stylization",
  },
  {
    id: "western-comic",
    label: "Western Comic",
    description: "Bold ink outlines, flat cel-shaded colors",
    styleString:
      "comic book illustration style, bold black ink outlines, flat cel-shaded coloring, halftone dot shading, dynamic comic panel composition",
  },
  {
    id: "manga",
    label: "Manga / Anime",
    description: "Screentone shading, expressive linework",
    styleString:
      "manga illustration style, clean expressive linework, screentone shading, anime-inspired character rendering, black and white with selective tone",
  },
  {
    id: "noir",
    label: "Noir / Graphic Novel",
    description: "High-contrast black & white, dramatic shadows",
    styleString:
      "noir graphic novel style, high-contrast black and white, dramatic hard shadows, heavy ink linework, moody cinematic lighting",
  },
  {
    id: "painterly",
    label: "Painterly / Semi-Realistic",
    description: "Digital painting, soft cinematic rendering",
    styleString:
      "semi-realistic digital painting style, soft painterly brushwork, cinematic rendering, rich color grading, illustrative detail",
  },
  {
    id: "cyberpunk",
    label: "Cyberpunk / Sci-Fi",
    description: "Neon palettes, futuristic environments",
    styleString:
      "cyberpunk sci-fi illustration style, neon color palette, futuristic environment details, glowing highlights, high-tech atmosphere",
  },
];

export default function HomePage() {
  // ---------- Navigation (fake second page, no real routing/storage) ----------
  const [view, setView] = useState<View>("input");

  // ---------- Input view state ----------
  const [story, setStory] = useState("");
  const [environment, setEnvironment] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string>(THEMES[0].id);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ---------- Results view state ----------
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);

  const wordCount = story.trim().length === 0 ? 0 : story.trim().split(/\s+/).length;
  const selectedTheme = THEMES.find((t) => t.id === selectedThemeId) ?? THEMES[0];

  // ---------- Handlers: input view ----------

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReferenceImageName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setReferenceImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setReferenceImage(null);
    setReferenceImageName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // page.tsx -> POST /api/story/analyze (story + environment + theme label, no image sent here)
  const handleGenerateComicPlan = async () => {
    if (!story.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/story/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story,
          environment: environment.trim(),
          theme: selectedTheme.label,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      setResult(data);
      setGeneratedImages({});
      setImageErrors({});
      setCoverImage(null);
      setCoverError(null);
      setView("results");
    } catch (err: any) {
      setError(err.message || "Failed to analyze story.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Handlers: results view ----------

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

  const buildFinalPrompt = (basePrompt: string) => {
  return `${basePrompt.trim()}. ${selectedTheme.styleString}`;
};

  // page.tsx -> POST /api/image/generate (combined prompt + optional reference image)
  const handleGenerateImage = async (panelId: string, basePrompt: string) => {
    if (!basePrompt.trim()) return;

    setGeneratingPanelId(panelId);
    setImageErrors((prev) => ({ ...prev, [panelId]: "" }));

    try {
      const finalPrompt = buildFinalPrompt(basePrompt);

      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          referenceImage: referenceImage || undefined,
        }),
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

  const handleGenerateCover = async () => {
    if (!result?.analysis.cover_prompt) return;

    setIsGeneratingCover(true);
    setCoverError(null);

    try {
      const finalPrompt = buildFinalPrompt(result.analysis.cover_prompt);

      const res = await fetch("/api/image/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          referenceImage: referenceImage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Cover generation failed.");
      }

      setCoverImage(data.image);
    } catch (err: any) {
      setCoverError(err.message || "Failed to generate cover.");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleBackToInput = () => {
    setView("input");
  };

  const panelsByScene = result
    ? result.analysis.scenes.map((scene) => ({
        scene,
        panels: result.panels.filter((p) => p.scene_id === scene.scene_id),
      }))
    : [];

  // ==================================================
  // VIEW: INPUT (story + environment + theme + reference image)
  // ==================================================
  if (view === "input") {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold tracking-tight mb-2">Illustria</h1>
            <p className="text-slate-400">
              Turn your story into a comic. Set the world, pick a style, and paste your story.
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
              className="w-full h-56 resize-none rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-600 transition-colors"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-500">
                {wordCount} {wordCount === 1 ? "word" : "words"}
              </span>
            </div>
          </div>

          {/* Environment / world-building input */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
            <label htmlFor="environment" className="block text-sm font-medium text-slate-300 mb-2">
              World / Environment{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Describe the setting so every panel stays consistent — e.g. sky color, desert or
              city, time period, futuristic or medieval, weather.
            </p>
            <textarea
              id="environment"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="A sun-scorched desert city under a burnt orange sky, crumbling sandstone towers, distant neon signs from an old trade district..."
              className="w-full h-24 resize-none rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-3 text-sm leading-relaxed text-slate-100 placeholder-slate-600 transition-colors"
            />
          </div>

          {/* Theme selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Comic Style
            </label>
            <div className="grid sm:grid-cols-2 gap-3">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedThemeId(theme.id)}
                  className={`text-left rounded-lg border p-3 transition-colors ${
                    selectedThemeId === theme.id
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-slate-800 bg-slate-950 hover:border-slate-700"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-100">{theme.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{theme.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Reference image input */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Character Reference Image{" "}
              <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Used for identity-consistent image generation across panels.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer"
            />

            {referenceImage && (
              <div className="mt-4 flex items-center gap-3">
                <img
                  src={referenceImage}
                  alt="Reference preview"
                  className="w-16 h-16 object-cover rounded-lg border border-slate-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate">{referenceImageName}</p>
                  <button
                    onClick={clearImage}
                    className="text-xs text-red-400 hover:text-red-300 mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              onClick={handleGenerateComicPlan}
              disabled={!story.trim() || isLoading}
              className="w-full px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isLoading ? "Analyzing & Planning Panels..." : "Generate Comic-Plan"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>
        </div>
      </main>
    );
  }

  // ==================================================
  // VIEW: RESULTS (fake second page — cover + analysis + panels + image generation)
  // ==================================================
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Illustria</h1>
            <p className="text-slate-400 text-sm mt-1">
              Comic Plan Results — {selectedTheme.label}
            </p>
          </div>
          <button
            onClick={handleBackToInput}
            className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg px-3 py-2 transition-colors"
          >
            ← Back to Input
          </button>
        </div>

        {result && (
          <div className="space-y-8">
            {/* COVER PAGE */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Cover
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold mb-3">{result.analysis.title}</h2>

                <p className="text-xs text-slate-500 mb-3">{result.analysis.cover_prompt}</p>

                <button
                  onClick={handleGenerateCover}
                  disabled={isGeneratingCover}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                >
                  {isGeneratingCover ? "Generating Cover..." : "Generate Cover"}
                </button>

                {coverError && <p className="text-xs text-red-400 mt-2">{coverError}</p>}

                {coverImage && (
                  <img
                    src={coverImage}
                    alt="Story cover"
                    className="mt-4 rounded-lg border border-slate-800 w-full max-w-sm"
                  />
                )}
              </div>
            </section>

            {/* Reference image indicator */}
            {referenceImage && (
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-4">
                  <img
                    src={referenceImage}
                    alt="Character reference"
                    className="w-14 h-14 object-cover rounded-lg border border-slate-800"
                  />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Reference Image Active
                  </p>
                </div>
              </section>
            )}

            {/* STORY LEVEL — character names (read-only) */}
            <section>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                Characters
              </h3>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  {result.analysis.characters.map((name) => (
                    <span
                      key={name}
                      className="bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-xs text-indigo-300"
                    >
                      {name}
                    </span>
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

                            <p className="text-sm text-slate-200">{panel.description}</p>

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
                              <p className="text-[10px] text-slate-600">
                                Environment + "{selectedTheme.label}" style will be appended automatically on generation.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <button
                                onClick={() =>
                                  handleGenerateImage(panel.panel_id, panel.image_prompt)
                                }
                                disabled={isGenerating || !panel.image_prompt.trim()}
                                className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                              >
                                {isGenerating ? "Generating..." : "Generate Image"}
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
      </div>
    </main>
  );
}