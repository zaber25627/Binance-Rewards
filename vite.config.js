import { defineConfig } from 'vite';

/**
 * GitHub Pages project sites live at /<repo>/.
 * Set VITE_BASE_PATH in CI (see .github/workflows/deploy.yml) or change the fallback.
 * Use "/" for a user/org root site or a custom domain at the root.
 */
export default defineConfig(({ mode }) => {
  const base = process.env.VITE_BASE_PATH || '/';

  return {
    base,
    build: {
      outDir: 'dist',
      sourcemap: mode !== 'production',
      target: 'es2020',
    },
    server: {
      port: 3000,
      host: true,
    },
    preview: {
      port: 4173,
    },
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    },
  };
});