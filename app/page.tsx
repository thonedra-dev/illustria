"use client";

import { useState } from "react";

export default function HomePage() {
  const [story, setStory] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleSubmit = async () => {
    if (!story.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch("/api/story/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong.");
      }

      setAnalysis(data.analysis);
    } catch (err: any) {
      setError(err.message || "Failed to analyze story.");
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = story.trim().length === 0 ? 0 : story.trim().split(/\s+/).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-16">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Illustria
          </h1>
          <p className="text-slate-400">
            Turn your story into a comic. Paste your story below to get started.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <label htmlFor="story" className="block text-sm font-medium text-slate-300 mb-2">
            Your Story
          </label>
          <textarea
            id="story"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Once upon a time, in a small clock shop at the edge of town..."
            className="w-full h-72 resize-none rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 p-4 text-sm leading-relaxed text-slate-100 placeholder-slate-600 transition-colors"
          />

          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-slate-500">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>

            <button
              onClick={handleSubmit}
              disabled={!story.trim() || isLoading}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              {isLoading ? "Analyzing..." : "Generate Comic"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-400 mt-3">{error}</p>
          )}
        </div>

        {analysis && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
            <h2 className="text-lg font-semibold mb-3">Analysis Result</h2>
            <pre className="text-xs text-slate-300 whitespace-pre-wrap bg-slate-950 border border-slate-800 rounded-lg p-4 overflow-x-auto">
              {JSON.stringify(analysis, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-center text-xs text-slate-600 mt-6">
          Illustria will analyze your story, break it into scenes and panels, and generate comic artwork.
        </p>
      </div>
    </main>
  );
}