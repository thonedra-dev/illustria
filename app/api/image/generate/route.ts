import { NextRequest, NextResponse } from "next/server";
import { Client } from "@gradio/client";

const hfToken = process.env.HF_TOKEN;

const SPACE_ID = "yanze/PuLID-FLUX";

export async function POST(req: NextRequest) {
  try {
    if (!hfToken) {
      return NextResponse.json(
        { error: "Server misconfiguration: HF_TOKEN is missing." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const prompt = body?.prompt;
    const referenceImage = body?.referenceImage; // base64 data URL

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "A non-empty 'prompt' string is required." },
        { status: 400 }
      );
    }
    
    if (
      !referenceImage ||
      typeof referenceImage !== "string" ||
      !referenceImage.startsWith("data:")
    ) {
      return NextResponse.json(
        {
          error:
            "A character reference image is required for this generation method. Please upload one on the input page.",
        },
        { status: 400 }
      );
    }

    // Convert the base64 data URL into a Blob the Gradio client can send as id_image.
    const base64Data = referenceImage.split(",")[1];
    if (!base64Data) {
      return NextResponse.json(
        { error: "'referenceImage' is not a valid base64 data URL." },
        { status: 400 }
      );
    }

    const mimeMatch = referenceImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";

    const imageBuffer = Buffer.from(base64Data, "base64");
    const idImageBlob = new Blob([imageBuffer], { type: mimeType });

    // Connect to the public PuLID-FLUX Space, authenticated with our HF token
    // so we get our account's quota/queue priority instead of anonymous access.
    const client = await Client.connect(SPACE_ID, { hf_token: hfToken as `hf_${string}` });

    const result = await client.predict("/generate_image", {
      prompt,
      id_image: idImageBlob,
      start_step: 0,
      guidance: 4,
      seed: Math.floor(Math.random() * 1_000_000).toString(),
      true_cfg: 1,
      width: 768,
      height: 768,
      num_steps: 20,
      id_weight: 1,
      neg_prompt: "",
      timestep_to_start_cfg: 1,
      max_sequence_length: 128,
    });

    const output = result?.data;

    if (!output || !Array.isArray(output) || output.length === 0) {
      return NextResponse.json(
        { error: "PuLID-FLUX returned an empty response." },
        { status: 502 }
      );
    }

    // Gradio image outputs typically come back as either a direct URL string
    // or an object containing a "url" field, depending on client version.
    const firstOutput = output[0];
    const imageUrl =
      typeof firstOutput === "string"
        ? firstOutput
        : firstOutput?.url || firstOutput?.path;

    if (!imageUrl) {
      console.error("Unexpected PuLID-FLUX output shape:", output);
      return NextResponse.json(
        { error: "Could not read image from PuLID-FLUX response." },
        { status: 502 }
      );
    }

    // Fetch the actual image bytes from the URL Gradio gave us, then convert
    // to a base64 data URL so page.tsx can drop it straight into <img src>,
    // matching the same response contract as the previous Stability route.
    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch generated image from PuLID-FLUX." },
        { status: 502 }
      );
    }

    const imageArrayBuffer = await imageRes.arrayBuffer();
    const outputBase64 = Buffer.from(imageArrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${outputBase64}`;

    return NextResponse.json({ image: dataUrl }, { status: 200 });
  } catch (err) {
    console.error("PuLID-FLUX image generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate image." },
      { status: 500 }
    );
  }
}