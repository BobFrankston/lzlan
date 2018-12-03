"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const products_1 = require("./products");
/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-parser.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-06-09
* ---------------------------------------------------------------- */
'use strict';
/* ------------------------------------------------------------------
* Constructor: LifxLanParser()
* ---------------------------------------------------------------- */
var lifxMsgType;
(function (lifxMsgType) {
    lifxMsgType[lifxMsgType["GetService"] = 2] = "GetService";
    lifxMsgType[lifxMsgType["StateService"] = 3] = "StateService";
    lifxMsgType[lifxMsgType["GetHostInfo"] = 12] = "GetHostInfo";
    lifxMsgType[lifxMsgType["StateHostInfo"] = 13] = "StateHostInfo";
    lifxMsgType[lifxMsgType["GetHostFirmware"] = 14] = "GetHostFirmware";
    lifxMsgType[lifxMsgType["StateHostFirmware"] = 15] = "StateHostFirmware";
    lifxMsgType[lifxMsgType["GetWifiInfo"] = 16] = "GetWifiInfo";
    lifxMsgType[lifxMsgType["StateWifiInfo"] = 17] = "StateWifiInfo";
    lifxMsgType[lifxMsgType["GetWifiFirmware"] = 18] = "GetWifiFirmware";
    lifxMsgType[lifxMsgType["StateWifiFirmware"] = 19] = "StateWifiFirmware";
    lifxMsgType[lifxMsgType["GetPower"] = 20] = "GetPower";
    lifxMsgType[lifxMsgType["SetPower"] = 21] = "SetPower";
    lifxMsgType[lifxMsgType["StatePower"] = 22] = "StatePower";
    lifxMsgType[lifxMsgType["GetLabel"] = 23] = "GetLabel";
    lifxMsgType[lifxMsgType["SetLabel"] = 24] = "SetLabel";
    lifxMsgType[lifxMsgType["StateLabel"] = 25] = "StateLabel";
    lifxMsgType[lifxMsgType["GetVersion"] = 32] = "GetVersion";
    lifxMsgType[lifxMsgType["StateVersion"] = 33] = "StateVersion";
    lifxMsgType[lifxMsgType["GetInfo"] = 34] = "GetInfo";
    lifxMsgType[lifxMsgType["StateInfo"] = 35] = "StateInfo";
    lifxMsgType[lifxMsgType["Acknowledgement"] = 45] = "Acknowledgement";
    lifxMsgType[lifxMsgType["GetLocation"] = 48] = "GetLocation";
    lifxMsgType[lifxMsgType["SetLocation"] = 49] = "SetLocation";
    lifxMsgType[lifxMsgType["StateLocation"] = 50] = "StateLocation";
    lifxMsgType[lifxMsgType["GetGroup"] = 51] = "GetGroup";
    lifxMsgType[lifxMsgType["SetGroup"] = 52] = "SetGroup";
    lifxMsgType[lifxMsgType["StateGroup"] = 53] = "StateGroup";
    lifxMsgType[lifxMsgType["EchoRequest"] = 58] = "EchoRequest";
    lifxMsgType[lifxMsgType["EchoResponse"] = 59] = "EchoResponse";
    // Light Messages
    lifxMsgType[lifxMsgType["LightGet"] = 101] = "LightGet";
    lifxMsgType[lifxMsgType["SetColor"] = 102] = "SetColor";
    lifxMsgType[lifxMsgType["SetWaveform"] = 103] = "SetWaveform";
    lifxMsgType[lifxMsgType["SetWaveformOptional"] = 119] = "SetWaveformOptional";
    lifxMsgType[lifxMsgType["State"] = 107] = "State";
    lifxMsgType[lifxMsgType["GetLightPower"] = 116] = "GetLightPower";
    lifxMsgType[lifxMsgType["SetLightPower"] = 117] = "SetLightPower";
    lifxMsgType[lifxMsgType["StateLightPower"] = 118] = "StateLightPower";
    lifxMsgType[lifxMsgType["GetInfrared"] = 120] = "GetInfrared";
    lifxMsgType[lifxMsgType["StateInfrared"] = 121] = "StateInfrared";
    lifxMsgType[lifxMsgType["SetInfrared"] = 122] = "SetInfrared";
    // MultiZone
    lifxMsgType[lifxMsgType["SetColorZones"] = 501] = "SetColorZones";
    lifxMsgType[lifxMsgType["GetColorZones"] = 502] = "GetColorZones";
    lifxMsgType[lifxMsgType["StateZone"] = 503] = "StateZone";
    lifxMsgType[lifxMsgType["StateMultiZone"] = 506] = "StateMultiZone";
    lifxMsgType[lifxMsgType["GetDeviceChain"] = 701] = "GetDeviceChain";
    lifxMsgType[lifxMsgType["StateDeviceChain"] = 702] = "StateDeviceChain";
    lifxMsgType[lifxMsgType["SetUserPositio"] = 703] = "SetUserPositio";
    lifxMsgType[lifxMsgType["GetTileState64"] = 707] = "GetTileState64";
    lifxMsgType[lifxMsgType["StateTileState64"] = 711] = "StateTileState64";
    lifxMsgType[lifxMsgType["SetTileState64"] = 715] = "SetTileState64";
})(lifxMsgType = exports.lifxMsgType || (exports.lifxMsgType = {}));
class LifxTile {
}
exports.LifxTile = LifxTile;
// https://lan.developer.lifx.com/docs/tile-messages
class LifxLanHeader {
}
exports.LifxLanHeader = LifxLanHeader;
const headerSize = 36;
class LifxLanParser {
    // constructor() { super(); }
    /* ------------------------------------------------------------------
    * Method: parse(buffer)
    * ---------------------------------------------------------------- */
    parse(buf) {
        if (buf.length < headerSize)
            return null;
        const header = this._parseHeader(buf);
        if (!header)
            return null;
        let payload = null;
        if (header.size > headerSize) {
            let pbuf = buf.slice(headerSize, header.size);
            payload = this._parsePayload(header.type, pbuf);
        }
        return {
            header: header,
            payload: payload
        };
    }
    ;
    _parseHeader(buf) {
        // Frame
        const size = buf.readUInt16LE(0);
        if (size !== buf.length)
            return null;
        const tagged = (buf.readUInt8(3) & 0b00100000) ? true : false;
        const addressable = (buf.readUInt8(3) & 0b00010000) ? true : false;
        const protocol = buf.readUInt16LE(2) & 0b0000111111111111;
        const source = buf.readUInt32LE(4);
        const target = buf.slice(8, 8 + 8).toString('hex').match(/../g).join(":").toUpperCase(); // MAC
        const ack = (buf.readUInt8(22) & 0b00000010) ? true : false;
        const res = (buf.readUInt8(22) & 0b00000001) ? true : false;
        const sequence = buf.readUInt8(23);
        // Protocol Header
        const type = buf.readUInt16LE(32);
        return {
            size: size,
            tagged: tagged,
            addressable: addressable,
            protocol: protocol,
            source: source,
            target: target,
            ack: ack,
            res: res,
            sequence: sequence,
            type: type
        };
    }
    _parsePayload(type, pbuf) {
        let psize = pbuf.length;
        // let payload = null;
        // ------------------------------------------------
        // Device Messages
        // ------------------------------------------------
        try {
            switch (type) {
                case lifxMsgType.StateService:
                    if (psize != 5)
                        return null;
                    return { service: pbuf.readUInt8(0), port: pbuf.readUInt32LE(1) };
                case lifxMsgType.StateHostInfo:
                    if (psize != 14)
                        return null;
                    return {
                        signal: pbuf.readFloatLE(0),
                        tx: pbuf.readUInt32LE(4),
                        rx: pbuf.readUInt32LE(8)
                    };
                case lifxMsgType.StateHostFirmware: //15
                    if (psize != 20)
                        return null;
                    return {
                        build: this._64BitToDate(pbuf, 0),
                        version: pbuf.readUInt32LE(16)
                    };
                case lifxMsgType.StateWifiInfo: //17
                    if (psize != 14)
                        return null;
                    return {
                        signal: pbuf.readFloatLE(0),
                        tx: pbuf.readUInt32LE(4),
                        rx: pbuf.readUInt32LE(8)
                    };
                case lifxMsgType.StateWifiFirmware: //19
                    if (psize != 20)
                        return null;
                    return {
                        build: this._64BitToDate(pbuf, 0),
                        version: pbuf.readUInt32LE(16)
                    };
                case lifxMsgType.StatePower: //22
                    if (psize != 2)
                        return null;
                    return {
                        level: pbuf.readUInt16LE(0) ? 1 : 0
                    };
                case lifxMsgType.StateLabel: //25
                    if (psize != 32)
                        return null;
                    return {
                        label: this._convertBufferToString(pbuf)
                    };
                case lifxMsgType.StateVersion: //33
                    if (psize != 12)
                        return null;
                    const vid = pbuf.readUInt32LE(0);
                    const pid = pbuf.readUInt32LE(4);
                    const hwv = pbuf.readUInt32LE(8);
                    const byvendors = products_1.lifxProducts.filter(vp => vp.vid == vid);
                    if (byvendors.length != 1)
                        return null;
                    const byvendor = byvendors[0];
                    const prods = byvendor.products.filter(p => p.pid == pid);
                    if (prods.length != 1)
                        return null;
                    const prod = prods[0];
                    const vname = byvendor.name;
                    const pname = prod.name;
                    const features = prod.features;
                    return {
                        vendorId: vid,
                        vendorName: vname,
                        productId: pid,
                        productName: pname,
                        hwVersion: hwv,
                        features: features
                    };
                case lifxMsgType.StateInfo: //35
                    if (psize != 24)
                        return null;
                    return {
                        time: this._64BitToDate(pbuf, 0),
                        uptime: this._conv64BitTimeStampToMsec(pbuf, 8),
                        downtime: this._conv64BitTimeStampToMsec(pbuf, 16) // msec
                    };
                case lifxMsgType.StateLocation: //50
                    if (psize != 56)
                        return null;
                    return {
                        guid: pbuf.slice(0, 16).toString('hex'),
                        label: this._convertBufferToString(pbuf.slice(16, 48)),
                        updated: this._64BitToDate(pbuf, 48)
                    };
                case lifxMsgType.StateGroup: //53
                    if (psize != 56)
                        return null;
                    return {
                        guid: pbuf.slice(0, 16).toString('hex'),
                        label: this._convertBufferToString(pbuf.slice(16, 48)),
                        updated: this._64BitToDate(pbuf, 48)
                    };
                case lifxMsgType.EchoResponse: //59
                    if (psize != 64)
                        return null;
                    return {
                        text: this._convertBufferToString(pbuf)
                    };
                // -----------------------------------------------
                // Light Messages
                // ------------------------------------------------
                case lifxMsgType.State: //107
                    if (psize != 52)
                        return null;
                    return {
                        color: this._parseColor(pbuf.slice(0, 8)),
                        power: pbuf.readUInt16LE(10) ? 1 : 0,
                        label: this._convertBufferToString(pbuf.slice(12, 42)),
                    };
                case lifxMsgType.StatePower: //118
                    if (psize != 2)
                        return null;
                    return {
                        level: pbuf.readUInt16LE(0) ? 1 : 0
                    };
                case lifxMsgType.StateInfrared: //121
                    if (psize != 2)
                        return null;
                    return {
                        brightness: pbuf.readUInt16LE(0) / 65535
                    };
                // ------------------------------------------------
                // MultiZone Messages
                // ------------------------------------------------
                case lifxMsgType.StateZone: //503
                    if (psize != 10)
                        return null;
                    return {
                        count: pbuf.readUInt8(0),
                        index: pbuf.readUInt8(1),
                        color: this._parseColor(pbuf.slice(2, 10))
                    };
                case lifxMsgType.StateMultiZone: //506
                    if (psize != 66)
                        return null;
                    let colors = [];
                    for (let offset = 2; offset < 66; offset += 8) {
                        let c = this._parseColor(pbuf.slice(offset, offset + 8));
                        colors.push(c);
                    }
                    return {
                        count: pbuf.readUInt8(0),
                        index: pbuf.readUInt8(1),
                        colors: colors
                    };
                case lifxMsgType.StateDeviceChain:
                    const tileSize = 48;
                    const tileCount = (psize - 1) / 48;
                    if (!(tileCount % 1))
                        throw new Error(`Invalid tile message length ${psize}`);
                    const tiles = [];
                    for (let tn = 0; tn < tileCount; tn++)
                        tiles[tn] = this._parseTile(pbuf, 1 + tn * 48);
                    return {
                        start: pbuf.readUInt8(0),
                        tiles: tiles,
                        total_count: tileCount,
                    };
                case lifxMsgType.StateTileState64:
                    throw new Error(`StateDeviceChain not yet implemented`);
                // 8 bit tile_index, reserved, x, y, width, colors 64 hsb values
            }
            return null;
        }
        catch (e) {
            console.error(`Error parsing payload ${e}\n${pbuf.toString('hex')}`);
            return null;
        }
    }
    ;
    _convertBufferToString(buf) {
        let str = '';
        let offset = 0;
        for (let i = 0; i < buf.length; i++) {
            if (buf.readUInt8(i) === 0x00) { // The buffer is NOT zero terminated per the spec
                break;
            }
            else {
                offset = i;
            }
        }
        if (offset === 0) {
            return '';
        }
        else {
            return buf.slice(0, offset + 1).toString('utf8');
        }
    }
    ;
    _parseColor(buf) {
        return {
            hue: parseFloat((buf.readUInt16LE(0) / 65535).toFixed(5)),
            saturation: parseFloat((buf.readUInt16LE(2) / 65535).toFixed(5)),
            brightness: parseFloat((buf.readUInt16LE(4) / 65535).toFixed(5)),
            kelvin: buf.readUInt16LE(6)
        };
    }
    ;
    _64BitToDate(buf, offset) {
        let msec = buf.readUIntLE(offset + 2, 6) * (Math.pow(2, 16) / 1000000);
        // return parseInt(msec, 10);
        return new Date(msec);
    }
    ;
    _conv64BitTimeStampToMsec(buf, offset) {
        let msec = buf.readUIntLE(offset + 2, 6) * (Math.pow(2, 16) / 1000000);
        // return parseInt(msec, 10);
        return msec.toFixed(0);
    }
    ;
    _parseTile(buf, offset) {
        return {
            // Skip 4 16 - 0 2 6
            user_x: buf.readFloatLE(offset + 8),
            user_y: buf.readFloatLE(offset + 12),
            width: buf.readUInt8(offset + 16),
            height: buf.readUInt8(offset + 17),
            // Skip one 18
            device_version_Vendor: buf.readUInt32LE(offset + 19),
            device_version_product: buf.readUInt32LE(offset + 23),
            device_version_version: buf.readUInt32LE(offset + 27),
            firmware_build: buf.slice(offset + 28, offset + 28 + 8).toString('hex'),
            // Skip 8 36
            firmware_version: buf.readUInt32LE(offset + 44),
        };
    }
}
exports.mParser = new LifxLanParser();
//# sourceMappingURL=lants-parser.js.map