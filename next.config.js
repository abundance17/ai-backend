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
        hostname: "**.replicate.delivery", // ✅ на всякий случай поддомены
      },
      {
        protocol: "https",
        hostname: "**.trycloudflare.com", // ✅ Разрешаем Cloudflare туннели
      },
    ],
  },

  // 🔥 Разрешаем Cloudflare туннель как доверенный origin (чтобы /login работал)
  experimental: {
    allowedDevOrigins: [
      "http://localhost:3000",
      "https://bright-keeps-pads-accidents.trycloudflare.com", // 👈 твой текущий туннель
    ],
  },
};

module.exports = nextConfig;

