/// <reference types="node" />
import * as mOs from 'os';
export declare class LifxLanAddress {
    getNetworkInterfaces(): mOs.NetworkInterfaceInfo[];
    _getBroadcastAddress(info: mOs.NetworkInterfaceInfoIPv4): string;
    _convIPv4ToNumList(address: string): number[];
}
export declare const LifxLanAddressx: LifxLanAddress;
//# sourceMappingURL=lants-address.d.ts.map