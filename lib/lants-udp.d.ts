/// <reference types="node" />
import { lifxMsgType, LifxLanHeader } from "./lants-parser";
import { LifxLanDevice } from "./lants-device";
export declare type UDPHandler = (rinfo: udpRinfo, pased: udpParsed) => void;
export interface udpParams {
    address?: string;
    type: lifxMsgType;
    payload?: object;
    ack_required?: boolean;
    res_required?: boolean;
    target?: string;
    broadcast?: boolean;
}
export interface udpRinfo {
    address: string;
    family: string;
    port: number;
    size: number;
}
export interface udpDiscover {
    seq: number;
    address: string;
    buffer: Buffer;
}
export interface udpParsed {
    header: LifxLanHeader;
    payload: {};
    address?: string;
    mac?: string;
}
export declare class LifxLanUdp {
    constructor();
    static created: boolean;
    private _UDP_PORT;
    private _udp;
    private _requests;
    private _sequence;
    private _timeout;
    private _source_id;
    private _netif_list;
    destroy(): Promise<void>;
    private initPromise;
    private initialized;
    /**
      * Initialize instance. Should only be called once
      */
    init(): Promise<any>;
    request(params: udpParams): Promise<void | {}>;
    private _requestUnicast;
    private _requestBroadcast;
    UDPHandlers: UDPHandler[];
    private _receivePacket;
    device_list_hack: {
        [ip: string]: LifxLanDevice;
    };
    private _isNetworkInterfaceAddress;
    discover(params: {
        wait?: number;
    }): Promise<udpParsed[]>;
    private _sendBroadcast;
}
export declare const mLifxUdp: LifxLanUdp;
export default mLifxUdp;
//# sourceMappingURL=lants-udp.d.ts.map