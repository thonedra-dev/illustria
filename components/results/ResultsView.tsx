import { ApiResponse, NarrationContent, NarrationSpace } from "@/types/comic";
import { NarrationColorId, NarrationFontId, DEFAULT_NARRATION_COLOR_ID, DEFAULT_NARRATION_FONT_ID } from "@/lib/narrationStyles";
import { CoverSection } from "./CoverSection";
import { CharacterList } from "./CharacterList";
import { SceneCard } from "./SceneCard";

export function ResultsView({
  result,
  themeLabel,
  themeId,
  referenceImage,
  isGeneratingCover,
  coverImage,
  coverError,
  onGenerateCover,
  generatingPanelId,
  generatedImages,
  imageErrors,
  mergedScenes,
  narrationSpace,
  narrationContent,
  onToggleMerge,
  onNarrationChange,
  onNarrationTextChange,
  onNarrationColorChange,
  onNarrationFontChange,
  onGenerateImage,
  onUpdateDialogueLine,
  onUpdateImagePrompt,
  onBackToInput,
}: {
  result: ApiResponse;
  themeLabel: string;
  themeId: string;
  referenceImage: string | null;
  isGeneratingCover: boolean;
  coverImage: string | null;
  coverError: string | null;
  onGenerateCover: () => void;
  generatingPanelId: string | null;
  generatedImages: Record<string, string>;
  imageErrors: Record<string, string>;
  mergedScenes: Record<string, boolean>;
  narrationSpace: Record<string, NarrationSpace>;
  narrationContent: Record<string, NarrationContent>;
  onToggleMerge: (sceneId: string) => void;
  onNarrationChange: (sceneId: string, value: NarrationSpace) => void;
  onNarrationTextChange: (sceneId: string, text: string) => void;
  onNarrationColorChange: (sceneId: string, id: NarrationColorId) => void;
  onNarrationFontChange: (sceneId: string, id: NarrationFontId) => void;
  onGenerateImage: (panelId: string, basePrompt: string) => void;
  onUpdateDialogueLine: (panelId: string, dialogueIndex: number, newLine: string) => void;
  onUpdateImagePrompt: (panelId: string, newPrompt: string) => void;
  onBackToInput: () => void;
}) {
  const panelsByScene = result.analysis.scenes.map((scene) => ({
    scene,
    panels: result.panels.filter((p) => p.scene_id === scene.scene_id),
  }));

  const defaultContent: NarrationContent = {
    text: "",
    colorId: DEFAULT_NARRATION_COLOR_ID,
    fontId: DEFAULT_NARRATION_FONT_ID,
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-3xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Illustria</h1>
            <p className="text-slate-400 text-sm mt-1">Comic Plan Results — {themeLabel}</p>
          </div>
          <button
            onClick={onBackToInput}
            className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 rounded-lg px-3 py-2 transition-colors"
          >
            ← Back to Input
          </button>
        </div>

        <div className="space-y-8">
          <CoverSection
            title={result.analysis.title}
            coverPrompt={result.analysis.cover_prompt}
            isGeneratingCover={isGeneratingCover}
            coverImage={coverImage}
            coverError={coverError}
            onGenerateCover={onGenerateCover}
          />

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

          <CharacterList characters={result.analysis.characters} />

          <section>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Scenes
            </h3>
            <div className="space-y-6">
              {panelsByScene.map(({ scene, panels }) => (
                <SceneCard
                  key={scene.scene_id}
                  scene={scene}
                  panels={panels}
                  generatingPanelId={generatingPanelId}
                  generatedImages={generatedImages}
                  imageErrors={imageErrors}
                  themeLabel={themeLabel}
                  themeId={themeId}
                  isMerged={!!mergedScenes[scene.scene_id]}
                  narrationSpace={narrationSpace[scene.scene_id]}
                  narrationContent={narrationContent[scene.scene_id] ?? defaultContent}
                  onToggleMerge={() => onToggleMerge(scene.scene_id)}
                  onNarrationChange={(value) => onNarrationChange(scene.scene_id, value)}
                  onNarrationTextChange={(text) => onNarrationTextChange(scene.scene_id, text)}
                  onNarrationColorChange={(id) => onNarrationColorChange(scene.scene_id, id)}
                  onNarrationFontChange={(id) => onNarrationFontChange(scene.scene_id, id)}
                  onGenerateImage={onGenerateImage}
                  onUpdateDialogueLine={onUpdateDialogueLine}
                  onUpdateImagePrompt={onUpdateImagePrompt}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}