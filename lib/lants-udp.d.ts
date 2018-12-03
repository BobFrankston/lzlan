/// <reference types="node" />
import { lifxMsgType, LifxLanHeader } from "./lants-parser";
import { LifxLanDevice } from "./lants-device";
export interface udpParams {
    address?: string;
    type: lifxMsgType;
    payload?: object;
    ack_required?: boolean;
    res_required?: boolean;
    target?: string;
    broadcast?: boolean;
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
    private _UDP_PORT;
    private _udp;
    private _requests;
    private _sequence;
    private _timeout;
    private _source_id;
    private _netif_list;
    destroy(): Promise<void>;
    init(): Promise<{}>;
    request(params: udpParams): Promise<void | {}>;
    private _requestUnicast;
    private _requestBroadcast;
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