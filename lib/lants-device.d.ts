import { LifxTile } from "./lants-parser";
import { LifxLanColor, LifxLanColorHSB } from "./lants-color";
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
    color?: LifxLanColor;
    duration?: Duration;
};
export declare type HSBDuration = {
    color?: LifxLanColorHSB;
    duration?: Duration;
};
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
    colors: {
        hue: number;
        saturation: number;
        brightness: Brightness0To1;
        kelvin: number;
    }[];
}
export interface LifxDeviceInfo {
    label: string;
    vendorId: number;
    vendorName: string;
    productId: number;
    productName: string;
    hwVersion: number;
    firmwareVersion: number;
    WiFiVersion: number;
    features: {
        [key: string]: boolean;
        color: boolean;
        infrared: boolean;
        multizone: boolean;
        chain: boolean;
    };
    location: {
        guid: string;
        label: string;
        updated: Date;
    };
    group: {
        guid: string;
        label: string;
        updated: Date;
    };
    multizone: {
        count: number;
    };
    error: string;
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
export declare class LifxLanDevice {
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
    /**
     * Update device info for this device by calling querying the bulb
     * Normally done once on creating the device
     */
    getDeviceInfo(): Promise<{
        label: string;
        vendorId: number;
        vendorName: string;
        productId: number;
        productName: string;
        hwVersion: number;
        firmwareVersion: number;
        WiFiVersion: number;
        features: {
            [key: string]: boolean;
            color: boolean;
            infrared: boolean;
            multizone: boolean;
            chain: boolean;
        };
        location: {
            guid: string;
            label: string;
            updated: Date;
        };
        group: {
            guid: string;
            label: string;
            updated: Date;
        };
        multizone: {
            count: number;
        };
        error: string;
    }>;
    private _getDeviceMultiZone;
    getLightState(): Promise<any>;
    private _getLightInfraredState;
    getLightMultiZoneState(info: LifxDeviceInfo): Promise<{
        count: number;
        colors: LifxLanColorHSB[];
    }>;
    deviceGetService(): Promise<{
        service: number;
    }>;
    deviceGetHostInfo(): Promise<{
        signal: Float;
        tx: Integer;
        rx: Integer;
    }>;
    deviceGetHostFirmware(): Promise<{
        build: Date;
        version: number;
    }>;
    deviceGetWifiInfo(): Promise<{
        signal: Float;
        tx: Integer;
        rx: Integer;
    }>;
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
    deviceGetLabel(): Promise<{
        label: string;
    }>;
    deviceGetVersion(): Promise<LifxVersionInfo>;
    deviceSetLabel(params: {
        label: String32;
    }): Promise<any>;
    deviceGetInfo(): Promise<{
        time: Date;
        uptime: number;
        downtime: number;
    }>;
    deviceGetLocation(): Promise<{
        guid: string;
        label: string;
        updated: Date;
    }>;
    deviceSetLocation(params: {
        location?: HexString16;
        label: string;
        updated?: Date;
    }): Promise<any>;
    deviceGetGroup(): Promise<{
        guid: string;
        label: string;
        updated: Date;
    }>;
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
        color: LifxLanColor;
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
export declare type LifxDevice = LifxLanDevice;
export declare type LifxDevicesIP = {
    [ip: string]: LifxDevice;
};
//# sourceMappingURL=lants-device.d.ts.map