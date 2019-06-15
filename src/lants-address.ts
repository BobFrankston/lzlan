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
// export class LifxLanAddress {
/* ------------------------------------------------------------------
* Method: getNetworkInterfaces()
* ---------------------------------------------------------------- */
export function getNetworkInterfaces() {
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
			(<any>info)['broadcast'] = _getBroadcastAddress(info);
			list.push(info);
		})
	}
	return list;
};

function _getBroadcastAddress(info: mOs.NetworkInterfaceInfoIPv4) {
	const addr_parts = _convIPv4ToNumList(info.address);
	const mask_parts = _convIPv4ToNumList(info.netmask);
	const cast_parts = addr_parts.map((a, i) => (~mask_parts[i] & 0xff) | a);
	return cast_parts.join('.');
};

function _convIPv4ToNumList(address: string) {
	return address.split('.').map(a => parseInt(a));
};


// export const LifxLanAddressx = new LifxLanAddress();
