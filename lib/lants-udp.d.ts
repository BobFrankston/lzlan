/// <reference types="node" />
import { lifxMsgType, LifxLanHeader } from "./lants-parser";
/**
 * Handle incoming message that is not otherwise handled
 */
export interface udpParams {
    address?: string;
    type: lifxMsgType;
    payload?: object;
    ack_required?: boolean;
    res_required?: boolean;
    target?: string;
    broadcast?: boolean;
}
/**
 * Address info for incoming packet
 */
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
/**
 * Parsed message including header and payload
 */
export interface udpParsed {
    header: LifxLanHeader;
    payload: {};
    address?: string;
    mac?: string;
}
export declare class LifxLanUdp {
    static GetUDP(): Promise<LifxLanUdp>;
    private constructor();
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
    private initializing;
    /**
      * Initialize instance. Should only be called once
      */
    private init;
    request(params: udpParams): Promise<udpParsed | void>;
    private _requestUnicast;
    private _requestBroadcast;
    private _receivePacket;
    private _isNetworkInterfaceAddress;
    discover(params: {
        wait?: number;
    }): Promise<udpParsed[]>;
    private _sendBroadcast;
}
//# sourceMappingURL=lants-udp.d.ts.map