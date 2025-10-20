/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co", // ✅ Разрешаем все поддомены supabase
      },
      {
        protocol: "https",
        hostname: "replicate.delivery", // ✅ Разрешаем replicate
      },
      {
        protocol: "https",
        hostname: "**.replicate.delivery", // ✅ поддомены replicate
      },
      {
        protocol: "https",
        hostname: "**.trycloudflare.com", // ✅ Разрешаем Cloudflare туннели
      },
    ],
  },

  // ✅ Убираем устаревшее experimental.allowedDevOrigins
  reactStrictMode: true,
  experimental: {
    serverActions: true, // оставляем только реально поддерживаемую опцию
  },
};

module.exports = nextConfig;

