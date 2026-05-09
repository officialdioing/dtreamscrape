/**
 * Bundle Analyzer Configuration
 *
 * Run with: npm run analyze
 */

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Your existing Next.js config
  ...require('./next.config.ts'),
});
