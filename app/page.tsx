"use client";

import { useRef, useState } from "react";
import { ApiResponse, NarrationContent, NarrationSpace, View } from "@/types/comic";
import { THEMES } from "@/lib/themes";
import {
  NarrationColorId,
  NarrationFontId,
  DEFAULT_NARRATION_COLOR_ID,
  DEFAULT_NARRATION_FONT_ID,
} from "@/lib/narrationStyles";
import { StoryInputView } from "@/components/input/StoryInputView";
import { ResultsView } from "@/components/results/ResultsView";

export default function HomePage() {
  // Navigation (fake second page)
  const [view, setView] = useState<View>("input");

  // Input view state
  const [story, setStory] = useState("");
  const [environment, setEnvironment] = useState("");
  const [selectedThemeId, setSelectedThemeId] = useState<string>(THEMES[0].id);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [referenceImageName, setReferenceImageName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Results view state
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [generatingPanelId, setGeneratingPanelId] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({});
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [mergedScenes, setMergedScenes] = useState<Record<string, boolean>>({});
  const [narrationSpace, setNarrationSpace] = useState<Record<string, NarrationSpace>>({});
  const [narrationContent, setNarrationContent] = useState<Record<string, NarrationContent>>({});

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
      setMergedScenes({});
      setNarrationSpace({});
      setNarrationContent({});
      setCoverError(null);
      setView("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze story.");
    } finally {
      setIsLoading(false);
    }
  };

  // ---------- Handlers: results view ----------

  const updateDialogueLine = (panelId: string, dialogueIndex: number, newLine: string) => {
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
          panel.panel_id === panelId ? { ...panel, image_prompt: newPrompt } : panel
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
    } catch (err) {
      setImageErrors((prev) => ({
        ...prev,
        [panelId]: err instanceof Error ? err.message : "Failed to generate image.",
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
    } catch (err) {
      setCoverError(err instanceof Error ? err.message : "Failed to generate cover.");
    } finally {
      setIsGeneratingCover(false);
    }
  };

  const handleToggleMerge = (sceneId: string) => {
    setMergedScenes((prev) => ({ ...prev, [sceneId]: !prev[sceneId] }));
  };

  const handleNarrationChange = (sceneId: string, value: NarrationSpace) => {
    setNarrationSpace((prev) => ({ ...prev, [sceneId]: value }));
  };

  const getOrDefaultContent = (sceneId: string): NarrationContent =>
    narrationContent[sceneId] ?? {
      text: "",
      colorId: DEFAULT_NARRATION_COLOR_ID,
      fontId: DEFAULT_NARRATION_FONT_ID,
    };

  const handleNarrationTextChange = (sceneId: string, text: string) => {
    setNarrationContent((prev) => ({
      ...prev,
      [sceneId]: { ...getOrDefaultContent(sceneId), text },
    }));
  };

  const handleNarrationColorChange = (sceneId: string, colorId: NarrationColorId) => {
    setNarrationContent((prev) => ({
      ...prev,
      [sceneId]: { ...getOrDefaultContent(sceneId), colorId },
    }));
  };

  const handleNarrationFontChange = (sceneId: string, fontId: NarrationFontId) => {
    setNarrationContent((prev) => ({
      ...prev,
      [sceneId]: { ...getOrDefaultContent(sceneId), fontId },
    }));
  };

  const handleBackToInput = () => {
    setView("input");
  };

  // ==================================================
  // VIEW: INPUT
  // ==================================================
  if (view === "input") {
    return (
      <StoryInputView
        story={story}
        setStory={setStory}
        environment={environment}
        setEnvironment={setEnvironment}
        selectedThemeId={selectedThemeId}
        setSelectedThemeId={setSelectedThemeId}
        referenceImage={referenceImage}
        referenceImageName={referenceImageName}
        fileInputRef={fileInputRef}
        onImageSelect={handleImageSelect}
        onClearImage={clearImage}
        isLoading={isLoading}
        error={error}
        onSubmit={handleGenerateComicPlan}
      />
    );
  }

  // ==================================================
  // VIEW: RESULTS
  // ==================================================
  if (!result) return null;

  return (
    <ResultsView
      result={result}
      themeLabel={selectedTheme.label}
      themeId={selectedTheme.id}
      referenceImage={referenceImage}
      isGeneratingCover={isGeneratingCover}
      coverImage={coverImage}
      coverError={coverError}
      onGenerateCover={handleGenerateCover}
      generatingPanelId={generatingPanelId}
      generatedImages={generatedImages}
      imageErrors={imageErrors}
      mergedScenes={mergedScenes}
      narrationSpace={narrationSpace}
      narrationContent={narrationContent}
      onToggleMerge={handleToggleMerge}
      onNarrationChange={handleNarrationChange}
      onNarrationTextChange={handleNarrationTextChange}
      onNarrationColorChange={handleNarrationColorChange}
      onNarrationFontChange={handleNarrationFontChange}
      onGenerateImage={handleGenerateImage}
      onUpdateDialogueLine={updateDialogueLine}
      onUpdateImagePrompt={updateImagePrompt}
      onBackToInput={handleBackToInput}
    />
  );
}