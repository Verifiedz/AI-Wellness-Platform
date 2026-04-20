const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Resolve tslib explicitly so framer-motion (used by Moti) finds it even when
// npm dedup nests it under a different package.
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  tslib: path.resolve(__dirname, 'node_modules/tslib'),
};

module.exports = config;
