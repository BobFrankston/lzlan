"use strict";
// Note -- bug fixed for CIDR       "cidr":"172.29.239.177/28",      "broadcast":"172.29.239.191"
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
exports.LifxLanUdp = void 0;
const lants_parser_1 = require("./lants-parser");
const lants_1 = require("./lants");
const lants_address_1 = require("./lants-address");
const mDgram = __importStar(require("dgram"));
const Composer = __importStar(require("./lants-composer"));
const mComposer = new Composer.LifxLanComposer();
const lants_device_1 = require("./lants-device");
;
class LifxLanUdp {
    constructor() {
        // Private
        this._UDP_PORT = 56700;
        this._udp = null;
        this._requests = {};
        this._sequence = 0;
        this._timeout = 3000; // msec
        this._source_id = 0;
        this._netif_list = null;
        this.initPromise = null;
        this.initialized = false;
        this.initializing = false; // Attempt to deal with an edge case
    }
    static async GetUDP() {
        const llu = new LifxLanUdp();
        await llu.init();
        return llu;
    }
    /* ------------------------------------------------------------------
    * Method: destroy()
    * ---------------------------------------------------------------- */
    async destroy() {
        await this._udp.close();
        this._udp.unref();
        this._udp = null;
    }
    ;
    /**
      * Initialize instance. Should only be called once
      */
    async init() {
        this.initPromise = new Promise((resolve, reject) => {
            this._source_id = Math.floor(Math.random() * 0xffffffff);
            let netif_list = lants_address_1.getNetworkInterfaces();
            if (!netif_list || netif_list.length === 0) {
                reject(new Error('No available network interface was found.'));
                return;
            }
            this._netif_list = netif_list;
            // Set up a UDP tranceiver
            // this._udp = mDgram.createSocket({ type: 'udp4', reuseAddr: true });
            this._udp = mDgram.createSocket({ type: 'udp4' }); // , reuseAddr: true });	// Not sure about reuse
            this._udp.on('error', (error) => {
                reject(error);
            });
            this._udp.once('listening', () => {
                resolve();
            });
            this._udp.on('message', (buf, rinfo) => { this._receivePacket(buf, rinfo); });
            // this._udp.bind({ port: this._UDP_PORT });
            this._udp.bind();
        });
        this.initializing = false; // We now have the promise object
        return this.initPromise;
    }
    ;
    async request(params) {
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
    }
    ;
    // private _requestUnicast(p: { [key: string]: UdpParams}) {
    async _requestUnicast(p) {
        let promise = new Promise((resolve, reject) => {
            // message sequence number
            let seq = (this._sequence + 1) % 255;
            this._sequence = seq;
            // Timer
            let timer = null;
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
                this._requests[seq] = (res) => {
                    delete this._requests[seq];
                    if (timer)
                        clearTimeout(timer);
                    resolve(res);
                };
            }
            // Send a packet
            this._udp.setBroadcast(false);
            let buf = packet; // .buffer;
            this._udp.send(buf, 0, buf.length, this._UDP_PORT, p.address, (error) => {
                if (error) {
                    delete this._requests[seq];
                    if (timer) {
                        clearTimeout(timer);
                    }
                    reject(error);
                }
                else {
                    if (!p.ack_required && !p.res_required) {
                        resolve();
                    }
                }
            });
        });
        return promise;
    }
    ;
    async _requestBroadcast(p) {
        let req_list = [];
        this._netif_list.forEach((netif) => {
            let seq = (this._sequence + 1) % 255; // message sequence number
            this._sequence = seq;
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
            req_list.push({ seq: seq, address: netif['broadcast'], buffer: packet });
        });
        await this._sendBroadcast(req_list);
    }
    ;
    _receivePacket(buf, rinfo) {
        if (this._isNetworkInterfaceAddress(rinfo.address))
            return; // Ignore echoes from myself
        let parsed = lants_parser_1.mParser.parse(buf);
        if (!parsed)
            return;
        parsed.address = rinfo.address;
        let seq = parsed.header.sequence;
        let callback = this._requests[seq];
        if (callback) {
            callback(parsed);
        }
        // We now ignore unsolicited packets
        // else {
        // 	try {
        // 		const pay: any = parsed.payload;	 // QUick hack
        // 		let name = pay && pay.label;
        // 		if (!name) {
        // 			if (this.device_list_hack && this.device_list_hack[parsed.address])
        // 				name = this.device_list_hack[parsed.address].deviceInfo.label;
        // 			else
        // 				name = parsed.address;
        // 		}
        // 		name = name.split(' ')[0];
        // 		// Hack
        // 		if (name == "My") name += ' ' + parsed.address;
        // 		const type = lifxMsgType[parsed.header.type] || parsed.header.type.toString();
        // 		const id = parsed.header.target.split(':').slice(3, 3 + 3).join('');
        // 		console.log(`${new Date().toLocaleTimeString()} ${id} ${name.padEnd(18)} ${type} ${JSON.stringify(parsed.payload)}`);
        // 		// https://community.lifx.com/t/why-are-some-bulbs-chatty/4777/3
        // 	}
        // 	catch (e) {
        // 		console.error(`_receivePacket ${e}`);
        // 	}
        // }
    }
    ;
    // device_list_hack: { [ip: string]: LifxLanDevice };	// So we can report heard
    _isNetworkInterfaceAddress(addr) {
        return this._netif_list.some(netif => netif.address == addr);
    }
    ;
    async discover(params) {
        params = lants_device_1.passure(params);
        const wait = params.wait || 3000;
        const req_list = [];
        const devices = {};
        this._netif_list.forEach((netif) => {
            let seq = (this._sequence + 1) % 255; // message sequence number
            this._sequence = seq;
            // Create a request packet
            const packet = mComposer.compose({
                type: lants_parser_1.lifxMsgType.GetService,
                payload: null,
                sequence: seq,
                ack_required: false,
                res_required: false,
                target: '00:00:00:00:00:00',
                source: this._source_id,
                tagged: true
            });
            this._requests[seq] = (res) => {
                let ip = res.address;
                // console.log(`${res.header.type} ${res.address}:${(<any>res.payload).port}`);
                if (!devices[ip])
                    devices[ip] = res;
            };
            const req = { seq: seq, address: netif['broadcast'], buffer: packet };
            req_list.push(req); // Record it
            // this._sendBroadcast(req);
        });
        await this._sendBroadcast(req_list);
        await lants_1.delayms(wait * 4); // Wait to see that the cats drag in?
        const deviceArray = [];
        for (let ip in devices)
            deviceArray.push(devices[ip]);
        return deviceArray;
    }
    ;
    async _sendBroadcast(req_list) {
        this._udp.setBroadcast(true);
        req_list.forEach(req => {
            this._udp.send(req.buffer, 0, req.buffer.length, this._UDP_PORT, req.address);
            lants_1.delayms(10); // Why delays?
        });
    }
    ;
}
exports.LifxLanUdp = LifxLanUdp;
//# sourceMappingURL=lants-udp.js.map