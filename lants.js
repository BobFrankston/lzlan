import { LifxLanDevice, passure } from "./lants-device.js";
export { LifxLanDevice };
import * as LifxLanColor from './lants-color.js';
export { LifxLanColor };
/* ------------------------------------------------------------------
 * node-lifx-lan - lifx-lan.js
 *
 * Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
 * Copyright (c) 2018-2019, Bob Frankston - major changes in original code
 * Released under the MIT license
 * Date: 2018-08-08
 * ---------------------------------------------------------------- */
import { LifxLanUdp } from './lants-udp.js';
// import { LifxLanColor } from "./lants-color";
// export LifxLanDevice;
// export const delayms = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const delayms = (msec) => { return new Promise(resolve => setTimeout(resolve, msec || 50)); };
/**
 * Discover current devices.
 * Note that this is not reliable
 * @param [optional]  params {wait: Millseconds}
 * @returns {LifxLanDevice[]} Table of devices
 */
export async function discover(params) {
    params = passure(params);
    // await this.init();
    const UDP = await LifxLanUdp.GetUDP();
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
                let lifxdev = new LifxLanDevice({
                    mac: mac,
                    ip: ip,
                    // udp: mLifxUdp
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
;
async function _discoverGetDeviceInfo(dev_list) {
    try {
        await Promise.allSettled(dev_list.map(dev => dev.getDeviceInfo()));
    }
    catch (e) {
        const full = dev_list.length;
        dev_list = dev_list.filter(dev => dev.deviceInfo); // Keep only those that succeeded
        const count = dev_list.reduce((prev, cur) => prev += cur.deviceInfo ? 1 : 0, 0);
        console.error(`_discoverGetDeviceInfo Found ${count} of ${full} devices\n$   Error: ${e.message}`);
        throw e;
    }
    return [...dev_list]; // Why a copy?
}
;
// TODO consider caching the device info to avoid repeating GetDeviceInfo
/**
  * Create a new device object. This can be used in place of or in addition to discovery
  * @param {ip, MAC} params {ip IP Address, MAC Mac address}
  * @returns LifxLanDevice object
  */
export async function createDevice(params) {
    return new LifxLanDevice({ ip: params.ip, mac: params.mac });
    ;
}
;
export function normalizeMac(mac) { return mac.toUpperCase().replace(/-/g, ":"); }
//# sourceMappingURL=lants.js.map