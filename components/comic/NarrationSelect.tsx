import { NarrationSpace } from "@/types/comic";

export function NarrationSelect({
  value,
  panelCount,
  onChange,
}: {
  value: NarrationSpace;
  panelCount: number;
  onChange: (value: NarrationSpace) => void;
}) {
  const isSinglePanel = panelCount === 1;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as NarrationSpace)}
      className="text-xs bg-slate-900 border border-slate-800 rounded-md px-2 py-1.5 text-slate-200"
    >
      <option value="none">No narration space</option>
      {isSinglePanel ? (
        <>
          <option value="left">Narration space: left</option>
          <option value="right">Narration space: right</option>
        </>
      ) : (
        <>
          <option value="top">Narration space: top</option>
          <option value="bottom">Narration space: bottom</option>
        </>
      )}
    </select>
  );
}
