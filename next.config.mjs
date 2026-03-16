/** @type {import('next').NextConfig} */
const nextConfig = {
    devIndicators: {
      appIsrStatus: false, // Hides the "Static Route" indicator (the lightning bolt)
      buildActivity: false, // Hides the "Building..." animation in the corner
    },
  };
  
  export default nextConfig;