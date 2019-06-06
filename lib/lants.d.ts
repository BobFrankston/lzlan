import * as lantsDevice from "./lants-device";
import { LifxLanDevice, Integer } from "./lants-device";
export { LifxLanDevice };
export declare const delayms: (ms: number) => Promise<{}>;
export declare class LifxLan {
    private _is_scanning;
    private _initialized;
    private _device_list;
    init(): Promise<void>;
    private _wait;
    discover(params?: {
        wait?: Integer;
    }): Promise<lantsDevice.LifxLanDevice[]>;
    private _discoverGetDeviceInfo;
    /**
      * Create a new device object
      * @param ip IP Address
      * @param MAC Mac address
      */
    createDevice(params: {
        ip: string;
        mac: string;
    }): Promise<lantsDevice.LifxLanDevice>;
    destroy(): Promise<void>;
}
export declare const Lifx: LifxLan;
//# sourceMappingURL=lants.d.ts.map