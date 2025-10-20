"use client";
import { useState } from "react";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setImage(null);

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    setLoading(false);

    if (data?.output?.[0]) setImage(data.output[0]);
    else alert("Не удалось сгенерировать изображение 😢");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">🎨 Генерация AI-Аватара</h1>

      <div className="flex space-x-2 mb-6">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="border rounded-lg px-4 py-2 w-80"
          placeholder="Опиши свой аватар..."
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Генерируется..." : "Создать"}
        </button>
      </div>

      {image && (
        <div className="mt-6">
          <img
            src={image}
            alt="AI Avatar"
            className="w-64 h-64 rounded-2xl shadow-lg border"
          />
        </div>
      )}
    </div>
  );
}

