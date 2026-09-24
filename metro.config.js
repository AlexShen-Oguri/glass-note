const {getDefaultConfig} = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const escapedRoot = __dirname.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Research downloads, tool caches and exported copies are not application inputs.
// Anchor to this project so dependency packages named "dist" remain resolvable.
const localArtifacts = new RegExp(
  `^${escapedRoot}[\\\\/](?:\\.cache|artifacts|dist|dist-ios|research)(?:[\\\\/]|$)`,
);
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : [config.resolver.blockList].filter(Boolean)),
  localArtifacts,
  /^(?:\.cache|artifacts|dist|dist-ios|research)(?:[\\/]|$)/,
];

module.exports = config;
