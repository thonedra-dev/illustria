import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Server-side only. Never prefix with NEXT_PUBLIC_, or it would leak to the client.
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
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: {
            type: Type.STRING,
            description: "Physical appearance and personality, for consistent art generation",
          },
        },
        required: ["name", "description"],
      },
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
  required: ["title", "characters", "scenes"],
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
            description: "Character names visually present in this panel (usually 0-3 characters)",
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
              "A detailed image-generation prompt describing composition, characters, actions, environment, camera/view, mood, and lighting, suitable for a future Stable Diffusion/SDXL comic panel generation stage.",
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

    if (!story || typeof story !== "string" || !story.trim()) {
      return NextResponse.json(
        { error: "A non-empty 'story' string is required." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // ---------- Stage 1: Story Analysis ----------
    const analysisPrompt = `
You are a story analysis engine for a story-to-comic application.
Read the following story and break it down into structured data.

Identify:
1. A short title for the story. But please take the title from the story if it is mentioned.
2. The characters, with a short visual/personality description for each (useful for consistent character art later).
3. The scenes — meaningful story-level events, NOT comic panels. Keep scenes at the level of "what happens", not "how it's drawn".

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

    const text = analysisResult.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    const analysis = JSON.parse(text);

// ---------- Stage 2: Panel Planning ----------
    // Uses the analysis result from Stage 1 as input. Never sent to the client
    // on its own — only used server-side to build this second prompt.
    const panelPrompt = `
You are a comic panel planning engine. You are given a story's scenes and characters.
For EACH scene, decide how many panels are needed to visually tell that scene, and
describe each panel individually.

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
- For image_prompt, write a detailed, self-contained prompt describing: composition,
  which characters are present and what they are doing, environment/setting,
  camera angle or shot type (e.g. close-up, wide shot), mood, and lighting.
  Write it as a prompt for an image generation model, not as narration.

Characters:
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