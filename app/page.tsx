export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-center p-8">
      <h1 className="text-4xl font-bold mb-4 text-gray-800">
        🚀 AI Avatars
      </h1>
      <p className="text-lg text-gray-600 mb-6">
        Добро пожаловать! Всё готово для генерации аватаров.
      </p>
      <a
        href="/upload"
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Перейти к загрузке
      </a>
    </main>
  );
}


