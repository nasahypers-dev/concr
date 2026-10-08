// Expo SDK 52+ detects npm workspaces automatically (watchFolders / nodeModulesPaths).
// NativeWind compiles global.css into StyleSheet objects at bundle time.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: './global.css' });
