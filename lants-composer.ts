/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-composer.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */

import * as mCrypto from 'crypto';
import { lifxMsgType } from './lants-parser.js';
import { Integer, ColorDuration, Float, Duration, lifxWaveForm, LifxWaveForm, LifxApply, Integer255, String32, HexString16, LifxWaveFormType } from './lants-device.js';
import { anyToHsb, LifxLanColorHSB, } from './lants-color.js';
import { LifxLanColorAny } from './lants.js';

/* ------------------------------------------------------------------
* Constructor: LifxLanParser()
* ---------------------------------------------------------------- */

// Sjould be header
export interface ComposerParms {
	type: lifxMsgType,       // Message Type (e.g., 101)
	sequence: Integer,       // Message sequence number
	ack_required?: boolean,  // The default value is `false`
	res_required?: boolean,  // The default value is `false`
	target: string,          // Required | MAC Address
	tagged?: boolean,        //
	source: Integer,         // Source ID
	payload?: object,        // Depends on the type
};

enum bx {
	// Buffer types
	byte,
	i16,
	i32,
	h16,
	s32,
	// Add support for colors and a buffer and group and ...
}

class bufx {		// Wrapper for buffers
	constructor(size?: number) {
		this.buf = Buffer.alloc(size ?? 0);
		this.cursor = 0;
	}

	static make(...vals: { kind: bx, val: number | string }[]) {
		const size = (bz: bx) => {
			switch (bz) {
				case bx.byte: return 1;
				case bx.i16: return 2;
				case bx.i32: return 4;
				case bx.h16: return 16;		// 32 chars, 16 bytes
				case bx.s32: return 32;
			}
		}
		const len = vals.reduce((p, v) => p += size(v.kind), 0);
		const mbuf = new bufx(len);

		vals.forEach(sv => {
			if (sv.val == null)
				mbuf.skip(sv.kind);
			else {
				const n = <number>sv.val;	// Guess we coould check but why bother
				const s = <string>sv.val;
				switch (sv.kind) {
					case bx.byte: mbuf.writeUInt8(n); break;
					case bx.i16: mbuf.writeUInt16LE(n); break;
					case bx.i32: mbuf.writeUInt32LE(n); break;
					case bx.h16: mbuf.append(Buffer.from(s.padEnd(32, '0').substr(0, 32), 'hex')); break;
					// Handle nulls for the strings? Also deal with UTF8 bytes
					// ALso deal with crypto alternative
					case bx.s32: mbuf.append(Buffer.from(s.padEnd(32, '0').substr(0, 32), 'utf8')); break;
				}
			}
		});
		return mbuf;
	}

	get buffer() { return this.buf.slice(0, this.cursor) }

	append(b: Buffer | bufx) {
		const u8 = new Uint8Array(this.buf);
		if (b instanceof Buffer) {
			const u8b = new Uint8Array(b)
			this.buf = Buffer.concat([u8b]);
		}
		else {
			const u8c = new Uint8Array(b.buf);
			this.buf = Buffer.concat([u8, u8c]);
		}
	}

	private assure(len: number) {
		const need = this.cursor + len - this.buf.length
		if (need <= 0) return;	// OK
		this.append(Buffer.alloc(need));	// Only just enough ... slower but OK
	}

	skip(span: number) {
		this.cursor += span;	// But we don't extend the allocation
	}

	writeUInt8(val: number) {
		this.assure(1);
		this.buf.writeUInt8(val, this.cursor++);
	}

	writeUInt16LE(val: number) {
		this.assure(2);
		this.buf.writeUInt16LE(val, this.cursor);
		this.cursor += 2;
	}

	writeUInt32LE(val: number) {
		this.assure(4);
		this.buf.writeUInt32LE(val, this.cursor);
		this.cursor += 4;
	}

	private buf: Buffer;
	private cursor: number;	// Write position
}

export class LifxLanComposer {
	compose(cp: ComposerParms) {
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
		if (target_parts?.length !== 6) throw new Error('The value of the parameter `target` is invalid as a MAC address.');
		const target_bytes = target_parts?.map(t => parseInt(t.replace(":", ""), 16));

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
		target_bytes.forEach((v, i) => {	// Should just use from(... 'hex')
			buf2.writeUInt8(v, i);
		});

		buf2.writeUInt8((ack_required << 1) | res_required, 14);
		buf2.writeUInt8(sequence, 15);

		// Protocol Header
		let buf3 = Buffer.alloc(12);
		buf3.writeUInt16LE(type, 8);

		let buf_list = [buf1, buf2, buf3].map(b => new Uint8Array(b));
		if (payload_buf) buf_list.push(new Uint8Array(payload_buf));

		let buf = Buffer.concat(buf_list);

		let size = buf.length;
		buf.writeUInt16LE(size, 0);

		return buf;
	};

