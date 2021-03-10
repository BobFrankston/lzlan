"use strict";
/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-composer.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LifxLanComposer = void 0;
const mCrypto = __importStar(require("crypto"));
const lants_parser_1 = require("./lants-parser");
const lants_device_1 = require("./lants-device");
const lants_color_1 = require("./lants-color");
;
var bx;
(function (bx) {
    // Buffer types
    bx[bx["byte"] = 0] = "byte";
    bx[bx["i16"] = 1] = "i16";
    bx[bx["i32"] = 2] = "i32";
    bx[bx["h16"] = 3] = "h16";
    bx[bx["s32"] = 4] = "s32";
    // Add support for colors and a buffer and group and ...
})(bx || (bx = {}));
class bufx {
    constructor(size) {
        this.buf = Buffer.alloc(size);
        this.cursor = 0;
    }
    static make(...vals) {
        const size = (bz) => {
            switch (bz) {
                case bx.byte: return 1;
                case bx.i16: return 2;
                case bx.i32: return 4;
                case bx.h16: return 16; // 32 chars, 16 bytes
                case bx.s32: return 32;
            }
        };
        const len = vals.reduce((p, v) => p += size(v.kind), 0);
        const mbuf = new bufx(len);
        vals.forEach(sv => {
            if (sv.val == null)
                mbuf.skip(sv.kind);
            else {
                const n = sv.val; // Guess we coould check but why bother
                const s = sv.val;
                switch (sv.kind) {
                    case bx.byte:
                        mbuf.writeUInt8(n);
                        break;
                    case bx.i16:
                        mbuf.writeUInt16LE(n);
                        break;
                    case bx.i32:
                        mbuf.writeUInt32LE(n);
                        break;
                    case bx.h16:
                        mbuf.append(Buffer.from(s.padEnd(32, '0').substr(0, 32), 'hex'));
                        break;
                    // Handle nulls for the strings? Also deal with UTF8 bytes
                    // ALso deal with crypto alternative
                    case bx.s32:
                        mbuf.append(Buffer.from(s.padEnd(32, '0').substr(0, 32), 'utf8'));
                        break;
                }
            }
        });
        return mbuf;
    }
    get buffer() { return this.buf.slice(0, this.cursor); }
    append(b) {
        if (b instanceof Buffer)
            this.buf = Buffer.concat([this.buf, b]);
        else
            this.buf = Buffer.concat([this.buf, b.buf]);
    }
    assure(len) {
        const need = this.cursor + len - this.buf.length;
        if (need <= 0)
            return; // OK
        this.append(Buffer.alloc(need)); // Only just enough ... slower but OK
    }
    skip(span) {
        this.cursor += span; // But we don't extend the allocation
    }
    writeUInt8(val) {
        this.assure(1);
        this.buf.writeUInt8(val, this.cursor++);
    }
    writeUInt16LE(val) {
        this.assure(2);
        this.buf.writeUInt16LE(val, this.cursor);
        this.cursor += 2;
    }
    writeUInt32LE(val) {
        this.assure(4);
        this.buf.writeUInt32LE(val, this.cursor);
        this.cursor += 4;
    }
}
class LifxLanComposer {
    compose(cp) {
        const type = cp.type;
        const payload = cp.payload;
        const sequence = cp.sequence;
        const ack_required = cp.ack_required ? 1 : 0;
        const res_required = cp.res_required ? 1 : 0;
        const target = cp.target;
        const tagged = cp.tagged ? 1 : 0;
        const source = cp.source;
        const payload_buf = this._composePayload(type, payload); // .buffer;
        const target_parts = target.match(/[0-9A-F]{2}:?/g);
        if (target_parts.length !== 6)
            throw new Error('The value of the parameter `target` is invalid as a MAC address.');
        const target_bytes = target_parts.map(t => parseInt(t.replace(":", ""), 16));
        // Frame
        const origin = 0;
        let addressable = 1;
        const protocol = 1024;
        let buf1 = Buffer.alloc(8);
        let buf1n2 = protocol | (origin << 14) | (tagged << 13) | (addressable << 12);
        buf1.writeUInt16LE(buf1n2, 2);
        buf1.writeUInt32LE(source, 4);
        // Frame Address
        let buf2 = Buffer.alloc(16);
        target_bytes.forEach((v, i) => {
            buf2.writeUInt8(v, i);
        });
        buf2.writeUInt8((ack_required << 1) | res_required, 14);
        buf2.writeUInt8(sequence, 15);
        // Protocol Header
        let buf3 = Buffer.alloc(12);
        buf3.writeUInt16LE(type, 8);
        let buf_list = [buf1, buf2, buf3];
        if (payload_buf)
            buf_list.push(payload_buf);
        let buf = Buffer.concat(buf_list);
        let size = buf.length;
        buf.writeUInt16LE(size, 0);
        return buf;
    }
    ;
    _composePayload(type, payload) {
        switch (type) {
            case lants_parser_1.lifxMsgType.SetPower: return this._composePayloadSetPower(payload);
            case lants_parser_1.lifxMsgType.SetLabel: return this._composePayloadSetLabel(payload);
            case lants_parser_1.lifxMsgType.SetLocation: return this._composePayloadSetLocation(payload);
            case lants_parser_1.lifxMsgType.SetGroup: return this._composePayloadSetGroup(payload);
            case lants_parser_1.lifxMsgType.EchoRequest: return this._composePayloadEchoRequest(payload);
            case lants_parser_1.lifxMsgType.SetColor: return this._composePayloadSetColor(payload);
            case lants_parser_1.lifxMsgType.SetWaveform: return this._composePayloadSetWaveForm(payload);
            case lants_parser_1.lifxMsgType.SetLightPower: return this._composePayloadSetLightPower(payload);
            case lants_parser_1.lifxMsgType.SetInfrared: return this._composePayloadSetInfrared(payload);
            case lants_parser_1.lifxMsgType.SetColorZones: return this._composePayloadSetColorZones(payload);
            case lants_parser_1.lifxMsgType.GetColorZones: return this._composePayloadGetColorZones(payload);
            case lants_parser_1.lifxMsgType.EchoRequest: return this._composePayloadEchoRequest(payload);
            case lants_parser_1.lifxMsgType.GetTileState64: return this._composePayLoadGetTileState64(payload);
            default: return null;
        }
    }
    ;
    _composePayloadSetPower(payload) {
        let buf = Buffer.alloc(2);
        buf.writeUInt16LE(payload.level == 1 ? 0xffff : 0, 0);
        return buf;
    }
    ;
    _composePayloadSetLabel(payload) {
        return this.composeLabel(payload.label);
    }
    ;
    composeLocation(location) {
        return location ? Buffer.from(location.padEnd(32, '0').substr(0, 32), 'hex') : mCrypto.randomBytes(16);
    }
    composeGroup(group) {
        return location ? Buffer.from(group.padEnd(32, '0').substr(0, 32), 'hex') : mCrypto.randomBytes(16);
    }
    composeLabel(label) {
        // UTF8 may not be one byte per char
        // return Buffer.from(label.padEnd(32, '\x00').substr(0, 32), 'utf8');
        const label_buf = Buffer.from(label, 'utf8');
        const padding_buf = Buffer.alloc(32 - label_buf.length);
        return Buffer.concat([label_buf, padding_buf]).slice(0, 32); // Assure not too long
    }
    composeUpdated(updated) {
        const ub = Buffer.alloc(8);
        ub.writeUIntLE((updated ? updated : new Date()).getTime() * 1000000, 0, 8);
        return ub;
    }
    _composePayloadSetLocation(payload) {
        const location_buf = this.composeLocation(payload.location);
        const label_buf = this.composeLabel(payload.label);
        const updated_buf = this.composeUpdated(payload.updated);
        const buf = Buffer.concat([location_buf, label_buf, updated_buf]);
        return buf;
    }
    ;
    _composePayloadSetGroup(payload) {
        const group_buf = this.composeGroup(payload.group);
        const label_buf = this.composeLabel(payload.label);
        const updated_buf = this.composeUpdated(payload.updated);
        const buf = Buffer.concat([group_buf, label_buf, updated_buf]);
        return buf;
    }
    ;
    /* ------------------------------------------------------------------
    * Method:  _composePayload58(payload) : deviceEchoRequest
    * - payload:
    *   - text | String | Required | up to 64 bytes in UTF-8 encoding
    * ---------------------------------------------------------------- */
    _composePayloadEchoRequest(payload) {
        let text = payload.text;
        let text_buf = Buffer.from(text, 'utf8');
        let padding_buf = Buffer.alloc(64 - text_buf.length);
        let buf = Buffer.concat([text_buf, padding_buf]);
        return buf;
    }
    ;
    _composePayloadSetColor(payload) {
        const hsb = this._convertAnytoPacket(payload.color);
        // private _composePayloadSetColor(payload: { color: LifxLanColorHSB, duration: Integer }): Buffer {
        // 	const hsb = this._convertHSBToPacket(payload.color);
        const duration = payload.duration || 0;
        let buf = Buffer.alloc(13);
        buf.writeUInt16LE(hsb.hue, 1);
        buf.writeUInt16LE(hsb.saturation, 3);
        buf.writeUInt16LE(hsb.brightness, 5);
        buf.writeUInt16LE(hsb.kelvin, 7);
        buf.writeUInt32LE(duration, 9);
        return buf;
    }
    ;
    _convertAnytoPacket(dataAny) {
        // 	const hsb = anyToHsb(data);
        // 	return hsb;
        // }
        // private _convertHSBToPacket(data: LifxLanColorHSB): LifxLanColorHSB {
        const data = lants_color_1.anyToHsb(dataAny);
        const test = {
            hue: Math.round(data.hue * 0xffff),
            saturation: Math.round(data.saturation * 0xffff),
            brightness: Math.round(data.brightness * 0xffff),
            kelvin: data.kelvin
        };
        let color = {
            hue: 0,
            saturation: 0,
            brightness: 0,
        };
        let color_key_list = Object.keys(color);
        for (let i = 0; i < color_key_list.length; i++) {
            let k = color_key_list[i];
            if (k in data) {
                let v = data[k];
                if (typeof (v) !== 'number' || v < 0 || v > 1) {
                    throw new Error('The `color.' + k + '` must be a float between 0.0 and 1.0.');
                }
                color[k] = Math.round(v * 65535);
            }
            else {
                throw new Error('The `color.' + k + '` is required.');
            }
        }
        let kelvin = 0;
        if ('kelvin' in data) {
            kelvin = data['kelvin'];
            if (typeof (kelvin) !== 'number' || kelvin % 1 !== 0 || kelvin < 1500 || kelvin > 9000) {
                throw new Error('The `color.kelvin` must be an integer between 1500 and 9000.');
            }
            color['kelvin'] = kelvin;
        }
        else {
            throw new Error('The `color.kelvin` is required.');
        }
        // return { color: color };
        return color;
    }
    ;
    _composePayloadSetWaveForm(payload) {
        // Check the payload
        // Check the `transient`
        let transient = 0;
        if ('transient' in payload) {
            transient = payload['transient'];
            if (typeof (transient) !== 'number' || !(transient === 0 || transient === 1)) {
                throw new Error('The `transient` must be 0 or 1.');
            }
        }
        else {
            throw new Error('The `transient` is required.');
            // return;
        }
        // Check the `color`
        if (!('color' in payload)) {
            throw new Error('The `color` is required.');
        }
        // let color_check_res = this._checkColorValues(payload['color']);
        // if (color_check_res['error']) {
        //  throw color_check_res['error'];
        // }
        // let color = color_check_res['color'];
        const color = payload.color;
        // Check the `period`
        let period = 0;
        if ('period' in payload) {
            period = payload['period'];
            if (typeof (period) !== 'number' || period % 1 !== 0 || period < 0 || period > 0xffffffff) {
                throw new Error('The `period` must be an integer between 0 and 0xffffffff.');
            }
        }
        else {
            throw new Error('The `period` is required.');
        }
        // Check the `cycles`
        let cycles = 0;
        if ('cycles' in payload) {
            cycles = payload['cycles'];
            if (typeof (cycles) !== 'number') {
                throw new Error('The `cycles` must be a float.');
            }
        }
        else {
            throw new Error('The `cycles` is required.');
        }
        // Checke the `waveform`
        let waveform = 0;
        if ('waveform' in payload) {
            waveform = payload['waveform'];
            if (typeof (waveform) !== 'number' || !/^(0|1|2|3|4)$/.test(waveform.toString())) {
                throw new Error('The `waveform` must be 0, 1, 2, 3, or 4.');
            }
        }
        else {
            throw new Error('The `waveform` is required.');
        }
        // Check the `skew_ratio`
        let skew_ratio = 0;
        if (waveform === 4) {
            if ('skew_ratio' in payload) {
                skew_ratio = payload['skew_ratio'];
                if (typeof (skew_ratio) !== 'number' || skew_ratio < 0 || skew_ratio > 1) {
                    throw new Error('The `skew_ratio` must be a float between 0.0 and 1.0.');
                }
                skew_ratio = skew_ratio * 65535 - 32768;
            }
            else {
                throw new Error('The `skew_ratio` is required.');
            }
        }
        // Compose a payload
        let buf = Buffer.alloc(21);
        buf.writeUInt8(transient, 1);
        buf.writeUInt16LE(color['hue'], 2);
        buf.writeUInt16LE(color['saturation'], 4);
        buf.writeUInt16LE(color['brightness'], 6);
        buf.writeUInt16LE(color['kelvin'], 8);
        buf.writeUInt32LE(period, 10);
        buf.writeFloatLE(cycles, 14);
        buf.writeInt16LE(skew_ratio, 18);
        buf.writeUInt8(waveform, 20);
        return buf;
    }
    ;
    _composePayloadSetLightPower(payload) {
        let level = payload.level == 1 ? 0xffff : 0;
        const duration = payload.duration || 0;
        let buf = Buffer.alloc(6);
        buf.writeUInt16LE(level, 0);
        buf.writeUInt32LE(duration, 2);
        return buf;
    }
    ;
    _composePayloadSetInfrared(payload) {
        const brightness = Math.round((payload.brightness || 0.0) * 65535);
        let buf = Buffer.alloc(2);
        buf.writeUInt16LE(brightness, 0);
        return buf;
    }
    ;
    _composePayloadSetColorZones(payload) {
        // Check the payload
        // Check the `start`
        let start = payload.start || 0;
        let end = payload.end || 0;
        if (start > end)
            ({ start, end } = { end, start });
        const hsb = this._convertAnytoPacket(payload.color); // hack conversion!
        let duration = payload.duration || 0;
        let apply = payload.apply || lants_device_1.LifxApply.APPLY;
        let buf = Buffer.alloc(15);
        buf.writeUInt8(start, 0);
        buf.writeUInt8(end, 1);
        buf.writeUInt16LE(hsb.hue, 2);
        buf.writeUInt16LE(hsb.saturation, 4);
        buf.writeUInt16LE(hsb.brightness, 6);
        buf.writeUInt16LE(hsb.kelvin, 8);
        buf.writeUInt32LE(duration, 10);
        buf.writeUInt8(apply, 14);
        return buf;
    }
    ;
    _composePayloadGetColorZones(payload) {
        // Compose a payload
        let buf = Buffer.alloc(2);
        buf.writeUInt8(payload.start, 0);
        buf.writeUInt8(payload.end, 1);
        return buf;
    }
    ;
    _composePayLoadGetTileState64(payload) {
        let buf = Buffer.alloc(6);
        buf.writeUInt8(payload.tile_index, 0);
        buf.writeUInt8(payload.length, 1);
        // reserved
        buf.writeUInt8(payload.x, 3);
        buf.writeUInt8(payload.y, 4);
        buf.writeUInt8(payload.width, 5);
        return buf;
    }
}
exports.LifxLanComposer = LifxLanComposer;
//# sourceMappingURL=lants-composer.js.map