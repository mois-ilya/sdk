import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

/**
 * Generates tonconnect-manifest.json at build time.
 *
 * Environment variables:
 *   VITE_APP_URL - Full URL (e.g., https://user.github.io/repo/)
 *
 * For local development, defaults to http://localhost:5173
 */
function generateManifest(): Plugin {
    return {
        name: 'generate-tonconnect-manifest',
        writeBundle(options) {
            const appUrl = (process.env.VITE_APP_URL || 'http://localhost:5173').replace(/\/$/, '');
            const outDir = options.dir || 'dist';

            const manifest = {
                url: appUrl,
                name: 'TonConnect Demo',
                iconUrl: `${appUrl}/favicon.png`,
                termsOfUseUrl: `${appUrl}/terms-of-use.txt`,
                privacyPolicyUrl: `${appUrl}/privacy-policy.txt`
            };

            fs.writeFileSync(
                path.join(outDir, 'tonconnect-manifest.json'),
                JSON.stringify(manifest, null, 2)
            );

            console.log(`Generated tonconnect-manifest.json for ${appUrl}`);
        }
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    // Base path for GitHub Pages deployment (e.g., /repo/ or /repo/branch/)
    base: process.env.VITE_BASE_PATH || '/',
    plugins: [react(), tailwindcss(), generateManifest()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        allowedHosts: true
    }
});
