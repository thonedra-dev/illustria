import { RefObject } from "react";

export function ReferenceImageUpload({
  fileInputRef,
  referenceImage,
  referenceImageName,
  onImageSelect,
  onClear,
}: {
  fileInputRef: RefObject<HTMLInputElement | null>;
  referenceImage: string | null;
  referenceImageName: string | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl mt-6">
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Character Reference Image <span className="text-slate-500 font-normal">(optional)</span>
      </label>
      <p className="text-xs text-slate-500 mb-3">
        Used for identity-consistent image generation across panels.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onImageSelect}
        className="block w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer cursor-pointer"
      />

      {referenceImage && (
        <div className="mt-4 flex items-center gap-3">
          <img
            src={referenceImage}
            alt="Reference preview"
            className="w-16 h-16 object-cover rounded-lg border border-slate-800"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-300 truncate">{referenceImageName}</p>
            <button onClick={onClear} className="text-xs text-red-400 hover:text-red-300 mt-1">
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
