import { NarrationColorId, NarrationFontId, NARRATION_COLORS, NARRATION_FONTS } from "@/lib/narrationStyles";

export function NarrationStyleControls({
  colorId,
  fontId,
  onColorChange,
  onFontChange,
}: {
  colorId: NarrationColorId;
  fontId: NarrationFontId;
  onColorChange: (id: NarrationColorId) => void;
  onFontChange: (id: NarrationFontId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        {NARRATION_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            title={color.label}
            onClick={() => onColorChange(color.id)}
            className={`w-6 h-6 rounded-full border-2 transition-transform ${
              colorId === color.id
                ? "border-indigo-400 scale-110"
                : "border-slate-700 hover:scale-105"
            }`}
            style={{ background: color.background }}
          />
        ))}
      </div>

      {/* Font picker */}
      <select
        value={fontId}
        onChange={(e) => onFontChange(e.target.value as NarrationFontId)}
        className="text-xs bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200"
      >
        {NARRATION_FONTS.map((font) => (
          <option key={font.id} value={font.id}>
            {font.label} font
          </option>
        ))}
      </select>
    </div>
  );
}
