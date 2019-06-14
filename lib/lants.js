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
exports.delayms = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/**
  * Global object
  * Use the Lifx value and do not create a clone
  */
class LifxLan {
    constructor() {
        this._is_scanning = false;
        this._initialized = false;
        this._device_list = null;
        // Bug catcher
        if (LifxLan._LifxLanCount++ > 0) {
            debugger;
            // throw new Error(`Creating second LifxLan`);
        }
    }
    /* ------------------------------------------------------------------
     * Method: init()
     * ---------------------------------------------------------------- */
    async init() {
        if (this._initialized)
            return;
        await lants_udp_1.mLifxUdp.init();
        this._initialized = true;
    }
    /**
     * Add event handler for messages. Null is allowed.
     * If there is no handler (null or otherwise) then display a message on the console
     * @param updh Add event handler for messages (udpRinfo, udpParsed))
     */
    AddUDPHandler(updh) {
        lants_udp_1.mLifxUdp.UDPHandlers.push(updh); // For now
    }
    // private async _request(type: lifxMsgType, payload?: {}) {
    // 	await this.init();
    // 	return await mLifxUdp.request({ type: type, payload: payload || null, broadcast: true });
    // };
    _wait(msec) { return new Promise(resolve => setTimeout(resolve, msec || 50)); }
    ;
    // Note this could should use only the MAC address as the stable identifer
    //      the IP address can change and should be updated when we "lose" a device
    /**
     * Discover current devices.
     * Note that this is not reliable
     * @param [optional]  params {wait: Millseconds}
     * @returns {LifxLanDevice[]} Table of devices
     */
    async discover(params) {
        params = lants_device_1.passure(params);
        await this.init();
        const found_list = await lants_udp_1.mLifxUdp.discover(params);
        let devices = {};
        if (this._device_list) {
            this._device_list.forEach((dev) => {
                let k = dev['ip'] + ' ' + dev['mac'];
                devices[k] = dev;
            });
        }
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
                    udp: lants_udp_1.mLifxUdp
                });
                device_list.push(lifxdev);
            }
        });
        this._device_list = await this._discoverGetDeviceInfo(device_list);
        // Quick hack
        lants_udp_1.mLifxUdp.device_list_hack = {};
        this._device_list.forEach(dev => lants_udp_1.mLifxUdp.device_list_hack[dev.ip] = dev);
        return [...this._device_list];
    }
    ;
    async _discoverGetDeviceInfo(dev_list) {
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
    /**
      * Create a new device object
      * @param params {ip IP Address, MAC Mac address}
      */
    async createDevice(params) {
        await this.init();
        const device = new lants_device_1.LifxLanDevice({ ip: params.ip, mac: params.mac, udp: lants_udp_1.mLifxUdp });
        return device;
    }
    ;
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
        await lants_udp_1.mLifxUdp.destroy();
        this._is_scanning = false;
        this._initialized = false;
        this._device_list = null;
    }
    ;
}
LifxLan._LifxLanCount = 0; // Debugging
exports.LifxLan = LifxLan;
/**
 * Singleton Lifx object
 */
exports.Lifx = new LifxLan();
// const newLifxLan = new LifxLan();
// export default newLifxLan;
//# sourceMappingURL=lants.js.map