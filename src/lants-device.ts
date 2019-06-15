// ToDO Make deep copy of params

import { lifxMsgType, LifxTile } from "./lants-parser";
import { LifxLanUdp, udpParsed } from "./lants-udp";
import { LifxLanColorAny, LifxLanColorHSB, LifxLanColorCSS } from "./lants-color";
import * as LifxLanColor from './lants-color';
import { isUndefined } from "util";

export type Integer = number;        // Should rename to named types at some point
export type Integer255 = number;     // Integer limited to 244
export type Milliseconds = number;
export type Duration = number;       // milliseconds integer
export type Float = number;          // Typically 0.0 to 1.0
export type String32 = string;       // Should be 32 characters or less
export type Brightness0To1 = number  // Value is 0.0 to 1.0
export type HexString16 = string;

/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-device.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-08-08
* ---------------------------------------------------------------- */

// Standard objects

// Return a safe copy of the parametrs
export function passure(params: object, defaults?: object) {
    params = params || {};
    return defaults ? { ...defaults, ...params } : params;
}

export type ColorDuration = {
    color?: LifxLanColorAny,
    duration?: Duration
};      // Duration in milliseconds

export type HSBDuration = {
    color?: LifxLanColorHSB,
    duration?: Duration
};      // Duration in milliseconds

export enum LifxWaveForm {
    SAW = 0,
    SINE = 1,
    HALF_SINE = 2,
    TRIANGLE = 3,
    PULSE = 4
}

export interface lifxWaveForm {
    transient: 0 | 1,           // 0 or 1. If the value is 0, the color will stay as the new color after the effect is performed. If the value is 1, the color will return to the original color after the effect.
    color: LifxLanColorHSB,
    period: number,             // Milliseconds
    cycles: number,
    skew_ratio?: number,        // 0.0 - 1.0. Required only when the waveform is 4 (PLUSE).
    waveform: LifxWaveForm
};

export enum LifxApply {
    NO_APPLY = 0,
    APPLY = 1,
    APPLY_ONLY = 2
}
export interface LifxMultiZone {
    count: number,                  // Number of zones.
    colors: {
        hue: number,                //   Hue in the range of 0.0 to 1.0.
        saturation: number,         //   Saturation in the range of 0.0 to 1.0.
        brightness: Brightness0To1, //   Brightness in the range of 0.0 to 1.0.
        kelvin: number              // Color temperature (°) in the range of 1500 to 9000.
    }[],                            // Normally 8
}

export interface LifxDeviceInfo {
    label: string,
    vendorId: number,
    vendorName: string,
    productId: number,
    productName: string,
    hwVersion: number,
    firmwareVersion: number;
    WiFiVersion: number;
    features: {
        [key: string]: boolean,
        color: boolean,
        infrared: boolean,
        multizone: boolean,
        chain: boolean
    },
    location: {
        guid: string,
        label: string,
        updated: Date
    },
    group: {
        guid: string,
        label: string,
        updated: Date,
    },
    multizone: { count: number } // LifxMultiZone
    error: string;                // Report
}

export interface LifxVersionInfo {
    vendorId: number,
    vendorName: string,
    productId: number,
    productName: string,
    hwVersion: number,
    features: { color: boolean, infrared: boolean, multizone: boolean }
}

