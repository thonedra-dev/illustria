import { NarrationContent, NarrationSpace, Panel, Scene } from "@/types/comic";
import { ComicPage } from "@/components/comic/ComicPage";
import { NarrationSelect } from "@/components/comic/NarrationSelect";
import { NarrationStyleControls } from "@/components/comic/NarrationStyleControls";
import { NarrationColorId, NarrationFontId } from "@/lib/narrationStyles";

export function SceneCard({
  scene,
  panels,
  generatingPanelId,
  generatedImages,
  imageErrors,
  themeLabel,
  isMerged,
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
}: {
  scene: Scene;
  panels: Panel[];
  generatingPanelId: string | null;
  generatedImages: Record<string, string>;
  imageErrors: Record<string, string>;
  themeLabel: string;
  isMerged: boolean;
  narrationSpace: NarrationSpace | undefined;
  narrationContent: NarrationContent;
  onToggleMerge: () => void;
  onNarrationChange: (value: NarrationSpace) => void;
  onNarrationTextChange: (text: string) => void;
  onNarrationColorChange: (id: NarrationColorId) => void;
  onNarrationFontChange: (id: NarrationFontId) => void;
  onGenerateImage: (panelId: string, basePrompt: string) => void;
  onUpdateDialogueLine: (panelId: string, dialogueIndex: number, newLine: string) => void;
  onUpdateImagePrompt: (panelId: string, newPrompt: string) => void;
}) {
  const allGenerated = panels.length > 0 && panels.every((p) => generatedImages[p.panel_id]);
  const defaultNarration: NarrationSpace = panels.every((p) => p.dialogue.length === 0)
    ? panels.length === 1
      ? "right"
      : "bottom"
    : "none";
  const resolvedNarration = narrationSpace ?? defaultNarration;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="mb-4">
        <p className="text-xs text-indigo-400 font-mono mb-1">{scene.scene_id}</p>
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
                <span className="text-xs font-mono text-slate-500">{panel.panel_id}</span>
                {panel.characters.length > 0 && (
                  <span className="text-xs text-slate-400">{panel.characters.join(", ")}</span>
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
                        onChange={(e) => onUpdateDialogueLine(panel.panel_id, i, e.target.value)}
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
                  onChange={(e) => onUpdateImagePrompt(panel.panel_id, e.target.value)}
                  rows={4}
                  className="w-full text-xs leading-relaxed bg-slate-900 border border-slate-800 rounded-md px-2 py-2 text-slate-300 resize-y focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <p className="text-[10px] text-slate-600">
                  Environment + &quot;{themeLabel}&quot; style will be appended automatically on
                  generation.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => onGenerateImage(panel.panel_id, panel.image_prompt)}
                  disabled={isGenerating || !panel.image_prompt.trim()}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-xs font-medium transition-colors"
                >
                  {isGenerating ? "Generating..." : "Generate Image"}
                </button>

                {imageError && <p className="text-xs text-red-400">{imageError}</p>}

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

      {/* MERGE INTO COMIC PAGE */}
      <div className="mt-5 border-t border-slate-800 pt-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onToggleMerge}
            disabled={!allGenerated}
            className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-xs font-medium transition-colors"
          >
            {isMerged ? "Hide Comic Page" : "Merge into Comic Page"}
          </button>

          {!allGenerated && (
            <span className="text-xs text-slate-500">Generate all panel images first.</span>
          )}

          {isMerged && (
            <NarrationSelect
              value={resolvedNarration}
              panelCount={panels.length}
              onChange={onNarrationChange}
            />
          )}
        </div>

        {isMerged && resolvedNarration !== "none" && (
          <NarrationStyleControls
            colorId={narrationContent.colorId}
            fontId={narrationContent.fontId}
            onColorChange={onNarrationColorChange}
            onFontChange={onNarrationFontChange}
          />
        )}

        {isMerged && allGenerated && (
          <ComicPage
            images={panels.map((p) => generatedImages[p.panel_id])}
            narration={resolvedNarration}
            content={narrationContent}
            onTextChange={onNarrationTextChange}
          />
        )}
      </div>
    </div>
  );
}
