import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Ignora falhas de ESLint no build de produção (Vercel)
  // Mantemos o ESLint localmente para desenvolvimento
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Evita que o Next infira a raiz errada quando há múltiplos lockfiles no repo
  outputFileTracingRoot: path.join(__dirname, ".."),
  images: {
    // Permitir imagens do Storage do Supabase
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
    // Fallback explícito para o seu projeto (caso o wildcard seja restritivo)
    domains: ["scxgigojuirtpbqtcnpu.supabase.co"],
  },
};

export default nextConfig;
