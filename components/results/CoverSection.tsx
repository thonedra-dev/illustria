export function CoverSection({
  title,
  coverPrompt,
  isGeneratingCover,
  coverImage,
  coverError,
  onGenerateCover,
}: {
  title: string;
  coverPrompt: string;
  isGeneratingCover: boolean;
  coverImage: string | null;
  coverError: string | null;
  onGenerateCover: () => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Cover
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-3">{title}</h2>

        <p className="text-xs text-slate-500 mb-3">{coverPrompt}</p>

        <button
          onClick={onGenerateCover}
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
  );
}
