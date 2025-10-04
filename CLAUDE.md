# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

react-native-ldk is a React Native wrapper for Lightning Development Kit (LDK), enabling Lightning Network functionality in React Native applications. The project consists of:

- **lib/** - Core library with TypeScript wrapper and native implementations (iOS/Android)
- **example/** - React Native example app demonstrating library usage
- **backup-server/** - Node.js backup server for LDK state persistence

## Development Commands

### Library (lib/)

```bash
# Build TypeScript dist files
cd lib && yarn build

# Watch mode for development
yarn watch

# Linting
yarn lint:check
yarn lint:fix

# Update example app with library changes (used during development)
yarn dev:save-ios-updates    # Copy iOS changes from example/node_modules back to lib
yarn dev:save-android-updates # Copy Android changes from example/node_modules back to lib
yarn dev:update-example-dist  # Update example's dist files
yarn dev:example             # All of the above
```

### Example App (example/)

```bash
# Initial setup after cloning
cd react-native-ldk/lib && yarn install && yarn build
cd ../example && yarn install && yarn rn-setup

# Run app
yarn ios
yarn android

# Start metro bundler
yarn start

# Reinstall library after changes
yarn reinstall  # Rebuilds lib and reinstalls in example

# Clean rebuild
yarn clean

# Linting
yarn lint:check
yarn lint:fix
```

### Testing

Tests use mocha-remote for running on actual React Native runtime:

```bash
# Terminal 1 - Start docker environment (bitcoind, lnd, clightning, eclair, electrs)
cd example
docker-compose up

# Terminal 2 - Start React Native metro bundler
cd example
npm run start

# Terminal 3 - Run tests
cd example
npm run test:mocha           # Run tests on connected device/simulator
npm run test:mocha:ios       # Auto-launch iOS simulator and run tests
npm run test:mocha:android   # Auto-launch Android emulator and run tests
```

E2E tests using Detox:
```bash
yarn e2e:build:ios-debug
yarn e2e:test:ios-debug
```

### Backup Server (backup-server/)

```bash
cd backup-server
npm start
npm run create-keypair
npm test
```

### Version Bumping

```bash
# From root, after making changes:
cd example
yarn reinstall  # Updates versions in package.json & Podfile
# Manually copy version from ./lib/package.json to backup-server/package.json
```

## Architecture

### Core Components

The library follows a layered architecture:

1. **TypeScript Layer** (lib/src/)
   - `lightning-manager.ts` - High-level API for managing LDK lifecycle, handles events, channels, payments
   - `ldk.ts` - Low-level wrapper class around React Native bridge to native modules
   - `utils/types.ts` - TypeScript definitions for all LDK types and events
   - `utils/helpers.ts` - Utility functions for transaction parsing, validation, etc.
   - `mock.ts` - Jest mock for testing consumer apps

2. **Native Bridge Layer**
   - iOS: `lib/ios/Ldk.swift` + `lib/ios/Ldk.m` (Objective-C bridge)
   - Android: `lib/android/src/main/java/com/reactnativeldk/LdkModule.kt`

3. **LDK Implementation Classes**
   - Implement LDK traits/interfaces required by the library
   - iOS: `lib/ios/Classes/*.swift`
   - Android: `lib/android/src/main/java/com/reactnativeldk/classes/*.kt`
   - Classes include: Logger, FeeEstimator, Broadcaster, Filter, Persister, ChannelManagerPersister, CustomKeysManager, BackupClient

### Event System

LDK events are emitted from native code to JavaScript via React Native's event emitter:
- LDK logs: `EEventTypes.ldk_log`
- Transaction registration: `EEventTypes.register_tx`, `EEventTypes.register_output`
- Broadcast requests: `EEventTypes.broadcast_transaction`
- Channel Manager events: Payment sent/failed, channels opened/closed, HTLCs, spendable outputs, etc.
- Network graph updates: `EEventTypes.network_graph_updated`

The `lightning-manager.ts` subscribes to these events and manages state accordingly.

### LDK Startup Sequence

The library implements the full LDK startup sequence (documented in `lightning-manager.ts:80-100`):
1. Listen for events
2. Initialize FeeEstimator, Logger, BroadcasterInterface, Persist
3. Initialize ChainMonitor, KeysManager
4. Read ChannelMonitor state from disk
5. Initialize ChannelManager
6. Sync ChannelMonitors and ChannelManager to chain tip
7. Give ChannelMonitors to ChainMonitor
8. Initialize PeerManager
9. Initialize networking
10. Connect and Disconnect Blocks
11. Handle LDK Events
12. Initialize routing ProbabilisticScorer
13. Create InvoicePayer
14. Persist ChannelManager and NetworkGraph
15. Background Processing

### Storage

- Account-based storage with path set via `setAccountStoragePath()`
- Critical: Do not mix account names and seeds - this causes corrupt state
- Persists: ChannelManager state, ChannelMonitor state, NetworkGraph, scorer data
- Backup server can be configured for remote state backup

### Zero-Conf Channels

Supported when:
- UserConfig has `manually_accept_inbound_channels: true` and `negotiate_anchors_zero_fee_htlc_tx: true`
- Counterparty is in trusted peers list passed to `lm.start()`
- Channel acceptance is handled automatically by channel-manager.ts if peer is trusted

## Important Notes

- Minimum Android SDK: 24
- iOS requires pod install
- LDK AAR/xcframework files are committed in repo (lib/android/libs/, lib/ios/)
- Native module mocking: Use `import * from '@synonymdev/react-native-ldk/dist/mock'`
- Yarn resolutions enforce security patches for cipher-base, sha.js, ws, semver

## Upgrading LDK

1. Download latest LDK-release.aar from [ldk-garbagecollected](https://github.com/lightningdevkit/ldk-garbagecollected/releases) → place in `lib/android/libs`
2. Download latest LDKFramework.xcframework from [ldk-swift](https://github.com/lightningdevkit/ldk-swift/releases) → place in `lib/ios`
   - May need to delete non-iOS frameworks from xcframework directory
   - Remove references to deleted frameworks in `LDKFramework.xcframework/Info.plist`
3. Update Swift/Kotlin code for any breaking API changes

## Testing Infrastructure

The example app includes a complete regtest environment via Docker Compose:
- bitcoind (regtest mode, RPC + ZMQ)
- electrs (Electrum server)
- lnd, clightning, eclair (Lightning implementations for interop testing)
- ldk-backup-server (state backup service)
- nginx (serves fee estimates)

Test files structure:
- `example/e2e/ldk.test.js` - Detox E2E tests
- `example/tests/*.ts` - Mocha-remote tests for lnd/clightning/eclair interop
- `example/tests/unit.ts` - Unit tests
