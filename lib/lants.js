"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lants_device_1 = require("./lants-device");
exports.LifxLanDevice = lants_device_1.LifxLanDevice;
/* ------------------------------------------------------------------
 * node-lifx-lan - lifx-lan.js
 *
 * Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
 * Released under the MIT license
 * Date: 2018-08-08
 * ---------------------------------------------------------------- */
const lants_udp_1 = require("./lants-udp");
// import { LifxLanColor } from "./lants-color";
// export LifxLanDevice;
// export const delayms = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
exports.delayms = (msec) => { return new Promise(resolve => setTimeout(resolve, msec || 50)); };
/**
 * Discover current devices.
 * Note that this is not reliable
 * @param [optional]  params {wait: Millseconds}
 * @returns {LifxLanDevice[]} Table of devices
 */
async function discover(params) {
    params = lants_device_1.passure(params);
    // await this.init();
    const UDP = await lants_udp_1.LifxLanUdp.GetUDP();
    try {
        const found_list = await UDP.discover(params);
        let devices = {};
        // if (this._device_list) {
        // 	this._device_list.forEach((dev) => {
        // 		let k = dev['ip'] + ' ' + dev['mac'];
        // 		devices[k] = dev;
        // 	});
        // }
        let device_list = []; // { [ipmac: string]: LifxLanDevice } = {};
        found_list.forEach((res) => {
            let ip = res.address;
            let mac_parts = res.header.target.split(':');
            let mac = mac_parts.slice(0, 6).join(':');
            let k = ip + ' ' + mac;
            if (devices[k]) {
                device_list.push(devices[k]);
            }
            else {
                let lifxdev = new lants_device_1.LifxLanDevice({
                    mac: mac,
                    ip: ip,
                });
                device_list.push(lifxdev);
            }
        });
        const _device_list = await _discoverGetDeviceInfo(device_list);
        // Quick hack
        // UDP.device_list_hack = {};
        // this._device_list.forEach(dev => UDP.device_list_hack[dev.ip] = dev);
        return [..._device_list];
    }
    finally {
        UDP.destroy();
    }
}
exports.discover = discover;
;
async function _discoverGetDeviceInfo(dev_list) {
    try {
        await Promise.all(dev_list.map(dev => dev.getDeviceInfo()));
    }
    catch (e) {
        const full = dev_list.length;
        dev_list = dev_list.filter(dev => dev.deviceInfo); // Keep only those that succeeded
        const count = dev_list.reduce((prev, cur) => prev += cur.deviceInfo ? 1 : 0, 0);
        console.error(`_discoverGetDeviceInfo Found ${count} of ${full} devices\n${e}`);
        throw e;
    }
    return [...dev_list]; // Why a copy?
}
;
// TODO consider caching the device info to avoid repeating GetDeviceInfo
/**
  * Create a new device object. This can be used in place of or in addition to discovery
  * @param {ip, MAC} params {ip IP Address, MAC Mac address}
  */
async function createDevice(params) {
    return new lants_device_1.LifxLanDevice({ ip: params.ip, mac: params.mac });
    ;
}
exports.createDevice = createDevice;
;
//# sourceMappingURL=lants.js.map