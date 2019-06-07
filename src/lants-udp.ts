// Note -- bug fixed for CIDR       "cidr":"172.29.239.177/28",      "broadcast":"172.29.239.191"

import { lifxMsgType, mParser, LifxLanHeader } from "./lants-parser";
import { delayms } from "./lants";

/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-udp.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-07-01
* ---------------------------------------------------------------- */
// 'use strict';
import * as os from 'os';
import * as mDgram from 'dgram';
// const mDgram = require('dgram');

import * as Composer from './lants-composer';
const mComposer = new Composer.LifxLanComposer();
import * as la from './lants-address';
import { LifxLanDevice, passure } from "./lants-device";
import { promises } from "fs";

export type UDPHandler = (rinfo: udpRinfo, pased: udpParsed) => void;

const mAddress = new la.LifxLanAddress();

export interface udpParams {
	address?: string,        // IP address of the destination (e.g., "192.168.10.10") (optional for broadcast)
	type: lifxMsgType,       // Message Type (e.g., 101)
	payload?: object,        // Depends on the type
	ack_required?: boolean,  // The default value is `false`
	res_required?: boolean,  // The default value is `false`
	target?: string,         // Required | MAC Address (except if we have broadcast
	broadcast?: boolean;     // The default is `false`.
};

export interface udpRinfo {
	address: string;    // The sender address.
	family: string;     // 'IPv4' or 'IPv6'
	port: number;		// Sender port
	size: number;		// The message size.
}

export interface udpDiscover {
	seq: number,
	address: string,
	buffer: Buffer,
}

export interface udpParsed {
	header: LifxLanHeader;
	payload: {}
	address?: string;			// We can add IP
	mac?: string;
}          // {"service:1,"port:56700}}"

export class LifxLanUdp {
	constructor() {
		if (LifxLanUdp.created)
			throw new Error("Attempting to create second LifxLanUDP");
		LifxLanUdp.created = true
	}
	static created = false;
	// Private
	private _UDP_PORT = 56700;
	private _udp: mDgram.Socket = null;
	private _requests: { [seq: number]: (res: udpParsed) => void } = {};
	private _sequence = 0;
	private _timeout = 3000; // msec
	private _source_id = 0;
	private _netif_list: os.NetworkInterfaceInfo[] = null;

	/* ------------------------------------------------------------------
	* Method: destroy()
	* ---------------------------------------------------------------- */
	async destroy() {
		await this._udp.close();
		this._udp.unref();
		this._udp = null;
	};

	private initPromise: Promise<any> = null;
	private initialized: boolean = false;

	/**
      * Initialize instance. Should only be called once
      */

	async init() {
		// debugger;

		if (this.initPromise) {
			// await this.initPromise;
			// return;
			return this.initPromise;
		}
		if (this.initialized)
			return; 	// No need to wait

		this.initPromise = new Promise((resolve, reject) => {
			if (this._udp)
				debugger;	// Should never get here
			this._source_id = Math.floor(Math.random() * 0xffffffff);
			let netif_list = mAddress.getNetworkInterfaces();
			if (!netif_list || netif_list.length === 0) {
				reject(new Error('No available network interface was found.'));
				return;
			}
			this._netif_list = netif_list;
			// Set up a UDP tranceiver
			this._udp = mDgram.createSocket('udp4');
			this._udp.on('error', (error: Error) => {
				this.initPromise = null;
				reject(error);
			});
			this._udp.on('listening', () => {
				this.initPromise = null;
				this.initialized = true;
				resolve();
			});
			this._udp.on('message', (buf: Buffer, rinfo: udpRinfo) => { this._receivePacket(buf, rinfo); });
			this._udp.bind({ port: this._UDP_PORT });
		});
		return this.initPromise;
	};

	async request(params: udpParams) {
		const p = {
			address: params.address,
			type: params.type,
			payload: params.payload,
			ack_required: params.ack_required && !params.broadcast,
			res_required: params.res_required && !params.broadcast,
			target: params.broadcast ? '00:00:00:00:00:00' : params.target,
			broadcast: !!params.broadcast
		};

		try {
			if (p.broadcast)
				return await this._requestBroadcast(p);
			else
				return await this._requestUnicast(p);
		}
		catch (e) {
			throw e;
		}
	};

	// private _requestUnicast(p: { [key: string]: UdpParams}) {
	private async _requestUnicast(p: udpParams) {
		// let seq = (this._sequence + 1) % 255;
		// this._sequence = seq;

		// let packet = mComposer.compose({
		// 	type: p.type,
		// 	payload: p.payload,
		// 	sequence: seq,
		// 	ack_required: p.ack_required,
		// 	res_required: p.res_required,
		// 	target: p.target,
		// 	source: this._source_id,
		// 	tagged: false
		// });

		let promise = new Promise((resolve, reject) => {
			// message sequence number
			let seq = (this._sequence + 1) % 255;
			this._sequence = seq;
			// Timer
			let timer: NodeJS.Timer = null;
			if (p.ack_required || p.res_required) {
				timer = setTimeout(() => {
					delete this._requests[seq];
					reject(new Error('Timeout'));
				}, this._timeout);
			}
			// Create a request packet
			let packet = mComposer.compose({
				type: p.type,
				payload: p.payload,
				sequence: seq,
				ack_required: p.ack_required,
				res_required: p.res_required,
				target: p.target,
				source: this._source_id,
				tagged: false
			});
			// Set a callback
			if (p.ack_required || p.res_required) {
				this._requests[seq] = (res: udpParsed) => {
					delete this._requests[seq];
					if (timer) clearTimeout(timer);
					resolve(res);
				};
			}
			// Send a packet
			this._udp.setBroadcast(false);
			let buf = packet; // .buffer;
			this._udp.send(buf, 0, buf.length, this._UDP_PORT, p.address, (error: any) => {
				if (error) {
					delete this._requests[seq];
					if (timer) {
						clearTimeout(timer);
					}
					reject(error);
				} else {
					if (!p.ack_required && !p.res_required) {
						resolve();
					}
				}
			});
		});
		return promise;
	};

