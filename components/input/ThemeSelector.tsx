import { Theme } from "@/types/comic";
import { THEMES } from "@/lib/themes";

export function ThemeSelector({
  selectedThemeId,
  onSelect,
}: {
  selectedThemeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
      <label className="block text-sm font-medium text-slate-300 mb-3">Comic Style</label>
      <div className="grid sm:grid-cols-2 gap-3">
        {THEMES.map((theme: Theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme.id)}
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
  );
}
