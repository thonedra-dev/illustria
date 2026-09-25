import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const pager = await ai.models.list();
  const names: string[] = [];
  for await (const m of pager) {
    if (m.name) names.push(m.name);
  }
  return NextResponse.json(names);
}