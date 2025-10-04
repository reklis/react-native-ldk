const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
	resolver: {
		extraNodeModules: {
			stream: path.resolve(__dirname, 'node_modules/stream-browserify'),
			buffer: path.resolve(__dirname, 'node_modules/buffer/'),
			assert: path.resolve(__dirname, 'node_modules/assert/'),
			events: path.resolve(__dirname, 'node_modules/events/'),
			crypto: path.resolve(__dirname, 'node_modules/crypto-browserify/'),
			vm: path.resolve(__dirname, 'node_modules/vm-browserify/'),
			process: path.resolve(__dirname, 'node_modules/process/'),
			'bitcoin-json-rpc': path.resolve(__dirname, 'bitcoin-json-rpc-wrapper.js'),
		},
		sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'cjs'],
	},
	transformer: {
		getTransformOptions: async () => ({
			transform: {
				experimentalImportSupport: false,
				inlineRequires: true,
			},
		}),
	},
};

module.exports = mergeConfig(defaultConfig, config);
