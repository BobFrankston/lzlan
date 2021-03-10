// Fixed bug -- handle non-octet mask
/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-address.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
'use strict';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNetworkInterfaces = void 0;
// const mOs = require('os');
const mOs = __importStar(require("os"));
/* ------------------------------------------------------------------
* Constructor: LifxLanAddress()
* ---------------------------------------------------------------- */
// export class LifxLanAddress {
/* ------------------------------------------------------------------
* Method: getNetworkInterfaces()
* ---------------------------------------------------------------- */
function getNetworkInterfaces() {
    const list = []; // Need to fix this signature
    // const list: NetworkInterfaceInfoWithBroadcast[] = [];	// Need to fix this signature
    const netifs = mOs.networkInterfaces();
    for (const dev in netifs) {
        netifs[dev].forEach((info) => {
            if (info.family !== 'IPv4' || info.internal === true) {
                return;
            }
            // if (/^169\.254\./.test(info.address)) {
            // 	// return;	// Why??
            // 	console.log(`Debug ${info.address}`);
            // }
            info['broadcast'] = _getBroadcastAddress(info);
            list.push(info);
        });
    }
    return list;
}
exports.getNetworkInterfaces = getNetworkInterfaces;
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