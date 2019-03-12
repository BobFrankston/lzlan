"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lants_device_1 = require("./lants-device");
exports.LifxLanDevice = lants_device_1.LifxLanDevice;
const lants_parser_1 = require("./lants-parser");
const lants_color_1 = require("./lants-color");
/* ------------------------------------------------------------------
 * node-lifx-lan - lifx-lan.js
 *
 * Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
 * Released under the MIT license
 * Date: 2018-08-08
 * ---------------------------------------------------------------- */
const lants_udp_1 = require("./lants-udp");
// export LifxLanDevice;
exports.delayms = (ms) => new Promise(resolve => setTimeout(resolve, ms));
/* ------------------------------------------------------------------
 * Constructor: LifxLan()
 * ---------------------------------------------------------------- */
class LifxLan {
    constructor() {
        this._is_scanning = false;
        this._initialized = false;
        this._device_list = null;
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
    async _request(type, payload) {
        await this.init();
        return await lants_udp_1.mLifxUdp.request({ type: type, payload: payload || null, broadcast: true });
    }
    ;
    _wait(msec) { return new Promise(resolve => setTimeout(resolve, msec || 50)); }
    ;
    // Note this could should use only the MAC address as the stable identifer
    //      the IP address can change and should be updated when we "lose" a device
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
    async createDevice(params) {
        await this.init();
        const device = new lants_device_1.LifxLanDevice({ ip: params.ip, mac: params.mac, udp: lants_udp_1.mLifxUdp });
        return device;
    }
    ;
    async turnOnBroadcast(params) {
        params = lants_device_1.passure(params);
        if (params.color)
            await this.setColorBroadcast(params);
        await this._wait();
        const p = { level: 1 };
        if ('duration' in params)
            p.duration = params.duration;
        await this._request(lants_parser_1.lifxMsgType.SetLightPower, p);
    }
    // async _turnOnBroadcastSetColor(params: { color?: LifxLanColor, duration?: Duration }) {
    // 	if (params.color) this.setColorBroadcast(params);
    // };
    async setColorBroadcast(params) {
        params = params || {};
        params.color = lants_color_1.mLifxLanColor.anyToHsb(params.color);
        await this._request(lants_parser_1.lifxMsgType.SetColor, params);
    }
    async turnOffBroadcast(params) {
        const p = { level: 0 };
        if ('duration' in params)
            p.duration = params.duration;
        await this._request(lants_parser_1.lifxMsgType.SetLightPower, params);
    }
    async destroy() {
        await lants_udp_1.mLifxUdp.destroy();
        this._is_scanning = false;
        this._initialized = false;
        this._device_list = null;
    }
    ;
}
exports.LifxLan = LifxLan;
exports.Lifx = new LifxLan();
// const newLifxLan = new LifxLan();
// export default newLifxLan;
//# sourceMappingURL=lants.js.map