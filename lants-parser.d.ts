import { udpParsed } from "./lants-udp";
import { Float, Integer } from "./lants-device";
export declare enum lifxMsgType {
    GetService = 2,
    StateService = 3,
    GetHostInfo = 12,
    StateHostInfo = 13,
    GetHostFirmware = 14,
    StateHostFirmware = 15,
    GetWifiInfo = 16,
    StateWifiInfo = 17,
    GetWifiFirmware = 18,
    StateWifiFirmware = 19,
    GetPower = 20,
    SetPower = 21,
    StatePower = 22,
    GetLabel = 23,
    SetLabel = 24,
    StateLabel = 25,
    GetVersion = 32,
    StateVersion = 33,
    GetInfo = 34,
    StateInfo = 35,
    Acknowledgement = 45,
    GetLocation = 48,
    SetLocation = 49,
    StateLocation = 50,
    GetGroup = 51,
    SetGroup = 52,
    StateGroup = 53,
    EchoRequest = 58,
    EchoResponse = 59,
    LightGet = 101,
    SetColor = 102,
    SetWaveform = 103,
    SetWaveformOptional = 119,
    State = 107,
    GetLightPower = 116,
    SetLightPower = 117,
    StateLightPower = 118,
    GetInfrared = 120,
    StateInfrared = 121,
    SetInfrared = 122,
    SetColorZones = 501,
    GetColorZones = 502,
    StateZone = 503,
    StateMultiZone = 506,
    GetDeviceChain = 701,
    StateDeviceChain = 702,
    SetUserPositio = 703,
    GetTileState64 = 707,
    StateTileState64 = 711,
    SetTileState64 = 715
}
export declare class LifxTile {
    user_x: Float;
    user_y: Float;
    width: Integer;
    height: Integer;
    device_version_Vendor: Integer;
    device_version_product: Integer;
    device_version_version: Integer;
    firmware_build: string;
    firmware_version: Integer;
}
export declare class LifxLanHeader {
    size: number;
    origin: number;
    tagged: boolean;
    addressable: boolean;
    protocol: number;
    source: number;
    target: string;
    ack: boolean;
    res: boolean;
    sequence: number;
    type: lifxMsgType;
}
declare class LifxLanParser {
    parse(buf: Buffer): udpParsed;
    private _parseHeader;
    private _parsePayload;
    private _convertBufferToString;
    private _parseColor;
    private _64BitToDate;
    private _conv64BitTimeStampToMsec;
    private _parseTile;
}
export declare const mParser: LifxLanParser;
export {};
//# sourceMappingURL=lants-parser.d.ts.map