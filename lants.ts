import * as lantsDevice from "./lants-device.js";
import { LifxLanDevice, Integer, Duration, passure } from "./lants-device.js";
export { LifxLanDevice };

import * as LifxLanColor from './lants-color.js';
import { LifxLanColorAny, LifxLanColorCSS, LifxLanColorHSB, LifxLanColorRGB, LifxLanColorXyb } from "./lants-color.js";
export { LifxLanColor, LifxLanColorAny, LifxLanColorCSS, LifxLanColorHSB, LifxLanColorRGB, LifxLanColorXyb };

/* ------------------------------------------------------------------
 * node-lifx-lan - lifx-lan.js
 *
 * Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
 * Copyright (c) 2018-2019, Bob Frankston - major changes in original code
 * Released under the MIT license
 * Date: 2018-08-08
 * ---------------------------------------------------------------- */

import { LifxLanUdp, udpParsed } from './lants-udp.js';
// import { LifxLanColor } from "./lants-color";

// export LifxLanDevice;

// export const delayms = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
export const delayms = (msec?: number) => { return new Promise(resolve => setTimeout(resolve, msec || 50)); };

/**
 * Discover current devices.
 * Note that this is not reliable
 * @param [optional]  params {wait: Millseconds}
 * @returns {LifxLanDevice[]} Table of devices
 */

export async function discover(params?: { wait?: Integer }) {
	params = passure(params);
	// await this.init();
	const UDP = await LifxLanUdp.GetUDP();
	try {
		const found_list = await UDP.discover(params);
		let devices: { [ipmac: string]: LifxLanDevice } = {};
		// if (this._device_list) {
		// 	this._device_list.forEach((dev) => {
		// 		let k = dev['ip'] + ' ' + dev['mac'];
		// 		devices[k] = dev;
		// 	});
		// }
		let device_list: LifxLanDevice[] = []; // { [ipmac: string]: LifxLanDevice } = {};
		found_list.forEach((res: udpParsed) => {
			let ip = res.address;
			let mac_parts = res.header.target.split(':');
			let mac = mac_parts.slice(0, 6).join(':');
			let k = ip + ' ' + mac;
			if (devices[k]) {
				device_list.push(devices[k]);
			} else {
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
};

async function _discoverGetDeviceInfo(dev_list: LifxLanDevice[]) {
	try {
		await (Promise as any).allSettled(dev_list.map(dev => dev.getDeviceInfo()));
	}
	catch (e: any) {
		const full = dev_list.length;
		dev_list = dev_list.filter(dev => dev.deviceInfo);	// Keep only those that succeeded
		const count = dev_list.reduce((prev, cur) => prev += cur.deviceInfo ? 1 : 0, 0);
		console.error(`_discoverGetDeviceInfo Found ${count} of ${full} devices\n$   Error: ${e.message}`);
		throw e;
	}
	return [...dev_list];	// Why a copy?
};

// TODO consider caching the device info to avoid repeating GetDeviceInfo

/**
  * Create a new device object. This can be used in place of or in addition to discovery
  * @params {ip, MAC} params {ip IP Address, MAC Mac address}
  * @returns LifxLanDevice object
  */

export async function createDevice(params: { ip: string, mac: string }) {
	return new LifxLanDevice({ ip: params.ip, mac: params.mac });;
};

/**
 * Normalize MAC to AA:99 ...
 * @param mac Address to be normalize.
 * @returns Address in upper case with only hex characters separated by :
 */

export function normalizeMac(mac: string) {
	mac = mac.toUpperCase()?.replace(/[^A-Z\d]/g, "");
	return mac.match(/(..?)/g).join(":");     // COmpatability till we fix
	// return mac.toUpperCase().replace(/-/g, ":")
}