import type { NextConfig } from 'next';
const config: NextConfig = { outputFileTracingRoot: process.cwd(), images: { remotePatterns: [{protocol:'https',hostname:'res.cloudinary.com'}] }, poweredByHeader:false };
export default config;
