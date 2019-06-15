"use strict";
// ToDO Make deep copy of params
Object.defineProperty(exports, "__esModule", { value: true });
const lants_parser_1 = require("./lants-parser");
const lants_udp_1 = require("./lants-udp");
const lants_color_1 = require("./lants-color");
const util_1 = require("util");
/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-device.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-08-08
* ---------------------------------------------------------------- */
// Standard objects
// Return a safe copy of the parametrs
function passure(params, defaults) {
    params = params || {};
    return defaults ? Object.assign({}, defaults, params) : params;
    // If we need a deep copy then use the following
    // if (defaults) params = { ...defaults, ...params };
    // function cloneObject(obj: any) {
    //     let clone: any = {};
    //     for (var i in obj) {
    //         if (obj[i] != null && typeof (obj[i]) == "object")
    //             clone[i] = cloneObject(obj[i]);
    //         else
    //             clone[i] = obj[i];
    //     }
    //     return clone;
    // }
    // return params ? cloneObject(params) : {};
}
exports.passure = passure;
var LifxWaveForm;
(function (LifxWaveForm) {
    LifxWaveForm[LifxWaveForm["SAW"] = 0] = "SAW";
    LifxWaveForm[LifxWaveForm["SINE"] = 1] = "SINE";
    LifxWaveForm[LifxWaveForm["HALF_SINE"] = 2] = "HALF_SINE";
    LifxWaveForm[LifxWaveForm["TRIANGLE"] = 3] = "TRIANGLE";
    LifxWaveForm[LifxWaveForm["PULSE"] = 4] = "PULSE";
})(LifxWaveForm = exports.LifxWaveForm || (exports.LifxWaveForm = {}));
;
var LifxApply;
(function (LifxApply) {
    LifxApply[LifxApply["NO_APPLY"] = 0] = "NO_APPLY";
    LifxApply[LifxApply["APPLY"] = 1] = "APPLY";
    LifxApply[LifxApply["APPLY_ONLY"] = 2] = "APPLY_ONLY";
})(LifxApply = exports.LifxApply || (exports.LifxApply = {}));
/* ------------------------------------------------------------------
* Constructor: LifxLanDevice(params)
* - params:
*   - mac | String     | Required | MAC address (e.g., "D0:73:D5:13:96:7E")
*   - ip  | String     | Required | IP address (e.g., "192.168.10.25")
* ---------------------------------------------------------------- */
class LifxLanDevice {
    // constructor(params: { mac: string, ip: string, udp: LifxLanUdp }) {
    constructor(params) {
        this.mac = params.mac;
        this.ip = params.ip;
        // Private
        // this._lifxLanUdp = params.udp;
    }
    ;
    // private _lifxLanUdp: any;   // For now
    async _request(type, payload) {
        // const res = await this._lifxLanUdp.request({
        const _lifxLanUdp = await lants_udp_1.LifxLanUdp.GetUDP();
        try {
            const res = await _lifxLanUdp.request({
                address: this.ip,
                type: type,
                payload: payload || null,
                ack_required: false,
                res_required: true,
                target: this.mac
            });
            return res.payload || null; // Vs. undefined?
        }
        finally {
            _lifxLanUdp.destroy();
        }
    }
    ;
    _wait(msec) {
        return new Promise(resolve => setTimeout(resolve, msec || 50));
    }
    ;
    /**
      * Set color and duration and set power to 1
      * @param {color?: LifxLanColor, duration?: Duration}
    */
    async turnOn(params) {
        params = passure(params, { duration: 0 });
        await this._turnOnSetColor(params);
        await this._wait();
        const p = { level: 1 };
        if (!util_1.isUndefined(params.duration))
            p.duration = params.duration; // Remove? We forced it to zero
        await this.lightSetPower(p);
    }
    ;
    async _turnOnSetColor(params) {
        if (params && params.color)
            await this.setColor(params);
    }
    ;
    /**
      * Set color and duration
      * @param {color?: LifxLanColor, duration?: Duration}
    */
    async setColor(params) {
        params = passure(params);
        if (!params.color)
            return; // Nothing to do
        const res = await this.lightGet(); // For power
        const req = { color: lants_color_1.mLifxLanColor.mergeToHsb(params.color, res.color) };
        if (res.power && !util_1.isUndefined(params.duration))
            req.duration = params.duration;
        return this.lightSetColor(req);
    }
    ;
    /**
      * Turn off
      * @param {duration?: Duration}
    */
    async turnOff(params) {
        params = passure(params, { level: 0, duration: 0 });
        const p = { level: 0 };
        if ('duration' in params)
            p.duration = params.duration;
        await this.lightSetPower(p);
    }
    /* ------------------------------------------------------------------
    * Method: getDeviceInfo()
    * ---------------------------------------------------------------- */
    async getDeviceInfo() {
        let info = {};
        try {
            info.label = (await this.deviceGetLabel()).label;
            info = Object.assign({}, info, await this.deviceGetVersion());
            info.location = await this.deviceGetLocation();
            info.group = await this.deviceGetGroup();
            info.multizone = await this._getDeviceMultiZone(info); // need to figure this one out
            info.firmwareVersion = (await this.deviceGetHostFirmware()).version;
            delete info.error;
        }
        catch (e) {
            console.error(`DeviceInfo(${info.label}) ${e}`);
            info.error = e.message;
        }
        this.deviceInfo = info;
        // info = JSON.parse(JSON.stringify(info));    // This was in the original code... why?
        return Object.assign({}, info); // Return a copy
    }
    ;
    async _getDeviceMultiZone(info) {
        if (info.features && info.features.multizone) {
            return { count: (await this.multiZoneGetColorZones({ start: 0, end: 0 })).count };
        }
    }
    ;
    /* ------------------------------------------------------------------
    * Method: getLightState()
    * ---------------------------------------------------------------- */
    async getLightState() {
        const info = await this.getDeviceInfo();
        let state = {};
        state = Object.assign({}, state, await this.lightGet());
        state.infrared = await this._getLightInfraredState(info);
        state.multizone = await this.getLightMultiZoneState(info);
        return state;
    }
    ;
    async _getLightInfraredState(info) {
        if (!info.features || !info.features.infrared)
            return null;
        return await this.lightGetInfrared();
    }
    ;
    async getLightMultiZoneState(info) {
        if (!info.features || !info.features.multizone)
            return null;
        const colors = [];
        for (let zone = 0; zone < info.multizone.count; zone++)
            colors[zone] = (await this.multiZoneGetColorZones({ start: zone, end: zone })).color;
        return { count: info.multizone.count, colors: colors };
    }
    ;
    /* ==================================================================
    * Low level methods
    * ================================================================ */
    deviceGetService() { return this._request(lants_parser_1.lifxMsgType.GetService); }
    ;
    deviceGetHostInfo() { return this._request(lants_parser_1.lifxMsgType.GetHostInfo); }
    ;
    deviceGetHostFirmware() { return this._request(lants_parser_1.lifxMsgType.GetHostFirmware); }
    ;
    deviceGetWifiInfo() { return this._request(lants_parser_1.lifxMsgType.GetWifiInfo); }
    ;
    deviceGetWifiFirmware() { return this._request(lants_parser_1.lifxMsgType.GetWifiFirmware); }
    ;
    deviceGetPower() { return this._request(lants_parser_1.lifxMsgType.GetPower); }
    ;
    deviceSetPower(params) { return this._request(lants_parser_1.lifxMsgType.SetPower, params); }
    ;
    deviceGetLabel() { return this._request(lants_parser_1.lifxMsgType.GetLabel); }
    ;
    deviceGetVersion() { return this._request(lants_parser_1.lifxMsgType.GetVersion); }
    async deviceSetLabel(params) {
        const data = await this._request(lants_parser_1.lifxMsgType.SetLabel, params);
        await this.getDeviceInfo(); // Sets device_info as a side-effect!
        return data;
    }
    ;
    async deviceGetInfo() { return await this._request(lants_parser_1.lifxMsgType.GetInfo); }
    ;
    deviceGetLocation() { return this._request(lants_parser_1.lifxMsgType.GetLocation); }
    ;
    async deviceSetLocation(params) {
        const data = this._request(lants_parser_1.lifxMsgType.SetLocation /*49*/, params);
        await this.getDeviceInfo();
        return data;
    }
    ;
    deviceGetGroup() { return this._request(lants_parser_1.lifxMsgType.GetGroup); }
    ;
    async deviceSetGroup(params) {
        const data = await this._request(lants_parser_1.lifxMsgType.SetGroup, params);
        await this.getDeviceInfo(); // Update
        return data;
    }
    ;
    deviceEchoRequest(params) { return this._request(lants_parser_1.lifxMsgType.EchoRequest, params); }
    ;
    lightGet() { return this._request(lants_parser_1.lifxMsgType.LightGet); }
    ;
    lightSetColor(params) { return this._request(lants_parser_1.lifxMsgType.SetColor /*102*/, params); }
    ;
    /* ------------------------------------------------------------------
    * Method: lightSetWaveform(params)
    * - params:
    *   - transient    | Integer | Required    | 0 or 1.
    *   - color        | Object  | Required    |
    *     - hue        | Float   | Required    | 0.0 - 1.0
    *     - saturation | Float   | Required    | 0.0 - 1.0
    *     - brightness | Float   | Required    | 0.0 - 1.0
    *     - kelvin     | Integer | Required    | 1500 - 9000
    *   - period       | Integer | Required    | milliseconds
    *   - cycles       | Float   | Required    | Number of cycles
    *   - skew_ratio   | Float   | Conditional | 0.0 - 1.0.
    *                                            Required only when the `waveform` is 4 (PLUSE).
    *   - waveform     | Integer | Required    | 0: SAW  1: SINE 2: HALF_SINE 3: TRIANGLE 4: PLUSE
    * ---------------------------------------------------------------- */
    lightSetWaveform(params) {
        return this._request(lants_parser_1.lifxMsgType.SetWaveform /*103*/, params);
    }
    ;
    lightGetPower() { return this._request(lants_parser_1.lifxMsgType.GetPower /*116*/); }
    ;
    lightSetPower(params) { return this._request(lants_parser_1.lifxMsgType.SetPower /*117*/, params); }
    ;
    lightGetInfrared() { return this._request(lants_parser_1.lifxMsgType.GetInfrared /*120*/); }
    ;
    lightSetInfrared(params) { return this._request(lants_parser_1.lifxMsgType.SetInfrared /*122*/, params); }
    ;
    async multiZoneSetColorZones(params) {
        const res = await this.multiZoneGetColorZones({ start: params.start, end: params.start });
        params.color = lants_color_1.mLifxLanColor.mergeToHsb(params.color, res.color);
        return await this._request(lants_parser_1.lifxMsgType.SetColorZones, params);
    }
    ;
    multiZoneGetColorZones(params) {
        // This can return a stateZone -- one color or stateMultiZone with multiple colors. Stupid
        return this._request(lants_parser_1.lifxMsgType.GetColorZones /* 502*/, params);
    }
    ;
    tileGetDeviceChain() {
        return this._request(lants_parser_1.lifxMsgType.GetDeviceChain);
    }
}
exports.LifxLanDevice = LifxLanDevice;
// export const mLifxLanDevice = LifxLanDevice;
//# sourceMappingURL=lants-device.js.map