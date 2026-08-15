import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Server-side only. Never prefix with NEXT_PUBLIC_, or it would leak to the client.
const apiKey = process.env.GEMINI_API_KEY;

const responseSchema = {
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
          summary: {
            type: Type.STRING,
            description: "A short description of the story-level event happening in this scene",
          },
          charactersInvolved: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: ["summary", "charactersInvolved"],
      },
    },
  },
  required: ["title", "characters", "scenes"],
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

    const prompt = `
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

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const text = result.text;

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    const analysis = JSON.parse(text);

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (err) {
    console.error("Gemini analyze error:", err);
    return NextResponse.json(
      { error: "Failed to analyze story." },
      { status: 500 }
    );
  }
}