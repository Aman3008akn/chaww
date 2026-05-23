import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aman.nexusai',
  appName: 'Nexus AI',
  webDir: 'out',
  server: {
    // IMPORTANT: Replace this with your actual Vercel/Netlify URL
    url: 'https://nexusopp.netlify.app/',
    cleartext: true
  }
};

export default config;
