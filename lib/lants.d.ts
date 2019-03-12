import * as lantsDevice from "./lants-device";
import { LifxLanDevice, Integer, Duration } from "./lants-device";
export { LifxLanDevice };
import { LifxLanColor } from "./lants-color";
export declare const delayms: (ms: number) => Promise<{}>;
export declare class LifxLan {
    private _is_scanning;
    private _initialized;
    private _device_list;
    init(): Promise<void>;
    private _request;
    private _wait;
    discover(params?: {
        wait?: Integer;
    }): Promise<lantsDevice.LifxLanDevice[]>;
    private _discoverGetDeviceInfo;
    createDevice(params: {
        ip: string;
        mac: string;
    }): Promise<lantsDevice.LifxLanDevice>;
    turnOnBroadcast(params?: {
        color?: LifxLanColor;
        duration?: Duration;
    }): Promise<void>;
    setColorBroadcast(params?: {
        color?: LifxLanColor;
        duration?: Duration;
    }): Promise<void>;
    turnOffBroadcast(params: {
        duration?: Duration;
    }): Promise<void>;
    destroy(): Promise<void>;
}
export declare const Lifx: LifxLan;
//# sourceMappingURL=lants.d.ts.map