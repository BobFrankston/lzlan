"use strict";
// Note -- bug fixed for CIDR       "cidr":"172.29.239.177/28",      "broadcast":"172.29.239.191"
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const lants_parser_1 = require("./lants-parser");
const lants_1 = require("./lants");
const mDgram = __importStar(require("dgram"));
// const mDgram = require('dgram');
const Composer = __importStar(require("./lants-composer"));
const mComposer = new Composer.LifxLanComposer();
const la = __importStar(require("./lants-address"));
const lants_device_1 = require("./lants-device");
const mAddress = new la.LifxLanAddress();
;
// Need to update for 
// 
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
        this.UDPHandlers = [];
        if (LifxLanUdp.created)
            throw new Error("Attempting to create second LifxLanUDP");
        LifxLanUdp.created = true;
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
        // debugger;
        if (this.initPromise) {
            // await this.initPromise;
            // return;
            return this.initPromise;
        }
        if (this.initialized)
            return; // No need to wait
        if (this.initializing) { // Attempt to deal with an edge case that should never occure
            console.error(`How did we get to initializing ${new Error().stack}`);
            debugger;
            return;
        }
        this.initializing = true;
        this.initPromise = new Promise((resolve, reject) => {
            if (this._udp)
                debugger; // Should never get here
            this._source_id = Math.floor(Math.random() * 0xffffffff);
            let netif_list = mAddress.getNetworkInterfaces();
            if (!netif_list || netif_list.length === 0) {
                reject(new Error('No available network interface was found.'));
                return;
            }
            this._netif_list = netif_list;
            // Set up a UDP tranceiver
            // this._udp = mDgram.createSocket({ type: 'udp4', reuseAddr: true });
            this._udp = mDgram.createSocket({ type: 'udp4' }); // Reuse isn't working well - messages go to the "wrong" listenr
            this._udp.on('error', (error) => {
                this.initPromise = null;
                reject(error);
            });
            this._udp.once('listening', () => {
                this.initPromise = null;
                this.initialized = true;
                resolve();
            });
            this._udp.on('message', (buf, rinfo) => { this._receivePacket(buf, rinfo); });
            this._udp.bind({ port: this._UDP_PORT });
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
        else {
            try {
                const pay = parsed.payload; // QUick hack
                let name = pay && pay.label;
                if (!name) {
                    if (this.device_list_hack && this.device_list_hack[parsed.address])
                        name = this.device_list_hack[parsed.address].deviceInfo.label;
                    else
                        name = parsed.address;
                }
                if (this.UDPHandlers.length) {
                    this.UDPHandlers.forEach(uh => uh && uh(rinfo, parsed)); // Allow use of a null entry to suppress default
                    return;
                }
                name = name.split(' ')[0];
                // Hack
                if (name == "My")
                    name += ' ' + parsed.address;
                const type = lants_parser_1.lifxMsgType[parsed.header.type] || parsed.header.type.toString();
                const id = parsed.header.target.split(':').slice(3, 3 + 3).join('');
                console.log(`${new Date().toLocaleTimeString()} ${id} ${name.padEnd(18)} ${type} ${JSON.stringify(parsed.payload)}`);
                // https://community.lifx.com/t/why-are-some-bulbs-chatty/4777/3
            }
            catch (e) {
                console.error(`_receivePacket ${e}`);
            }
        }
    }
    ;
    _isNetworkInterfaceAddress(addr) {
        return this._netif_list.some(netif => netif.address == addr);
        // 	for (let i = 0; i < this._netif_list.length; i++) {
        // 		let netif = this._netif_list[i];
        // 		if (netif.address === addr)
        // 			return true;
        // 	}
        // 	return false;
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
LifxLanUdp.created = false;
exports.LifxLanUdp = LifxLanUdp;
exports.mLifxUdp = new LifxLanUdp();
exports.default = exports.mLifxUdp;
//# sourceMappingURL=lants-udp.js.map