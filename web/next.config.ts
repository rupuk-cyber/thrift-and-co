import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev "N" badge overlaps product-card prices on small
  // viewports and looks like a broken UI element in screenshots.
  devIndicators: false,
};

export default nextConfig;
