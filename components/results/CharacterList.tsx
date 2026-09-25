export function CharacterList({ characters }: { characters: string[] }) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
        Characters
      </h3>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap gap-2">
          {characters.map((name) => (
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
  );
}
