// app/generate/page.tsx
"use client";

import { useState } from "react";

export default function GeneratePage() {
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const res = await fetch("/api/generate", { method: "POST" });
      if (!res.ok) throw new Error("Ошибка при генерации");
      const data = await res.json();
      setImageUrl(data.imageUrl);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white text-black">
      <h1 className="text-4xl font-bold mb-6">🎨 Генерация AI-Аватара</h1>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition"
      >
        {loading ? "⏳ Генерация..." : "🚀 Создать"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      {imageUrl && (
        <div className="mt-6">
          <img
            src={imageUrl}
            alt="Generated avatar"
            className="w-64 h-64 rounded-xl shadow-lg"
          />
        </div>
      )}
    </main>
  );
}