	private async _requestBroadcast(p: udpParams) {
		let req_list: udpDiscover[] = [];
		this._netif_list.forEach((netif) => {
			let seq = (this._sequence + 1) % 255;        // message sequence number
			this._sequence = seq;
			// Create a request packet
			let packet = mComposer.compose({
				type: p.type,
				payload: p.payload,
				sequence: seq,
				ack_required: p.ack_required, // false
				res_required: p.res_required, // false
				target: p.target, // 00:00:00:00:00:00
				source: this._source_id,
				tagged: false
			});
			req_list.push({ seq: seq, address: (<any>netif)['broadcast'], buffer: packet });
		});
		await this._sendBroadcast(req_list);
	};

	UDPHandlers: UDPHandler[] = [];

	private _receivePacket(buf: Buffer, rinfo: udpRinfo) {
		if (this._isNetworkInterfaceAddress(rinfo.address))
			return;		// Ignore echoes from myself
		let parsed = mParser.parse(buf);
		if (!parsed)
			return;
		parsed.address = rinfo.address;
		let seq = parsed.header.sequence;
		let callback = this._requests[seq];
		if (callback) {
			callback(parsed);
		}
		else {
			try {
				const pay: any = parsed.payload;	 // QUick hack
				let name = pay && pay.label;
				if (!name) {
					if (this.device_list_hack && this.device_list_hack[parsed.address])
						name = this.device_list_hack[parsed.address].deviceInfo.label;
					else
						name = parsed.address;
				}
				if (this.UDPHandlers.length) {
					this.UDPHandlers.forEach(uh => uh && uh(rinfo, parsed));	// Allow use of a null entry to suppress default
					return;
				}

				name = name.split(' ')[0];
				// Hack
				if (name == "My") name += ' ' + parsed.address;
				const type = lifxMsgType[parsed.header.type] || parsed.header.type.toString();
				const id = parsed.header.target.split(':').slice(3, 3 + 3).join('');
				console.log(`${new Date().toLocaleTimeString()} ${id} ${name.padEnd(18)} ${type} ${JSON.stringify(parsed.payload)}`);
				// https://community.lifx.com/t/why-are-some-bulbs-chatty/4777/3
			}
			catch (e) {
				console.error(`_receivePacket ${e}`);
			}
		}
	};

	device_list_hack: { [ip: string]: LifxLanDevice };	// So we can report heard

	private _isNetworkInterfaceAddress(addr: string) {
		return this._netif_list.some(netif => netif.address == addr);
		// 	for (let i = 0; i < this._netif_list.length; i++) {
		// 		let netif = this._netif_list[i];
		// 		if (netif.address === addr)
		// 			return true;
		// 	}
		// 	return false;
	};

	async discover(params: { wait?: number }) {
		params = passure(params);
		const wait = params.wait || 3000;
		const req_list: udpDiscover[] = [];
		const devices: { [key: string]: udpParsed } = {};
		this._netif_list.forEach((netif) => {
			let seq = (this._sequence + 1) % 255;     // message sequence number
			this._sequence = seq;
			// Create a request packet
			const packet = mComposer.compose({
				type: 2,
				payload: null,
				sequence: seq,
				ack_required: false,
				res_required: false,
				target: '00:00:00:00:00:00',
				source: this._source_id,
				tagged: true
			});
			this._requests[seq] = (res: udpParsed) => {	// When we get a response add/update teh address
				let ip = res.address;
				if (!devices[ip]) devices[ip] = res;
			};
			const req = { seq: seq, address: (<any>netif)['broadcast'], buffer: packet }
			req_list.push(req);	// Record it
			// this._sendBroadcast(req);
		});

		await this._sendBroadcast(req_list);
		await delayms(wait);		// Wait to see that the cats drag in?
		const deviceArray: udpParsed[] = [];
		for (let ip in devices) deviceArray.push(devices[ip]);
		return deviceArray;
	};

	private async _sendBroadcast(req_list: udpDiscover[]) {
		this._udp.setBroadcast(true);
		req_list.forEach(req => {
			this._udp.send(req.buffer, 0, req.buffer.length, this._UDP_PORT, req.address);
			delayms(10);	// Why delays?
		});
	};
}

export const mLifxUdp = new LifxLanUdp();
export default mLifxUdp;
