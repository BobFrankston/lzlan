import * as lantsDevice from "./lants-device.js";
import { LifxLanDevice, Integer } from "./lants-device.js";
export { LifxLanDevice };
import * as LifxLanColor from './lants-color.js';
import { LifxLanColorAny, LifxLanColorCSS, LifxLanColorHSB, LifxLanColorRGB, LifxLanColorXyb } from "./lants-color.js";
export { LifxLanColor, LifxLanColorAny, LifxLanColorCSS, LifxLanColorHSB, LifxLanColorRGB, LifxLanColorXyb };
export declare const delayms: (msec?: number) => Promise<unknown>;
export declare let LZVerbose: boolean;
/**
 *
 * @param vb Set Verbaose mode
 */
export declare function setVerbose(vb: boolean): boolean;
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
  * @params {ip, MAC} params {ip IP Address, MAC Mac address}
  * @returns LifxLanDevice object
  */
export declare function createDevice(params: {
    ip: string;
    mac: string;
}): Promise<lantsDevice.LifxLanDevice>;
/**
 * Normalize MAC to AA:99 ...
 * @param mac Address to be normalize.
 * @returns Address in upper case with only hex characters separated by :
 */
export declare function normalizeMac(mac: string): string;
//# sourceMappingURL=lants.d.ts.map