	_composePayload(type: lifxMsgType, payload?: any): Buffer | null {
		switch (type) {
			case lifxMsgType.SetPower: return this._composePayloadSetPower(payload);
			case lifxMsgType.SetLabel: return this._composePayloadSetLabel(payload);
			case lifxMsgType.SetLocation: return this._composePayloadSetLocation(payload);
			case lifxMsgType.SetGroup: return this._composePayloadSetGroup(payload);
			case lifxMsgType.EchoRequest: return this._composePayloadEchoRequest(payload);
			case lifxMsgType.SetColor: return this._composePayloadSetColor(payload);
			case lifxMsgType.SetWaveform: return this._composePayloadSetWaveForm(payload);
			case lifxMsgType.SetLightPower: return this._composePayloadSetLightPower(payload);
			case lifxMsgType.SetInfrared: return this._composePayloadSetInfrared(payload);
			case lifxMsgType.SetColorZones: return this._composePayloadSetColorZones(payload);
			case lifxMsgType.GetColorZones: return this._composePayloadGetColorZones(payload);
			case lifxMsgType.EchoRequest: return this._composePayloadEchoRequest(payload);
			case lifxMsgType.GetTileState64: return this._composePayLoadGetTileState64(payload);
			default: return null;
		}
	};

	private _composePayloadSetPower(payload: { level: 0 | 1 }): Buffer {
		let buf = Buffer.alloc(2);
		buf.writeUInt16LE(payload.level == 1 ? 0xffff : 0, 0);
		return buf;
	};

	private _composePayloadSetLabel(payload: { label: String32 }) {
		return this.composeLabel(payload.label)
	};

	private composeLocation(location: HexString16 | null | undefined) {
		return location ? Buffer.from(location.padEnd(32, '0').substr(0, 32), 'hex') : mCrypto.randomBytes(16);
	}

	private composeGroup(group: HexString16) {
		return location ? Buffer.from(group.padEnd(32, '0').substr(0, 32), 'hex') : mCrypto.randomBytes(16);
	}

	private composeLabel(label: String32) {
		// UTF8 may not be one byte per char
		// return Buffer.from(label.padEnd(32, '\x00').substr(0, 32), 'utf8');
		const label_buf = new Uint8Array(Buffer.from(label, 'utf8'));
		const padding_buf = new Uint8Array(Buffer.alloc(32 - label_buf.length));
		return Buffer.concat([label_buf, padding_buf]).slice(0, 32);	// Assure not too long
	}

	private composeUpdated(updated: Date) {
		const ub = Buffer.alloc(8);
		ub.writeUIntLE((updated ? updated : new Date()).getTime() * 1000000, 0, 8);
		return ub;
	}

	private _composePayloadSetLocation(payload: { location?: HexString16 | null, label: String32, updated: Date }): Buffer {
		const location_buf = new Uint8Array(this.composeLocation(payload.location));
		const label_buf = new Uint8Array(this.composeLabel(payload.label));
		const updated_buf = new Uint8Array(this.composeUpdated(payload.updated));
		const buf = Buffer.concat([location_buf, label_buf, updated_buf]);
		return buf;
	};

	private _composePayloadSetGroup(payload: { group?: HexString16, label: String32, updated?: Date }): Buffer {
		const group_buf = new Uint8Array(this.composeGroup(payload.group));
		const label_buf = new Uint8Array(this.composeLabel(payload.label));
		const updated_buf = new Uint8Array(this.composeUpdated(payload.updated));
		const buf = Buffer.concat([group_buf, label_buf, updated_buf]);
		return buf;
	};

	/* ------------------------------------------------------------------
	* Method:  _composePayload58(payload) : deviceEchoRequest
	* - payload:
	*   - text | String | Required | up to 64 bytes in UTF-8 encoding
	* ---------------------------------------------------------------- */
	private _composePayloadEchoRequest(payload: { text: string }): Buffer {
		let text = payload.text;
		let text_buf = new Uint8Array(Buffer.from(text, 'utf8'));
		let padding_buf = new Uint8Array(Buffer.alloc(64 - text_buf.length))
		let buf = Buffer.concat([text_buf, padding_buf]);
		return buf;
	};

	private _composePayloadSetColor(payload: { color: LifxLanColorAny, duration: Integer }): Buffer {
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
	};

