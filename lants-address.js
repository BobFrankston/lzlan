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
/* ------------------------------------------------------------------
* Constructor: LifxLanAddress()
* ---------------------------------------------------------------- */
// export class LifxLanAddress {
/* ------------------------------------------------------------------
* Method: getNetworkInterfaces()
* ---------------------------------------------------------------- */
export function getNetworkInterfaces() {
    const list = []; // Need to fix this signature
    // const list: NetworkInterfaceInfoWithBroadcast[] = [];	// Need to fix this signature
    const netifs = mOs.networkInterfaces();
    for (const dev in netifs) {
        netifs[dev]?.forEach((info) => {
            let family = info.family;
            if (typeof family == "number")
                family = `IPv${family}`; // Strange change work-around
            if (family !== 'IPv4' || info.internal === true) {
                return;
            }
            let info4 = info;
            // if (/^169\.254\./.test(info.address)) {
            // 	// return;	// Why??
            // 	console.log(`Debug ${info.address}`);
            // }
            info['broadcast'] = _getBroadcastAddress(info4);
            list.push(info);
        });
    }
    return list;
}
;
function _getBroadcastAddress(info) {
    const addr_parts = _convIPv4ToNumList(info.address);
    const mask_parts = _convIPv4ToNumList(info.netmask);
    const cast_parts = addr_parts.map((a, i) => (~mask_parts[i] & 0xff) | a);
    return cast_parts.join('.');
}
;
function _convIPv4ToNumList(address) {
    return address.split('.').map(a => parseInt(a));
}
;
//# sourceMappingURL=lants-address.js.map