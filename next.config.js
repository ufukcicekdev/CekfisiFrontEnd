/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mui/material', '@mui/system', '@emotion/react', '@emotion/styled'],
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // ... diğer konfigürasyonlar
}

module.exports = nextConfig 