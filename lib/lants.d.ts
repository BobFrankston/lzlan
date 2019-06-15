import * as lantsDevice from "./lants-device";
import { LifxLanDevice, Integer } from "./lants-device";
import { UDPHandler } from './lants-udp';
export { LifxLanDevice };
export { UDPHandler };
export declare const delayms: (msec?: number) => Promise<unknown>;
/**
 * Discover current devices.
 * Note that this is not reliable
 * @param [optional]  params {wait: Millseconds}
 * @returns {LifxLanDevice[]} Table of devices
 */
export declare function discover(params?: {
    wait?: Integer;
}): Promise<lantsDevice.LifxLanDevice[]>;
/**
  * Create a new device object. This can be used in place of or in addition to discovery
  * @param {ip, MAC} params {ip IP Address, MAC Mac address}
  */
export declare function createDevice(params: {
    ip: string;
    mac: string;
}): Promise<lantsDevice.LifxLanDevice>;
//# sourceMappingURL=lants.d.ts.map