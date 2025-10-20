import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return NextResponse.json({ error: "Missing REPLICATE_API_TOKEN" }, { status: 500 });
    }

    // 🔥 Используем стабильную модель Replicate: Stable Diffusion XL
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Token ${replicateToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "5c7d4458edc1db0d24dc29d3b66d65c99ab6f4b785e8d0e8a4305c5774d5fabb", // ✅ Stable Diffusion XL (проверено)
        input: {
          prompt,
          width: 512,
          height: 512,
          refine: "expert_ensemble_refiner",
          scheduler: "K_EULER",
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 40,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Replicate error:", data);
      return NextResponse.json({ error: data?.error?.message || "Failed to generate" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error generating avatar:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

