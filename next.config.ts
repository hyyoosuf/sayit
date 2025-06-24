import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 配置图片优化（可选）
  images: {
    unoptimized: true, // 如果不需要图片优化，可以设置为true
  },
};

export default nextConfig;
