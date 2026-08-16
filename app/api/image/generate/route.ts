import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.STABILITY_API_KEY;

const STABILITY_ENDPOINT = "https://api.stability.ai/v2beta/stable-image/generate/sd3";

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server misconfiguration: STABILITY_API_KEY is missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = body?.prompt;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A non-empty 'prompt' string is required." },
        { status: 400 }
      );
    }

    // Stability's v2beta endpoints expect multipart/form-data, even for
    // text-only requests. The empty "none" file field is required by their
    // API to correctly parse the multipart body.
    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("model", "sd3.5-flash"); // smallest/cheapest SD3.5 variant
    formData.append("mode", "text-to-image");
    formData.append("output_format", "png");
    formData.append("aspect_ratio", "1:1");
    formData.append("none", "");

    const stabilityRes = await fetch(STABILITY_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "image/*",
      },
      body: formData,
    });

    if (!stabilityRes.ok) {
      // Stability returns JSON error bodies on failure, not an image.
      let errorDetail = "Unknown error from Stability AI.";
      try {
        const errJson = await stabilityRes.json();
        errorDetail = errJson?.errors?.join(", ") || JSON.stringify(errJson);
      } catch {
        // response wasn't JSON either; fall back to status text
        errorDetail = stabilityRes.statusText;
      }

      console.error("Stability AI error:", stabilityRes.status, errorDetail);

      return NextResponse.json(
        { error: `Image generation failed: ${errorDetail}` },
        { status: stabilityRes.status }
      );
    }

    const imageBuffer = await stabilityRes.arrayBuffer();

    if (!imageBuffer || imageBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "Stability AI returned an empty image." },
        { status: 502 }
      );
    }

    // Convert binary image data to a base64 data URL so page.tsx can drop it
    // straight into an <img src="..."> with no extra fetching/decoding.
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({ image: dataUrl }, { status: 200 });
  } catch (err) {
    console.error("Image generate route error:", err);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 }
    );
  }
}