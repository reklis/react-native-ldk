import { err, ok, Result } from './result';

export type TLightningAddressResponse = {
	pubkey: string;
	metadata?: string;
	minSendable?: number;
	maxSendable?: number;
	commentAllowed?: number;
};

/**
 * Resolves a Lightning Address (user@domain.com) to a node public key
 * using the LN URL Pay protocol (LUD-16)
 * @param address Lightning Address in format user@domain.com
 * @returns {Promise<Result<TLightningAddressResponse>>}
 */
export async function resolveLightningAddress(
	address: string,
): Promise<Result<TLightningAddressResponse>> {
	try {
		// Validate address format
		if (!address.includes('@')) {
			return err('Invalid Lightning Address format. Expected user@domain.com');
		}

		const [username, domain] = address.split('@');
		if (!username || !domain) {
			return err('Invalid Lightning Address format');
		}

		// Fetch Lightning Address metadata
		const url = `https://${domain}/.well-known/lnurlp/${username}`;
		const response = await fetch(url);

		if (!response.ok) {
			return err(
				`Failed to fetch Lightning Address: ${response.status} ${response.statusText}`,
			);
		}

		const data = await response.json();

		// Extract public key from various possible fields
		const pubkey =
			data.allowsNostr?.pubkey || data.nostrPubkey || data.pubkey || '';

		if (!pubkey) {
			return err('No public key found in Lightning Address response');
		}

		return ok({
			pubkey,
			metadata: data.metadata,
			minSendable: data.minSendable,
			maxSendable: data.maxSendable,
			commentAllowed: data.commentAllowed,
		});
	} catch (e) {
		return err(e);
	}
}

/**
 * Validates Lightning Address format
 * @param address
 * @returns {boolean}
 */
export function isValidLightningAddress(address: string): boolean {
	const parts = address.split('@');
	if (parts.length !== 2) {
		return false;
	}

	const [username, domain] = parts;
	if (!username || !domain) {
		return false;
	}

	// Basic domain validation
	if (!domain.includes('.')) {
		return false;
	}

	return true;
}
