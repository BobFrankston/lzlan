import * as lantsDevice from "./lants-device";
import { LifxLanDevice, Integer } from "./lants-device";
export { LifxLanDevice };
import * as LifxLanColor from './lants-color';
import { LifxLanColorAny, LifxLanColorCSS, LifxLanColorHSB, LifxLanColorRGB, LifxLanColorXyb } from "./lants-color";
export { LifxLanColor, LifxLanColorAny, LifxLanColorCSS, LifxLanColorHSB, LifxLanColorRGB, LifxLanColorXyb };
export declare const delayms: (msec?: number) => Promise<{}>;
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
  * @returns LifxLanDevice object
  */
export declare function createDevice(params: {
    ip: string;
    mac: string;
}): Promise<lantsDevice.LifxLanDevice>;
export declare function normalizeMac(mac: string): string;
//# sourceMappingURL=lants.d.ts.map