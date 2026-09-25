export type Scene = {
  scene_id: string;
  summary: string;
  charactersInvolved: string[];
};

export type DialogueLine = {
  speaker: string;
  line: string;
};

export type Panel = {
  panel_id: string;
  scene_id: string;
  description: string;
  characters: string[];
  dialogue: DialogueLine[];
  image_prompt: string;
};

export type AnalysisResult = {
  title: string;
  characters: string[];
  cover_prompt: string;
  scenes: Scene[];
};

export type ApiResponse = {
  analysis: AnalysisResult;
  panels: Panel[];
};

export type View = "input" | "results";

export type Theme = {
  id: string;
  label: string;
  description: string;
  styleString: string;
};

// Two-panel scenes stack the narration strip top/bottom, full width.
// Single-panel scenes split the square left/right with the narration box.
export type NarrationSpace = "none" | "top" | "bottom" | "left" | "right";

import { NarrationColorId, NarrationFontId } from "@/lib/narrationStyles";

// Per-scene narration content, kept alongside the layout choice (NarrationSpace).
export type NarrationContent = {
  text: string;
  colorId: NarrationColorId;
  fontId: NarrationFontId;
};