	private _convertAnytoPacket(dataAny: LifxLanColorAny): LifxLanColorHSB {
		// 	const hsb = anyToHsb(data);
		// 	return hsb;
		// }

		// private _convertHSBToPacket(data: LifxLanColorHSB): LifxLanColorHSB {
		const data = anyToHsb(dataAny);
		const test = {
			hue: Math.round(data.hue * 0xffff),
			saturation: Math.round(data.saturation * 0xffff),
			brightness: Math.round(data.brightness * 0xffff),
			kelvin: data.kelvin
		}

		let color: LifxLanColorHSB = {
			hue: 0,
			saturation: 0,
			brightness: 0,
		};
		let color_key_list = Object.keys(color);
		for (let i = 0; i < color_key_list.length; i++) {
			let k = color_key_list[i];
			if (k in data) {
				let v = (data as any)[k] as number;	// Fuck you typescript
				if (typeof (v) !== 'number' || v < 0 || v > 1) {
					throw new Error('The `color.' + k + '` must be a float between 0.0 and 1.0.')
				}
				(color as any)[k] = Math.round(v * 65535);	// Fuck you typescript
			} else {
				throw new Error('The `color.' + k + '` is required.');
			}
		}
		let kelvin = 0;
		if ('kelvin' in data) {
			kelvin = data['kelvin'];
			if (typeof (kelvin) !== 'number' || kelvin % 1 !== 0 || kelvin < 1500 || kelvin > 9000) {
				throw new Error('The `color.kelvin` must be an integer between 1500 and 9000.')
			}
			color['kelvin'] = kelvin;
		} else {
			// 2021.03.09 removed kelvin check
			// throw new Error('The `color.kelvin` is required.');
		}
		// return { color: color };
		return color;
	};

	private _composePayloadSetWaveForm(payload: {
		transient: 0 | 1,
		color: LifxLanColorHSB,
		period: Integer,
		cycles: Float,
		skew_ratio: Float,
		waveform: LifxWaveFormType,
	}): Buffer {
		// Check the payload
		// Check the `transient`
		let transient = 0;
		if ('transient' in payload) {
			transient = payload['transient'];
			if (typeof (transient) !== 'number' || !(transient === 0 || transient === 1)) {
				throw new Error('The `transient` must be 0 or 1.');
			}
		} else {
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
		} else {
			throw new Error('The `period` is required.');
		}
		// Check the `cycles`
		let cycles = 0;
		if ('cycles' in payload) {
			cycles = payload['cycles'];
			if (typeof (cycles) !== 'number') {
				throw new Error('The `cycles` must be a float.');
			}
		} else {
			throw new Error('The `cycles` is required.');
		}
		// Checke the `waveform`
		let waveform = 0;
		if ('waveform' in payload) {
			waveform = payload['waveform'];
			if (typeof (waveform) !== 'number' || !/^(0|1|2|3|4)$/.test(waveform.toString())) {
				throw new Error('The `waveform` must be 0, 1, 2, 3, or 4.');
			}
		} else {
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
			} else {
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
	};

	private _composePayloadSetLightPower(payload: { level: Integer, duration?: Integer }): Buffer {
		let level = payload.level == 1 ? 0xffff : 0;
		const duration = payload.duration || 0;
		let buf = Buffer.alloc(6);
		buf.writeUInt16LE(level, 0);
		buf.writeUInt32LE(duration, 2);
		return buf;
	};

	private _composePayloadSetInfrared(payload: { brightness: Float }): Buffer {
		const brightness = Math.round((payload.brightness || 0.0) * 65535);
		let buf = Buffer.alloc(2);
		buf.writeUInt16LE(brightness, 0);
		return buf;
	};

	private _composePayloadSetColorZones(payload: { start: Integer, end: Integer, color: LifxLanColorHSB, duration?: Duration, apply?: LifxApply }) {
		// Check the payload
		// Check the `start`
		let start = payload.start || 0;
		let end = payload.end || 0;
		if (start > end) ({ start, end } = { end, start });
		const hsb = this._convertAnytoPacket(payload.color);  // hack conversion!
		let duration = payload.duration || 0;
		let apply = payload.apply || LifxApply.APPLY;

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
	};

	private _composePayloadGetColorZones(payload: { start: Integer255, end: Integer255 }) {
		// Compose a payload
		let buf = Buffer.alloc(2);
		buf.writeUInt8(payload.start, 0);
		buf.writeUInt8(payload.end, 1);
		return buf;
	};

	private _composePayLoadGetTileState64(payload: { tile_index: Integer255, length: Integer255, x: Integer255, y: Integer255, width: Integer255 }) {
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