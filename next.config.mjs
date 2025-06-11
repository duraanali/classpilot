/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": ".",
      "@/convex": "./convex",
      "@/lib": "./app/lib",
    };
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ["convex"],
  },
};

export default nextConfig;
