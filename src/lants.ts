import * as lantsDevice from "./lants-device";
import { LifxLanDevice, Integer, Duration, passure } from "./lants-device";
import { lifxMsgType } from "./lants-parser";
import { mLifxLanColor, _LifxLanColor } from "./lants-color";

export { LifxLanDevice };

/* ------------------------------------------------------------------
 * node-lifx-lan - lifx-lan.js
 *
 * Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
 * Released under the MIT license
 * Date: 2018-08-08
 * ---------------------------------------------------------------- */

import { mLifxUdp, udpParsed } from './lants-udp';
// import { LifxLanColor } from "./lants-color";

// export LifxLanDevice;

export const delayms = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	/**
      * Global object
      * Use the Lifx value and do not create a clone
      */

export class LifxLan {
	constructor() {
		// Bug catcher
		if (LifxLan._LifxLanCount++ > 0) {
			debugger;
			// throw new Error(`Creating second LifxLan`);
		}
	}
	static _LifxLanCount = 0;	// Debugging
	private _is_scanning = false;
	private _initialized = false;
	private _device_list: LifxLanDevice[] = null;

	/* ------------------------------------------------------------------
	 * Method: init()
	 * ---------------------------------------------------------------- */
	async init() {
		if (this._initialized) return;
		await mLifxUdp.init();
		this._initialized = true;
	}

	// private async _request(type: lifxMsgType, payload?: {}) {
	// 	await this.init();
	// 	return await mLifxUdp.request({ type: type, payload: payload || null, broadcast: true });
	// };

	private _wait(msec?: number) { return new Promise(resolve => setTimeout(resolve, msec || 50)); };

	// Note this could should use only the MAC address as the stable identifer
	//      the IP address can change and should be updated when we "lose" a device

	async discover(params?: { wait?: Integer }) {
		params = passure(params);
		await this.init();
		const found_list = await mLifxUdp.discover(params);
		let devices: { [ipmac: string]: LifxLanDevice } = {};
		if (this._device_list) {
			this._device_list.forEach((dev) => {
				let k = dev['ip'] + ' ' + dev['mac'];
				devices[k] = dev;
			});
		}
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
					udp: mLifxUdp
				});
				device_list.push(lifxdev);
			}
		});
		this._device_list = await this._discoverGetDeviceInfo(device_list);
		// Quick hack
		mLifxUdp.device_list_hack = {};
		this._device_list.forEach(dev => mLifxUdp.device_list_hack[dev.ip] = dev);
		return [...this._device_list];
	};

	private async _discoverGetDeviceInfo(dev_list: LifxLanDevice[]) {
		try {
			await Promise.all(dev_list.map(dev => dev.getDeviceInfo()));
		}
		catch (e) {
			const full = dev_list.length;
			dev_list = dev_list.filter(dev => dev.deviceInfo);	// Keep only those that succeeded
			const count = dev_list.reduce((prev, cur) => prev += cur.deviceInfo ? 1 : 0, 0);
			console.error(`_discoverGetDeviceInfo Found ${count} of ${full} devices\n${e}`);
			throw e;
		}
		return [...dev_list];	// Why a copy?
	};

	/**
      * Create a new device object
      * @param ip IP Address
	  * @param MAC Mac address
      */

	async createDevice(params: { ip: string, mac: string }) {
		await this.init();
		const device = new LifxLanDevice({ ip: params.ip, mac: params.mac, udp: mLifxUdp });
		return device;
	};

	// Note - am considering remove all such broadcast requests becuase the message should just be send to explicit end points.

	// async turnOnBroadcast(params?: { color?: LifxLanColor, duration?: Duration }) {
	// 	params = passure(params);
	// 	if (params.color) await this.setColorBroadcast(params);
	// 	await this._wait();
	// 	const p: { level: 1, duration?: Duration } = { level: 1 };
	// 	if ('duration' in params) p.duration = params.duration;
	// 	await this._request(lifxMsgType.SetLightPower, p);
	// }

	// // async _turnOnBroadcastSetColor(params: { color?: LifxLanColor, duration?: Duration }) {
	// // 	if (params.color) this.setColorBroadcast(params);
	// // };

	// async setColorBroadcast(params?: { color?: LifxLanColor, duration?: Duration }) {
	// 	params = params || {};
	// 	params.color = mLifxLanColor.anyToHsb(params.color);
	// 	await this._request(lifxMsgType.SetColor, params);
	// }

	// async turnOffBroadcast(params: { duration?: Duration }) {
	// 	const p: { level: 0, duration?: Duration } = { level: 0 };
	// 	if ('duration' in params) p.duration = params.duration;
	// 	await this._request(lifxMsgType.SetLightPower, params);
	// }

	async destroy() {
		await mLifxUdp.destroy();
		this._is_scanning = false;
		this._initialized = false;
		this._device_list = null;
	};
}

export const Lifx = new LifxLan();

// const newLifxLan = new LifxLan();
// export default newLifxLan;