import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

// ---------- Schema for Stage 1: Story Analysis ----------
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: "A short title for the story",
    },
    characters: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Names of all characters appearing in the story",
    },
    cover_prompt: {
  type: Type.STRING,
  description:
    "A detailed image-generation prompt for the story's cover page. Must start with exactly ONE opening sentence blending the world/environment description with the story's overall mood and visual theme. Then continue describing the main character(s)' pose/action, composition, camera framing, and atmosphere. Do not invent detailed physical character descriptions — identity will be supplied separately via a reference image.",
},
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scene_id: {
            type: Type.STRING,
            description: "A short unique id for this scene, e.g. 'scene_1'",
          },
          summary: {
            type: Type.STRING,
            description: "A short description of the story-level event happening in this scene",
          },
          charactersInvolved: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["scene_id", "summary", "charactersInvolved"],
      },
    },
  },
  required: ["title", "characters", "cover_prompt", "scenes"],
};

// ---------- Schema for Stage 2: Panel Planning ----------
const panelPlanSchema = {
  type: Type.OBJECT,
  properties: {
    panels: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          panel_id: {
            type: Type.STRING,
            description: "A short unique id for this panel, e.g. 'panel_1'",
          },
          scene_id: {
            type: Type.STRING,
            description: "The scene_id this panel belongs to",
          },
          description: {
            type: Type.STRING,
            description: "What the reader should see in this panel",
          },
          characters: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Character names visually present in this panel (usually 0-3)",
          },
          dialogue: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                speaker: { type: Type.STRING },
                line: { type: Type.STRING },
              },
              required: ["speaker", "line"],
            },
            description: "Dialogue lines spoken in this panel, if any. Empty array if none.",
          },
          image_prompt: {
            type: Type.STRING,
            description:
              "A detailed image-generation prompt describing composition, actions, environment, camera/view, mood, and lighting, suitable for a future Stable Diffusion comic panel generation stage. Do not invent detailed physical character descriptions — character identity will be supplied separately via a reference image. Stay consistent with the story's established environment/world description provided below.",
          },
        },
        required: ["panel_id", "scene_id", "description", "characters", "dialogue", "image_prompt"],
      },
    },
  },
  required: ["panels"],
};

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const story = body?.story;
    const environment = typeof body?.environment === "string" ? body.environment.trim() : "";
    const theme = typeof body?.theme === "string" ? body.theme.trim() : "";

    if (!story || typeof story !== "string" || !story.trim()) {
      return NextResponse.json(
        { error: "A non-empty 'story' string is required." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Shared context block, injected into both stages so the world/setting
    // and tone stay consistent across the entire story, not just per-panel.
    const contextBlock = `
${environment ? `World / Environment description (keep ALL scenes and the cover consistent with this):\n"""\n${environment}\n"""\n` : ""}
${theme ? `Visual theme / tone for the story: ${theme}\n` : ""}
`.trim();

    // ---------- Stage 1: Story Analysis ----------
    const analysisPrompt = `
You are a story analysis engine for a story-to-comic application.
Read the following story and break it down into structured data.

${contextBlock ? contextBlock + "\n" : ""}
Identify:
1. A short title for the story.
2. The names of all characters (names only — no descriptions needed).
3. A cover_prompt: a single detailed image-generation prompt for the story's cover page, capturing the main character(s), setting, and mood, consistent with the world/environment description above if provided.
4. The scenes — meaningful story-level events, NOT comic panels. Keep scenes at the level of "what happens", not "how it's drawn". Give each scene a unique scene_id (e.g. "scene_1", "scene_2").

Story:
"""
${story}
"""
`;

    const analysisResult = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: analysisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const analysisText = analysisResult.text;
    if (!analysisText) {
      return NextResponse.json(
        { error: "Gemini returned an empty analysis response." },
        { status: 502 }
      );
    }

    const analysis = JSON.parse(analysisText);

    // ---------- Stage 2: Panel Planning ----------
    const panelPrompt = `
You are a comic panel planning engine. You are given a story's scenes and character names.
For EACH scene, decide how many panels are needed to visually tell that scene, and
describe each panel individually.

${contextBlock ? contextBlock + "\n" : ""}
Rules:
- A scene is a story-level event. A panel is ONE visual moment within that scene.
- A single scene may become multiple panels if needed to show the action clearly
  (e.g. a slap might become: hand raised → contact → reaction).
- A single simple scene may only need one panel. Do not over-split simple moments.
- Do NOT automatically create one panel per character. Group characters into the
  same panel whenever the scene shows them interacting together (up to about 3
  characters per panel is fine).
- Only include characters who are visually present/visible in that specific panel.
- Include dialogue only in the panel where it is actually spoken. Use an empty
  dialogue array if a panel has no dialogue.
- For image_prompt, ALWAYS start with exactly ONE opening sentence that blends the
  world/environment description above with what is specifically happening in THIS
  panel right now (not a generic environment restatement — tailor it to this exact
  moment), and briefly nods to the visual theme/tone for atmosphere. Then continue
  with the rest of the panel description: composition, actions, camera angle or shot
  type (e.g. close-up, wide shot), mood, and lighting. Do NOT invent detailed physical
  descriptions of characters (hair, face, clothing) — their visual identity will be
  supplied separately via a reference image at generation time. You may refer to
  characters by name and describe their pose/action/expression only.

Character names:
${JSON.stringify(analysis.characters, null, 2)}

Scenes:
${JSON.stringify(analysis.scenes, null, 2)}
`;

    const panelResult = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: panelPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: panelPlanSchema,
      },
    });

    const panelText = panelResult.text;
    if (!panelText) {
      return NextResponse.json(
        { error: "Gemini returned an empty panel plan response." },
        { status: 502 }
      );
    }

    const panelPlan = JSON.parse(panelText);

    // ---------- Final combined response ----------
    return NextResponse.json(
      {
        analysis,
        panels: panelPlan.panels,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Gemini analyze/panel-plan error:", err);
    return NextResponse.json(
      { error: "Failed to analyze story." },
      { status: 500 }
    );
  }
}