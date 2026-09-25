import { RefObject } from "react";
import { ThemeSelector } from "./ThemeSelector";
import { ReferenceImageUpload } from "./ReferenceImageUpload";

export function StoryInputView({
  story,
  setStory,
  environment,
  setEnvironment,
  selectedThemeId,
  setSelectedThemeId,
  referenceImage,
  referenceImageName,
  fileInputRef,
  onImageSelect,
  onClearImage,
  isLoading,
  error,
  onSubmit,
}: {
  story: string;
  setStory: (v: string) => void;
  environment: string;
  setEnvironment: (v: string) => void;
  selectedThemeId: string;
  setSelectedThemeId: (id: string) => void;
  referenceImage: string | null;
  referenceImageName: string | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearImage: () => void;
  isLoading: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const wordCount = story.trim().length === 0 ? 0 : story.trim().split(/\s+/).length;

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
            World / Environment <span className="text-slate-500 font-normal">(optional)</span>
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

        <ThemeSelector selectedThemeId={selectedThemeId} onSelect={setSelectedThemeId} />

        <ReferenceImageUpload
          fileInputRef={fileInputRef}
          referenceImage={referenceImage}
          referenceImageName={referenceImageName}
          onImageSelect={onImageSelect}
          onClear={onClearImage}
        />

        {/* Submit */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onSubmit}
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
