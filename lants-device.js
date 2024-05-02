// ToDO Make deep copy of params
import { lifxMsgType } from "./lants-parser.js";
import { LifxLanUdp } from "./lants-udp.js";
import * as LifxLanColor from './lants-color.js';
import { LZVerbose, normalizeMac } from "./lants.js";
/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-device.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-08-08
* ---------------------------------------------------------------- */
// Standard objects
// Return a safe copy of the parametrs
export function passure(params, defaults) {
    params = params || {};
    return defaults ? { ...defaults, ...params } : params;
}
export var LifxServices;
(function (LifxServices) {
    LifxServices[LifxServices["UDP"] = 1] = "UDP";
    LifxServices[LifxServices["RESERVED1"] = 2] = "RESERVED1";
    LifxServices[LifxServices["RESERVED2"] = 3] = "RESERVED2";
    LifxServices[LifxServices["RESERVED3"] = 4] = "RESERVED3";
    LifxServices[LifxServices["RESERVED4"] = 5] = "RESERVED4";
})(LifxServices || (LifxServices = {}));
export var LifxDirection;
(function (LifxDirection) {
    LifxDirection[LifxDirection["RIGHT"] = 0] = "RIGHT";
    LifxDirection[LifxDirection["LEFT"] = 1] = "LEFT";
})(LifxDirection || (LifxDirection = {}));
export var LifxLightLastHevCycleResult;
(function (LifxLightLastHevCycleResult) {
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["SUCCESS"] = 0] = "SUCCESS";
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["BUSY"] = 1] = "BUSY";
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["INTERRUPTED_BY_RESET"] = 2] = "INTERRUPTED_BY_RESET";
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["INTERRUPTED_BY_HOMEKIT"] = 3] = "INTERRUPTED_BY_HOMEKIT";
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["INTERRUPTED_BY_LAN"] = 4] = "INTERRUPTED_BY_LAN";
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["INTERRUPTED_BY_CLOUD"] = 5] = "INTERRUPTED_BY_CLOUD";
    LifxLightLastHevCycleResult[LifxLightLastHevCycleResult["NONE"] = 255] = "NONE";
})(LifxLightLastHevCycleResult || (LifxLightLastHevCycleResult = {}));
export var LifxMultiZoneApplicationRequest;
(function (LifxMultiZoneApplicationRequest) {
    LifxMultiZoneApplicationRequest[LifxMultiZoneApplicationRequest["NO_APPLY"] = 0] = "NO_APPLY";
    LifxMultiZoneApplicationRequest[LifxMultiZoneApplicationRequest["APPLY"] = 1] = "APPLY";
    LifxMultiZoneApplicationRequest[LifxMultiZoneApplicationRequest["APPLY_ONLY"] = 2] = "APPLY_ONLY";
})(LifxMultiZoneApplicationRequest || (LifxMultiZoneApplicationRequest = {}));
export var LifxMultiZoneEffectType;
(function (LifxMultiZoneEffectType) {
    LifxMultiZoneEffectType[LifxMultiZoneEffectType["OFF"] = 0] = "OFF";
    LifxMultiZoneEffectType[LifxMultiZoneEffectType["MOVE"] = 1] = "MOVE";
    LifxMultiZoneEffectType[LifxMultiZoneEffectType["RESERVED1"] = 2] = "RESERVED1";
    LifxMultiZoneEffectType[LifxMultiZoneEffectType["RESERVED2"] = 3] = "RESERVED2";
})(LifxMultiZoneEffectType || (LifxMultiZoneEffectType = {}));
export var LifxMultiZoneExtendedApplicationRequest;
(function (LifxMultiZoneExtendedApplicationRequest) {
    LifxMultiZoneExtendedApplicationRequest[LifxMultiZoneExtendedApplicationRequest["NO_APPLY"] = 0] = "NO_APPLY";
    LifxMultiZoneExtendedApplicationRequest[LifxMultiZoneExtendedApplicationRequest["APPLY"] = 1] = "APPLY";
    LifxMultiZoneExtendedApplicationRequest[LifxMultiZoneExtendedApplicationRequest["APPLY_ONLY"] = 2] = "APPLY_ONLY";
})(LifxMultiZoneExtendedApplicationRequest || (LifxMultiZoneExtendedApplicationRequest = {}));
export var LifxTileEffectType;
(function (LifxTileEffectType) {
    LifxTileEffectType[LifxTileEffectType["OFF"] = 0] = "OFF";
    LifxTileEffectType[LifxTileEffectType["RESERVED1"] = 1] = "RESERVED1";
    LifxTileEffectType[LifxTileEffectType["MORPH"] = 2] = "MORPH";
    LifxTileEffectType[LifxTileEffectType["FLAME"] = 3] = "FLAME";
    LifxTileEffectType[LifxTileEffectType["RESERVED2"] = 4] = "RESERVED2";
})(LifxTileEffectType || (LifxTileEffectType = {}));
export var LifxWaveForm;
(function (LifxWaveForm) {
    LifxWaveForm[LifxWaveForm["SAW"] = 0] = "SAW";
    LifxWaveForm[LifxWaveForm["SINE"] = 1] = "SINE";
    LifxWaveForm[LifxWaveForm["HALF_SINE"] = 2] = "HALF_SINE";
    LifxWaveForm[LifxWaveForm["TRIANGLE"] = 3] = "TRIANGLE";
    LifxWaveForm[LifxWaveForm["PULSE"] = 4] = "PULSE";
})(LifxWaveForm || (LifxWaveForm = {}));
;
export var LifxApply;
(function (LifxApply) {
    LifxApply[LifxApply["NO_APPLY"] = 0] = "NO_APPLY";
    LifxApply[LifxApply["APPLY"] = 1] = "APPLY";
    LifxApply[LifxApply["APPLY_ONLY"] = 2] = "APPLY_ONLY";
})(LifxApply || (LifxApply = {}));
/* ------------------------------------------------------------------
* Constructor: LifxLanDevice(params)
* - params:
*   - mac | String     | Required | MAC address (e.g., "D0:73:D5:13:96:7E")
*   - ip  | String     | Required | IP address (e.g., "192.168.10.25")
* ---------------------------------------------------------------- */
export class LifxLanDevice {
    /**
     *
     * @param params {ip: string, mac: string} mac is upper case : separated
     */
    constructor(params) {
        this.mac = normalizeMac(params.mac);
        this.ip = params.ip;
    }
    ;
    mac;
    ip;
    deviceInfo;
    async _request(type, payload) {
        // const res = await this._lifxLanUdp.request({
        const UDP = await LifxLanUdp.GetUDP();
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
        if (params.duration !== undefined)
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
        if (res.power && params.duration !== undefined)
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
    static usenew = true;
    /**
     * Update device info for this device by calling querying the bulb
     * Normally done once on creating the device
     */
    // reportedError = false;  // Only report once for each device
    static reportedError = new Set(); // So we don't repeat ourselves
    async getDeviceInfo() {
        let info = {};
        try {
            if (LifxLanDevice.usenew) {
                const me = this;
                // console.log(`Get ${me.ip}`);
                async function thenfo(pf, assign) {
                    try {
                        const result = await pf.bind(me)();
                        // console.log(`Result ${me?.ip} ${JSON.stringify(result)}`)
                        assign(result);
                    }
                    catch (e) {
                        const nmac = normalizeMac(me.mac);
                        if (LZVerbose && !LifxLanDevice.reportedError.has(nmac)) {
                            console.error(`Lifx: ${e.message} Getting info for ${me.ip} ${me.mac}`);
                            LifxLanDevice.reportedError.add(nmac);
                        }
                    }
                }
                // await thenfo(this.deviceGetLabel, (r) => info.label = r.label);
                // debugger;
                await Promise.allSettled([
                    thenfo(me.deviceGetLabel, (r) => info.label = r.label),
                    thenfo(me.deviceGetVersion, (r) => info = { ...info, ...r }),
                    thenfo(me.deviceGetLocation, (r) => info.location = r),
                    thenfo(me.deviceGetGroup, (r) => info.group = r),
                    thenfo(() => this._getDeviceMultiZone(info), (r) => info.multizone = r),
                    thenfo(me.deviceGetHostFirmware, (r) => info.firmwareVersion = r.version),
                    thenfo(me.deviceGetWifiInfo, (r) => {
                        info.signal = r.signal;
                        info.rssi = Math.round(10 * Math.log10(info.signal) + 0.5);
                    })
                ]);
                // console.log(`Got ${me.ip} ${JSON.stringify(info)}`);
            }
            else {
                info.label = (await this.deviceGetLabel()).label;
                info = { ...info, ...await this.deviceGetVersion() };
                info.location = await this.deviceGetLocation();
                info.group = await this.deviceGetGroup();
                info.multizone = await this._getDeviceMultiZone(info); // need to figure this one out
                info.firmwareVersion = (await this.deviceGetHostFirmware()).version;
                info.signal = (await this.deviceGetWifiInfo()).signal;
                info.rssi = Math.round(10 * Math.log10(info.signal) + 0.5);
            }
            delete info.error;
        }
        catch (e) {
            if (LZVerbose)
                console.error(`Lifx: DeviceInfo(${this.ip.padEnd(15)} ${this.mac} ${info.label ? info.label : ""}) ${e}`);
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
    // Generated by https://quicktype.io
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
    deviceGetService() { return this._request(lifxMsgType.GetService); }
    ;
    deviceGetHostInfo() { return this._request(lifxMsgType.GetHostInfo); }
    ;
    deviceGetHostFirmware() { return this._request(lifxMsgType.GetHostFirmware); }
    ;
    deviceGetWifiInfo() { return this._request(lifxMsgType.GetWifiInfo); }
    ;
    deviceGetWifiFirmware() { return this._request(lifxMsgType.GetWifiFirmware); }
    ;
    deviceGetPower() { return this._request(lifxMsgType.GetPower); }
    ;
    deviceSetPower(params) { return this._request(lifxMsgType.SetPower, params); }
    ;
    deviceGetLabel() { return this._request(lifxMsgType.GetLabel); }
    ;
    deviceGetVersion() { return this._request(lifxMsgType.GetVersion); }
    async deviceSetLabel(params) {
        const data = await this._request(lifxMsgType.SetLabel, params);
        await this.getDeviceInfo(); // Sets device_info as a side-effect!
        return data;
    }
    ;
    async deviceGetInfo() { return await this._request(lifxMsgType.GetInfo); }
    ;
    deviceGetLocation() { return this._request(lifxMsgType.GetLocation); }
    ;
    async deviceSetLocation(params) {
        const data = this._request(lifxMsgType.SetLocation /*49*/, params);
        await this.getDeviceInfo();
        return data;
    }
    ;
    deviceGetGroup() { return this._request(lifxMsgType.GetGroup); }
    ;
    async deviceSetGroup(params) {
        const data = await this._request(lifxMsgType.SetGroup, params);
        await this.getDeviceInfo(); // Update
        return data;
    }
    ;
    deviceEchoRequest(params) { return this._request(lifxMsgType.EchoRequest, params); }
    ;
    // lightGet(): Promise<{ color: LifxLanColorHSB, power: 0 | 1, label: string }> { return this._request(lifxMsgType.LightGet); };
    // lightSetColor(params: { color: LifxLanColorHSB, duration?: Duration }) { return this._request(lifxMsgType.SetColor /*102*/, params); };
    lightGet() { return this._request(lifxMsgType.LightGet); }
    ;
    lightSetColor(params) { return this._request(lifxMsgType.SetColor /*102*/, params); }
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
        return this._request(lifxMsgType.SetWaveform /*103*/, params);
    }
    ;
    lightGetPower() { return this._request(lifxMsgType.GetPower /*116*/); }
    ;
    lightSetPower(params) { return this._request(lifxMsgType.SetPower /*117*/, params); }
    ;
    lightGetInfrared() { return this._request(lifxMsgType.GetInfrared /*120*/); }
    ;
    lightSetInfrared(params) { return this._request(lifxMsgType.SetInfrared /*122*/, params); }
    ;
    async multiZoneSetColorZones(params) {
        const res = await this.multiZoneGetColorZones({ start: params.start, end: params.start });
        params.color = LifxLanColor.mergeToHsb(params.color, res.color);
        return await this._request(lifxMsgType.SetColorZones, params);
    }
    ;
    multiZoneGetColorZones(params) {
        // This can return a stateZone -- one color or stateMultiZone with multiple colors. Stupid
        return this._request(lifxMsgType.GetColorZones /* 502*/, params);
    }
    ;
    tileGetDeviceChain() {
        return this._request(lifxMsgType.GetDeviceChain);
    }
}
// export const mLifxLanDevice = LifxLanDevice;
//# sourceMappingURL=lants-device.js.map