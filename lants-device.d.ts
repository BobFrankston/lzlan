import { LifxTile } from "./lants-parser.js";
import { LifxLanColorAny, LifxLanColorHSB } from "./lants-color.js";
export declare type Integer = number;
export declare type Integer255 = number;
export declare type Milliseconds = number;
export declare type Duration = number;
export declare type Float = number;
export declare type String32 = string;
export declare type Brightness0To1 = number;
export declare type HexString16 = string;
export declare function passure(params: object, defaults?: object): object;
export declare type ColorDuration = {
    color?: LifxLanColorAny;
    duration?: Duration;
};
export declare type HSBDuration = {
    color?: LifxLanColorHSB;
    duration?: Duration;
};
export declare enum LifxServices {
    UDP = 1,
    RESERVED1 = 2,
    RESERVED2 = 3,
    RESERVED3 = 4,
    RESERVED4 = 5
}
export declare enum LifxDirection {
    RIGHT = 0,
    LEFT = 1
}
export declare enum LifxLightLastHevCycleResult {
    SUCCESS = 0,
    BUSY = 1,
    INTERRUPTED_BY_RESET = 2,
    INTERRUPTED_BY_HOMEKIT = 3,
    INTERRUPTED_BY_LAN = 4,
    INTERRUPTED_BY_CLOUD = 5,
    NONE = 255
}
export declare enum LifxMultiZoneApplicationRequest {
    NO_APPLY = 0,
    APPLY = 1,
    APPLY_ONLY = 2
}
export declare enum LifxMultiZoneEffectType {
    OFF = 0,
    MOVE = 1,
    RESERVED1 = 2,
    RESERVED2 = 3
}
export declare enum LifxMultiZoneExtendedApplicationRequest {
    NO_APPLY = 0,
    APPLY = 1,
    APPLY_ONLY = 2
}
export declare enum LifxTileEffectType {
    OFF = 0,
    RESERVED1 = 1,
    MORPH = 2,
    FLAME = 3,
    RESERVED2 = 4
}
export declare enum LifxWaveForm {
    SAW = 0,
    SINE = 1,
    HALF_SINE = 2,
    TRIANGLE = 3,
    PULSE = 4
}
export interface lifxWaveForm {
    transient: 0 | 1;
    color: LifxLanColorHSB;
    period: number;
    cycles: number;
    skew_ratio?: number;
    waveform: LifxWaveForm;
}
export declare enum LifxApply {
    NO_APPLY = 0,
    APPLY = 1,
    APPLY_ONLY = 2
}
export interface LifxMultiZone {
    count: number;
    colors: LifxColor[];
}
export interface LifxDeviceInfo {
    label: string;
    vendorId: number;
    vendorName: string;
    productId: number;
    productName: string;
    hwVersion: number;
    signal: Float;
    rssi: number;
    firmwareVersion: number;
    WiFiVersion: number;
    features: LifxFeatureInfo;
    location: LifxLocationInfo;
    group: LifxGroupInfo;
    multizone: {
        count: number;
    };
    error: string;
}
/**
 * https://lan.developer.lifx.com/docs/information-messages
 */
