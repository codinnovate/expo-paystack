// Metro config that lets the example resolve the local `expo-paystack` source
// from the parent directory (so changes are picked up without publishing).
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const packageRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [packageRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(packageRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
