"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const jspc = require('json-stringify-pretty-compact');
const lants_1 = __importDefault(require("../src/lants"));
// const Lifx: LifxLan = require('node-lifx-lan'); // https://www.npmjs.com/package/node-lifx-lan
// https://github.com/futomi/node-lifx-lan
exports.delaySeconds = (seconds) => new Promise(resolve => setTimeout(resolve, seconds * 1000));
const devicesPath = path.join(__dirname.split(/\\lib/)[0], "devices.json"); // hack
function msg(txt) {
    console.log(`${new Date().toLocaleString()} ${txt}`);
}
exports.msg = msg;
function err(txt, e) {
    console.error(`${new Date().toLocaleString()} ${txt}: ${e}\n${e.stack}`);
}
exports.err = err;
let devices = null;
let gettingDevices = false;
async function assureDevices() {
    if (devices)
        return;
    if (gettingDevices)
        return;
    try {
        if (fs.existsSync(devicesPath)) {
            msg(`Reading from ${devicesPath}`);
            const dj = fs.readFileSync(devicesPath, "utf8");
            devices = []; // Allocate
            const xdevices = JSON.parse(dj);
            for (var xn in xdevices) {
                const d = xdevices[xn];
                let nd = await lants_1.default.createDevice(d);
                nd.deviceInfo = d.deviceInfo;
                devices[xn] = nd;
            }
            ;
            msg(`Read ${devicesPath}`);
            WriteDevices();
            await getMoreDevices(); // Look but don't wait!
            return;
        }
        msg(`Getting initial devices`);
        await getMoreDevices(); // look for and update
    }
    catch (e) {
        err(`Error getting devices`, e);
    }
    finally {
        msg(`finished getDevices (${devices.length} devices)`);
        gettingDevices = false;
        setInterval(() => {
            msg(`Calling getMoreDevices in setInterval`);
            getMoreDevices();
        }, 5 * 60 * 1000);
    }
}
exports.assureDevices = assureDevices;
function addDevice(adevice) {
    for (var dn in devices) {
        const device = devices[dn];
        if (device.mac != adevice.mac)
            continue;
        // Replacement
        devices[dn] = adevice;
        return false; // Not new
    }
    msg(`Added ${adevice.deviceInfo.label}`);
    devices.push(adevice);
    return true; // New
}
let gettingMoreDevices = false;
async function getMoreDevices() {
    if (gettingMoreDevices)
        return; // Huh?
    try {
        gettingMoreDevices = true;
        msg(`Getting more devices`);
        const start = new Date().getTime();
        const moreDevices = await lants_1.default.discover();
        const took = ((new Date().getTime() - start) / 1000).toFixed(3);
        msg(`Got ${moreDevices.length.toString().padStart(3)} devices in ${took} seconds`);
        if (!devices)
            devices = []; // Safety
        let added = 0;
        moreDevices.forEach(mdevice => {
            if (addDevice(mdevice))
                added++;
        });
        devices.sort((a, b) => {
            if (!a.deviceInfo) {
                return b.deviceInfo ? 1 : 0;
            }
            else if (!b.deviceInfo)
                return 1;
            const na = a.deviceInfo.label.toLowerCase();
            const nb = b.deviceInfo.label.toLowerCase();
            if (na == nb)
                return 0;
            return na < nb ? -1 : 1;
        });
        // Make a deep copy using a quick kludge
        msg(`getMoredevices: found ${added} new ones, total = ${devices.length}`);
        WriteDevices();
        return devices; // For convenience
    }
    catch (e) {
        err(`getMoreDevices`, e);
        throw e;
    }
    finally {
        msg(`Finished gettingMoreDevices`);
        gettingMoreDevices = false;
    }
}
function WriteDevices() {
    const devicesx = devices.map(d => {
        return {
            mac: d.mac,
            ip: d.ip,
            deviceInfo: d.deviceInfo,
            extras: {
                firmware: d.deviceInfo && d.deviceInfo.firmwareVersion ? d.deviceInfo.firmwareVersion.toString(16) : null,
            }
        };
    }); // Reduced version with the essential info.
    fs.writeFileSync(devicesPath, jspc(devicesx), "utf8"); // Update the cache
    msg(`Saved ${devicesx.length} devices`);
}
async function listDevices() {
    if (!devices)
        await assureDevices();
    devices.forEach((device, i) => msg(`${i.toString().padStart(3)} ${device.ip.padEnd(17)}${device.mac} ${device.deviceInfo.label}`));
}
// For now we need both the MAC and the IP address
async function createDevice(mac, ip) {
    let ldev = null;
    try {
        if (mac.includes(":"))
            mac = mac.match(/..:?/g).join(":").replace(/::/g, ":").toUpperCase(); // Normalize
        const lds = devices.filter(d => d.mac == mac);
        if (lds.length == 1)
            return lds[0];
        ldev = await lants_1.default.createDevice({ mac: mac, ip: ip });
        ldev.deviceInfo = await ldev.getDeviceInfo();
        if (addDevice(ldev))
            msg(`Added ${ldev.deviceInfo.label}`);
    }
    catch (e) {
        err('createDevice(${mac},${ip})', e);
    }
}
exports.createDevice = createDevice;
async function findDevice(name) {
    await assureDevices();
    // How do we 
    // Assume label starts with or contains the name
    name = name.toLowerCase();
    // First search for an exact match
    const dlabel = (d) => d.deviceInfo && d.deviceInfo.label ? d.deviceInfo.label.toLowerCase() : null;
    let ds = devices.filter(d => dlabel(d) != null && dlabel(d) == name);
    if (ds.length != 1)
        ds = devices.filter(d => dlabel(d) != null && dlabel(d).startsWith(name));
    if (ds.length != 1)
        ds = devices.filter(d => dlabel(d) != null && dlabel(d).includes(name));
    // Force error
    // if (ds.length != 1) throw new Error(ds.length == 0 ? `Didn't find ${name}` : `Found ${ds.length} matches for ${name}`);
    return ds.length == 1 ? ds[0] : null;
}
exports.findDevice = findDevice;
//# sourceMappingURL=lifxlib.js.map