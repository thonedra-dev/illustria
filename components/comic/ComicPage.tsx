import { NarrationContent, NarrationSpace } from "@/types/comic";
import {
  NARRATION_COLORS,
  NARRATION_FONTS,
  STRIP_CHAR_LIMIT,
  SINGLE_PANEL_CHAR_LIMIT,
  STRIP_MAX_LINES,
  getNarrationColor,
  getNarrationFont,
} from "@/lib/narrationStyles";
import {
  getNarrationTreatment,
  getOverlayBackgroundImage,
  getOverlayBackgroundSize,
} from "@/lib/narrationThemeTreatments";

function Panel({ src, className = "" }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt="Panel"
      className={`flex-1 min-w-0 aspect-square object-cover border-2 border-black ${className}`}
    />
  );
}

// The narration box itself: theme-adjusted colored background + centered,
// editable text, with a fixed inner margin on all sides. The same 6 base
// colors render differently depending on the active comic theme (e.g. the
// "parchment" yellow reads as ink-on-paper in Western Comic but as a
// darkened neon HUD panel in Cyberpunk).
function NarrationSurface({
  content,
  themeId,
  onTextChange,
  charLimit,
  maxLines,
  className = "",
  minHeightClass = "",
}: {
  content: NarrationContent;
  themeId: string | undefined;
  onTextChange: (text: string) => void;
  charLimit: number;
  maxLines?: number;
  className?: string;
  minHeightClass?: string;
}) {
  const color = getNarrationColor(content.colorId);
  const font = getNarrationFont(content.fontId);
  const treatment = getNarrationTreatment(color, themeId);
  const overlayImage = getOverlayBackgroundImage(treatment.overlay);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    if (maxLines) {
      const lines = value.split("\n");
      if (lines.length > maxLines) {
        value = lines.slice(0, maxLines).join("\n");
      }
    }

    if (value.length > charLimit) {
      value = value.slice(0, charLimit);
    }

    onTextChange(value);
  };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${minHeightClass} ${className}`}
      style={{
        background: treatment.background,
        borderColor: treatment.borderColor,
        borderWidth: treatment.borderWidth,
        borderStyle: "solid",
        boxShadow: treatment.boxShadow,
      }}
    >
      {overlayImage && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: overlayImage,
            backgroundSize: getOverlayBackgroundSize(treatment.overlay),
            opacity: treatment.overlayOpacity,
            mixBlendMode: treatment.overlay === "scanline" ? "overlay" : "multiply",
          }}
        />
      )}
      <textarea
        value={content.text}
        onChange={handleChange}
        placeholder="Narration..."
        maxLength={charLimit}
        rows={maxLines ?? 1}
        className="relative w-full h-full resize-none bg-transparent border-none outline-none text-center px-6 py-4 sm:px-10 sm:py-5 placeholder:opacity-40"
        style={{
          color: treatment.textColor,
          fontFamily: font.cssVar,
          lineHeight: 1.3,
          textShadow: treatment.extraTextShadow,
        }}
      />
    </div>
  );
}

export function ComicPage({
  images,
  narration,
  content,
  themeId,
  onTextChange,
}: {
  images: string[];
  narration: NarrationSpace;
  content: NarrationContent;
  themeId?: string;
  onTextChange: (text: string) => void;
}) {
  const isSinglePanel = images.length === 1;

  // ---------- Single panel: narration splits left/right, same size as the image ----------
  if (isSinglePanel) {
    const surface = (
      <NarrationSurface
        content={content}
        themeId={themeId}
        onTextChange={onTextChange}
        charLimit={SINGLE_PANEL_CHAR_LIMIT}
        className={`flex-1 min-w-0 aspect-square ${
          narration === "left" ? "border-r-0" : "border-l-0"
        }`}
      />
    );

    if (narration === "left") {
      return (
        <div className="flex w-full">
          {surface}
          <Panel src={images[0]} />
        </div>
      );
    }

    if (narration === "right") {
      return (
        <div className="flex w-full">
          <Panel src={images[0]} className="border-r-0" />
          {surface}
        </div>
      );
    }

    // "none" (or a top/bottom value carried over from a 2-panel scene)
    return (
      <div className="w-full">
        <Panel src={images[0]} />
      </div>
    );
  }

  // ---------- Two panels: full-width row, narration strip spans the same width ----------
  const panelRow = (
    <div className="flex w-full">
      {images.map((src, i) => (
        <Panel key={i} src={src} className={i === 0 ? "border-r-0" : ""} />
      ))}
    </div>
  );

  const strip = (edge: "top" | "bottom") => (
    <NarrationSurface
      content={content}
      themeId={themeId}
      onTextChange={onTextChange}
      charLimit={STRIP_CHAR_LIMIT}
      maxLines={STRIP_MAX_LINES}
      minHeightClass="min-h-16 sm:min-h-20"
      className={`w-full ${edge === "top" ? "border-b-0" : "border-t-0"}`}
    />
  );

  if (narration === "top") {
    return (
      <div className="w-full">
        {strip("top")}
        {panelRow}
      </div>
    );
  }

  if (narration === "bottom") {
    return (
      <div className="w-full">
        <div className="flex w-full">
          {images.map((src, i) => (
            <Panel
              key={i}
              src={src}
              className={`border-b-0 ${i === 0 ? "border-r-0" : ""}`}
            />
          ))}
        </div>
        {strip("bottom")}
      </div>
    );
  }

  // "none"
  return panelRow;
}

// Re-exported so SceneCard can render the color/font pickers next to the
// existing narration-space <select> without duplicating the option lists.
export { NARRATION_COLORS, NARRATION_FONTS };