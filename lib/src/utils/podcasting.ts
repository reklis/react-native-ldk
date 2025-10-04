import { TCustomTlv, TPodcastingMetadata } from './types';

// TLV type for Podcasting 2.0 metadata (BLIP-0010)
export const PODCASTING_TLV_TYPE = 7629169;

/**
 * Creates a Podcasting 2.0 TLV record with JSON metadata
 * Spec: https://github.com/lightning/blips/blob/master/blip-0010.md
 * @param metadata Podcasting 2.0 metadata
 * @returns {TCustomTlv} TLV record with type 7629169
 */
export function createPodcastingTlv(metadata: TPodcastingMetadata): TCustomTlv {
	const {
		podcast,
		episode,
		action = 'stream',
		timestamp,
		app_name = 'react-native-ldk',
		value_msat_total,
	} = metadata;

	const tlvData: Record<string, any> = {
		action,
		app_name,
	};

	if (podcast) {
		tlvData.podcast = podcast;
	}

	if (episode) {
		tlvData.episode = episode;
	}

	if (timestamp !== undefined) {
		tlvData.ts = timestamp;
	}

	if (value_msat_total !== undefined) {
		tlvData.value_msat_total = value_msat_total;
	}

	return {
		type: PODCASTING_TLV_TYPE,
		value: JSON.stringify(tlvData),
	};
}

/**
 * Creates a custom wallet routing TLV
 * Used by services like LNPay to route payments to specific wallets
 * @param walletId Wallet identifier
 * @returns {TCustomTlv}
 */
export function createWalletRoutingTlv(walletId: string): TCustomTlv {
	// TLV type 696969 is used by LNPay for wallet routing
	return {
		type: 696969,
		value: walletId,
	};
}

/**
 * Creates a message TLV for sending text with payments
 * @param message Message text
 * @returns {TCustomTlv}
 */
export function createMessageTlv(message: string): TCustomTlv {
	// TLV type 34349334 is used for chat messages
	return {
		type: 34349334,
		value: message,
	};
}

/**
 * Validates Podcasting 2.0 metadata
 * @param metadata
 * @returns {boolean}
 */
export function isValidPodcastingMetadata(
	metadata: TPodcastingMetadata,
): boolean {
	// At minimum, should have an action
	if (!metadata.action) {
		return false;
	}

	// Action should be 'stream' or 'boost'
	if (metadata.action !== 'stream' && metadata.action !== 'boost') {
		return false;
	}

	return true;
}
