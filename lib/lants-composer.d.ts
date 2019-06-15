import { lifxMsgType } from './lants-parser';
import { Integer } from './lants-device';
export interface ComposerParms {
    type: lifxMsgType;
    sequence: Integer;
    ack_required?: boolean;
    res_required?: boolean;
    target: string;
    tagged?: boolean;
    source: Integer;
    payload?: object;
}
export declare class LifxLanComposer {
    compose(cp: ComposerParms): Buffer;
    _composePayload(type: lifxMsgType, payload?: any): Buffer;
    private _composePayloadSetPower;
    private _composePayloadSetLabel;
    private composeLocation;
    private composeGroup;
    private composeLabel;
    private composeUpdated;
    private _composePayloadSetLocation;
    private _composePayloadSetGroup;
    private _composePayloadEchoRequest;
    private _composePayloadSetColor;
    private _convertHSBToPacket;
    private _composePayloadSetWaveForm;
    private _composePayloadSetLightPower;
    private _composePayloadSetInfrared;
    private _composePayloadSetColorZones;
    private _composePayloadGetColorZones;
    private _composePayLoadGetTileState64;
}
//# sourceMappingURL=lants-composer.d.ts.map