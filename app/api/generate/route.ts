// app/api/generate/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // ⚙️ Пока просто фейковый ответ — потом заменим на реальный Replicate API
  const fakeImageUrl = "https://placekitten.com/512/512";

  return NextResponse.json({
    imageUrl: fakeImageUrl,
  });
}

