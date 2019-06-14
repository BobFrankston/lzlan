import * as lantsDevice from "./lants-device";
import { LifxLanDevice, Integer } from "./lants-device";
import { UDPHandler } from './lants-udp';
export { LifxLanDevice };
export { UDPHandler };
export declare const delayms: (ms: number) => Promise<{}>;
/**
  * Global object
  * Use the Lifx value and do not create a clone
  */
export declare class LifxLan {
    constructor();
    static _LifxLanCount: number;
    private _is_scanning;
    private _initialized;
    private _device_list;
    init(): Promise<void>;
    /**
     * Add event handler for messages. Null is allowed.
     * If there is no handler (null or otherwise) then display a message on the console
     * @param updh Add event handler for messages (udpRinfo, udpParsed))
     */
    AddUDPHandler(updh: UDPHandler): void;
    private _wait;
    /**
     * Discover current devices.
     * Note that this is not reliable
     * @param [optional]  params {wait: Millseconds}
     * @returns {LifxLanDevice[]} Table of devices
     */
    discover(params?: {
        wait?: Integer;
    }): Promise<lantsDevice.LifxLanDevice[]>;
    private _discoverGetDeviceInfo;
    /**
      * Create a new device object
      * @param params {ip IP Address, MAC Mac address}
      */
    createDevice(params: {
        ip: string;
        mac: string;
    }): Promise<lantsDevice.LifxLanDevice>;
    destroy(): Promise<void>;
}
/**
 * Singleton Lifx object
 */
export declare const Lifx: LifxLan;
//# sourceMappingURL=lants.d.ts.map