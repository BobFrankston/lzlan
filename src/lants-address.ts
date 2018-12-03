// Fixed bug -- handle non-octet mask


/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-address.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
'use strict';
// const mOs = require('os');
import * as mOs from 'os';

type NetworkInterfaceInfoWithBroadcast = mOs.NetworkInterfaceInfo | { broadcast: mOs.NetworkInterfaceInfo };

/* ------------------------------------------------------------------
* Constructor: LifxLanAddress()
* ---------------------------------------------------------------- */
export class LifxLanAddress {

	/* ------------------------------------------------------------------
	* Method: getNetworkInterfaces()
	* ---------------------------------------------------------------- */
	getNetworkInterfaces() {
		const list: mOs.NetworkInterfaceInfo[] = [];	// Need to fix this signature
		// const list: NetworkInterfaceInfoWithBroadcast[] = [];	// Need to fix this signature
		const netifs = mOs.networkInterfaces();
		for (const dev in netifs) {
			netifs[dev].forEach((info) => {
				if (info.family !== 'IPv4' || info.internal === true) {
					return;
				}
				if (/^169\.254\./.test(info.address)) {
					return;	// Why??
				}
				(<any>info)['broadcast'] = this._getBroadcastAddress(info);
				list.push(info);
			})
		}
		return list;
	};

	_getBroadcastAddress(info: mOs.NetworkInterfaceInfoIPv4) {
		const addr_parts = this._convIPv4ToNumList(info.address);
		const mask_parts = this._convIPv4ToNumList(info.netmask);
		const cast_parts = addr_parts.map((a, i) => (~mask_parts[i] & 0xff) | a);
		return cast_parts.join('.');

		// Corrected for non-octet masks

		// const cast_parts = [];
		// for (let i = 0; i < mask_parts.length; i++) {
		// 	if (mask_parts[i] === 0) {
		// 		cast_parts.push(255);
		// 	} else {
		// 		cast_parts.push(addr_parts[i]);
		// 	}
		// }
		// return cast_parts.join('.');
	};

	_convIPv4ToNumList(address: string) {
		return address.split('.').map(a => parseInt(a));
		// const parts = address.split(/\./);
		// const list: any[] = [];
		// parts.forEach((n, i) => list.push(parseInt(n, 10)));
		// return list;
	};
}

export const LifxLanAddressx = new LifxLanAddress();
