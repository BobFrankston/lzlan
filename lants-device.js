"use strict";
// ToDO Make deep copy of params
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
exports.LifxLanDevice = exports.LifxApply = exports.LifxWaveForm = exports.passure = void 0;
const lants_parser_1 = require("./lants-parser");
const lants_udp_1 = require("./lants-udp");
const LifxLanColor = __importStar(require("./lants-color"));
const util_1 = require("util");
const lants_1 = require("./lants");
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
    return defaults ? { ...defaults, ...params } : params;
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
    /**
     *
     * @param params {ip: string, mac: string} mac is upper case : separated
     */
    constructor(params) {
        this.mac = lants_1.normalizeMac(params.mac);
        this.ip = params.ip;
    }
    ;
    async _request(type, payload) {
        // const res = await this._lifxLanUdp.request({
        const UDP = await lants_udp_1.LifxLanUdp.GetUDP();
        try {
            const res = await UDP.request({
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
            UDP.destroy();
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
        const req = { color: LifxLanColor.mergeToHsb(params.color, res.color) };
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
    /**
     * Update device info for this device by calling querying the bulb
     * Normally done once on creating the device
     */
    async getDeviceInfo() {
        let info = {};
        try {
            info.label = (await this.deviceGetLabel()).label;
            info = { ...info, ...await this.deviceGetVersion() };
            info.location = await this.deviceGetLocation();
            info.group = await this.deviceGetGroup();
            info.multizone = await this._getDeviceMultiZone(info); // need to figure this one out
            info.firmwareVersion = (await this.deviceGetHostFirmware()).version;
            delete info.error;
        }
        catch (e) {
            console.error(`DeviceInfo(${this.ip.padEnd(15)} ${this.mac} ${info.label ? info.label : ""}) ${e}`);
            info.error = e.message;
        }
        this.deviceInfo = info;
        // info = JSON.parse(JSON.stringify(info));    // This was in the original code... why?
        return { ...info }; // Return a copy
    }
    ;
    async _getDeviceMultiZone(info) {
        if (info.features && info.features.multizone) {
            return { count: (await this.multiZoneGetColorZones({ start: 0, end: 0 })).count };
        }
    }
    ;
    async getLightState() {
        const info = await this.getDeviceInfo();
        let state = {};
        state = { ...state, ...await this.lightGet() };
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
        params.color = LifxLanColor.mergeToHsb(params.color, res.color);
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