export interface LifxLabel {
    label: string;
}
export interface LifxHostInfo {
    signal: Float;
    tx: Integer;
    rx: Integer;
}
export interface LifxHostFirmware {
    build: Date;
    version: number;
}
export interface LifxVersionInfo {
    vendorId: number;
    vendorName: string;
    productId: number;
    productName: string;
    hwVersion: number;
    features: {
        color: boolean;
        infrared: boolean;
        multizone: boolean;
    };
}
export interface LifxGroupInfo {
    guid: string;
    label: string;
    updated: Date;
}
export interface LifxFeatureInfo {
    [key: string]: boolean;
    color: boolean;
    infrared: boolean;
    multizone: boolean;
    chain: boolean;
}
export interface LifxLocationInfo {
    guid: string;
    label: string;
    updated: Date;
}
export interface LifxLightState {
    color: LifxColor;
    power: number;
    label: string;
    infrared: LifxInfrared;
    multizone: null;
}
export interface LifxColor {
    hue: number;
    saturation: number;
    brightness: number;
    kelvin: number;
}
export interface LifxInfrared {
    brightness: number;
}
export declare class LifxLanDevice {
    /**
     *
     * @param params {ip: string, mac: string} mac is upper case : separated
     */
    constructor(params: {
        mac: string;
        ip: string;
    });
    mac: string;
    ip: string;
    deviceInfo: LifxDeviceInfo;
    private _request;
    private _wait;
    /**
      * Set color and duration and set power to 1
      * @param {color?: LifxLanColor, duration?: Duration}
    */
    turnOn(params?: ColorDuration): Promise<void>;
    private _turnOnSetColor;
    /**
      * Set color and duration
      * @param {color?: LifxLanColor, duration?: Duration}
    */
    setColor(params?: ColorDuration): Promise<any>;
    /**
      * Turn off
      * @param {duration?: Duration}
    */
    turnOff(params?: {
        duration?: Duration;
    }): Promise<void>;
    static usenew: boolean;
    /**
     * Update device info for this device by calling querying the bulb
     * Normally done once on creating the device
     */
    reportedError: boolean;
    getDeviceInfo(): Promise<{
        label: string;
        vendorId: number;
        vendorName: string;
        productId: number;
        productName: string;
        hwVersion: number;
        signal: number;
        rssi: number;
        firmwareVersion: number;
        WiFiVersion: number;
        features: LifxFeatureInfo;
        location: LifxLocationInfo;
        group: LifxGroupInfo;
        multizone: {
            count: number;
        };
        error: string;
    }>;
    private _getDeviceMultiZone;
    getLightState(): Promise<LifxLightState>;
    private _getLightInfraredState;
    getLightMultiZoneState(info: LifxDeviceInfo): Promise<{
        count: number;
        colors: LifxLanColorHSB[];
    }>;
    deviceGetService(): Promise<{
        service: number;
    }>;
    deviceGetHostInfo(): Promise<LifxHostInfo>;
    deviceGetHostFirmware(): Promise<LifxHostFirmware>;
    deviceGetWifiInfo(): Promise<LifxHostInfo>;
    deviceGetWifiFirmware(): Promise<{
        build: Date;
        version: Integer;
    }>;
    deviceGetPower(): Promise<{
        level: Integer;
    }>;
    deviceSetPower(params: {
        level: 0 | 1;
    }): Promise<any>;
    deviceGetLabel(): Promise<LifxLabel>;
    deviceGetVersion(): Promise<LifxVersionInfo>;
    deviceSetLabel(params: {
        label: String32;
    }): Promise<any>;
    deviceGetInfo(): Promise<{
        time: Date;
        uptime: number;
        downtime: number;
    }>;
    deviceGetLocation(): Promise<LifxLocationInfo>;
    deviceSetLocation(params: {
        location?: HexString16;
        label: string;
        updated?: Date;
    }): Promise<any>;
    deviceGetGroup(): Promise<LifxGroupInfo>;
    deviceSetGroup(params: {
        group?: string;
        label: string;
        updated?: Date;
    }): Promise<any>;
    deviceEchoRequest(params: {
        text: string;
    }): Promise<string>;
    lightGet(): Promise<{
        color: LifxLanColorHSB;
        power: 0 | 1;
        label: string;
    }>;
    lightSetColor(params: {
        color: LifxLanColorHSB;
        duration?: Duration;
    }): Promise<any>;
    lightSetWaveform(params: {
        transient?: Integer;
        color: LifxLanColorHSB;
        period: Integer;
        cycles: Float;
        skew_ratio: Float;
        waveform: lifxWaveForm;
    }): Promise<any>;
    lightGetPower(): Promise<{
        level: Integer;
    }>;
    lightSetPower(params: {
        level: Integer;
        duration?: Duration;
    }): Promise<any>;
    lightGetInfrared(): Promise<{
        brightness: Brightness0To1;
    }>;
    lightSetInfrared(params: {
        brightness: Brightness0To1;
    }): Promise<any>;
    multiZoneSetColorZones(params: {
        start: Integer255;
        end: Integer255;
        color: LifxLanColorAny;
        duration?: Duration;
        apply?: LifxApply;
    }): Promise<any>;
    multiZoneGetColorZones(params: {
        start: Integer255;
        end: Integer255;
    }): Promise<{
        color?: LifxLanColorHSB;
        colors?: LifxLanColorHSB[];
        count: number;
        index: number;
    }>;
    tileGetDeviceChain(): Promise<{
        start_index: Integer255;
        tile_devices: LifxTile[];
        total_count: Integer255;
    }>;
}
export declare type LifxDevicesIP = {
    [ip: string]: LifxLanDevice;
};
//# sourceMappingURL=lants-device.d.ts.map