interface LifxGuidLabel {
    guid?: string,          //  Optional    GUID of group
    label?: string,         //  Optional    Label of group
}

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
    constructor(params: { mac: string, ip: string }) {
        this.mac = params.mac;
        this.ip = params.ip;
    };

    mac: string;
    ip: string;
    deviceInfo: LifxDeviceInfo;

    private async _request(type: lifxMsgType, payload?: any): Promise<any> {
        // const res = await this._lifxLanUdp.request({
        const UDP = await LifxLanUdp.GetUDP();
        try {
            const res = <udpParsed>await UDP.request({
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
    };

    private _wait(msec?: Milliseconds) {
        return new Promise(resolve => setTimeout(resolve, msec || 50));
    };

    /**
      * Set color and duration and set power to 1
      * @param {color?: LifxLanColor, duration?: Duration}
    */

    async turnOn(params?: ColorDuration) {
        params = passure(params, { duration: 0 });
        await this._turnOnSetColor(params);
        await this._wait();
        const p: any = { level: 1 };
        if (!isUndefined(params.duration)) p.duration = params.duration;    // Remove? We forced it to zero
        await this.lightSetPower(p);
    };

    private async _turnOnSetColor(params?: ColorDuration) {
        if (params && params.color)
            await this.setColor(params);
    };

    /**
      * Set color and duration
      * @param {color?: LifxLanColor, duration?: Duration}
    */

    async setColor(params?: ColorDuration) {
        params = passure(params);
        if (!params.color) return;  // Nothing to do
        const res = await this.lightGet();    // For power
        const req: any = { color: LifxLanColor.mergeToHsb(params.color, res.color) };
        if (res.power && !isUndefined(params.duration)) req.duration = params.duration
        return this.lightSetColor(req);
    };

    /**
      * Turn off
      * @param {duration?: Duration}
    */

    async turnOff(params?: { duration?: Duration }) {
        params = passure(params, { level: 0, duration: 0 });
        const p: { level: 0, duration?: Duration } = { level: 0 }
        if ('duration' in params) p.duration = params.duration;
        await this.lightSetPower(p);
    }

   /**
    * Update device info for this device by calling querying the bulb
    * Normally done once on creating the device
    */
    async getDeviceInfo() {
        let info: LifxDeviceInfo = <any>{};
        try {
            info.label = (await this.deviceGetLabel()).label;
            info = <any>{ ...info, ...await this.deviceGetVersion() };
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
        return { ...info }; // Return a copy
    };

    private async _getDeviceMultiZone(info: LifxDeviceInfo) {
        if (info.features && info.features.multizone) {
            return { count: (await this.multiZoneGetColorZones({ start: 0, end: 0 })).count }
        }
    };
   
    async getLightState() {
        const info = await this.getDeviceInfo();
        let state: any = {};
        state = { ...state, ...await this.lightGet() };
        state.infrared = await this._getLightInfraredState(info);
        state.multizone = await this.getLightMultiZoneState(info);
        return state;
    };

    private async _getLightInfraredState(info: LifxDeviceInfo) {
        if (!info.features || !info.features.infrared) return null;
        return await this.lightGetInfrared();
    };

    async getLightMultiZoneState(info: LifxDeviceInfo) {
        if (!info.features || !info.features.multizone) return null;
        const colors: LifxLanColorHSB[] = []
        for (let zone = 0; zone < info.multizone.count; zone++)
            colors[zone] = (await this.multiZoneGetColorZones({ start: zone, end: zone })).color;
        return { count: info.multizone.count, colors: colors };
    };

    /* ==================================================================
    * Low level methods
    * ================================================================ */

    deviceGetService(): Promise<{ service: number }> { return this._request(lifxMsgType.GetService); };
    deviceGetHostInfo(): Promise<{ signal: Float; tx: Integer; rx: Integer }> { return this._request(lifxMsgType.GetHostInfo); };
    deviceGetHostFirmware(): Promise<{ build: Date, version: number }> { return this._request(lifxMsgType.GetHostFirmware); };
    deviceGetWifiInfo(): Promise<{ signal: Float; tx: Integer; rx: Integer }> { return this._request(lifxMsgType.GetWifiInfo) };
    deviceGetWifiFirmware(): Promise<{ build: Date; version: Integer }> { return this._request(lifxMsgType.GetWifiFirmware); };
    deviceGetPower(): Promise<{ level: Integer }> { return this._request(lifxMsgType.GetPower); };
    deviceSetPower(params: { level: 0 | 1 }) { return this._request(lifxMsgType.SetPower, params); };
    deviceGetLabel(): Promise<{ label: string }> { return this._request(lifxMsgType.GetLabel); };
    deviceGetVersion(): Promise<LifxVersionInfo> { return this._request(lifxMsgType.GetVersion); }
    async deviceSetLabel(params: { label: String32 }) {
        const data = await this._request(lifxMsgType.SetLabel, params);
        await this.getDeviceInfo(); // Sets device_info as a side-effect!
        return data;
    };
    async deviceGetInfo(): Promise<{ time: Date, uptime: number; downtime: number }> { return await this._request(lifxMsgType.GetInfo); };
    deviceGetLocation(): Promise<{ guid: string, label: string, updated: Date }> { return this._request(lifxMsgType.GetLocation) };
    async deviceSetLocation(params: { location?: HexString16, label: string, updated?: Date }) {
        const data = this._request(lifxMsgType.SetLocation /*49*/, params);
        await this.getDeviceInfo();
        return data;
    };
    deviceGetGroup(): Promise<{ guid: string, label: string, updated: Date }> { return this._request(lifxMsgType.GetGroup); };
    async deviceSetGroup(params: { group?: string, label: string, updated?: Date }) {
        const data = await this._request(lifxMsgType.SetGroup, params);
        await this.getDeviceInfo();   // Update
        return data;
    };
    deviceEchoRequest(params: { text: string }): Promise<string> { return this._request(lifxMsgType.EchoRequest, params); };
    lightGet(): Promise<{ color: LifxLanColorHSB, power: 0 | 1, label: string }> { return this._request(lifxMsgType.LightGet); };
    lightSetColor(params: { color: LifxLanColorHSB, duration?: Duration }) { return this._request(lifxMsgType.SetColor /*102*/, params); };

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
    lightSetWaveform(params: { transient?: Integer, color: LifxLanColorHSB, period: Integer, cycles: Float, skew_ratio: Float, waveform: lifxWaveForm }) {
        return this._request(lifxMsgType.SetWaveform /*103*/, params);
    };
    lightGetPower(): Promise<{ level: Integer }> { return this._request(lifxMsgType.GetPower /*116*/); };
    lightSetPower(params: { level: Integer; duration?: Duration }) { return this._request(lifxMsgType.SetPower /*117*/, params); };
    lightGetInfrared(): Promise<{ brightness: Brightness0To1 }> { return this._request(lifxMsgType.GetInfrared /*120*/); };
    lightSetInfrared(params: { brightness: Brightness0To1 }) { return this._request(lifxMsgType.SetInfrared /*122*/, params); };
    async multiZoneSetColorZones(params: { start: Integer255, end: Integer255, color: LifxLanColorAny, duration?: Duration, apply?: LifxApply }) {
        const res = await this.multiZoneGetColorZones({ start: params.start, end: params.start });
        params.color = LifxLanColor.mergeToHsb(params.color, res.color);
        return await this._request(lifxMsgType.SetColorZones, params);
    };
    multiZoneGetColorZones(params: { start: Integer255, end: Integer255 }):
        Promise<{ color?: LifxLanColorHSB, colors?: LifxLanColorHSB[], count: number, index: number }> {
        // This can return a stateZone -- one color or stateMultiZone with multiple colors. Stupid
        return this._request(lifxMsgType.GetColorZones /* 502*/, params);
    };
    tileGetDeviceChain(): Promise<{ start_index: Integer255, tile_devices: LifxTile[], total_count: Integer255 }> {
        return this._request(lifxMsgType.GetDeviceChain);
    }
}
export type LifxDevice = LifxLanDevice;
export type LifxDevicesIP = { [ip: string]: LifxDevice };

// export const mLifxLanDevice = LifxLanDevice;
