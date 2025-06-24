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
    unoptimized: false, // 如果不需要图片优化，可以设置为true
  },
  // 添加静态文件服务配置
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/static/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
