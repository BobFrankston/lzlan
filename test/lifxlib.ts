import * as path from 'path';
import * as fs from 'fs';
const jspc = require('json-stringify-pretty-compact');
import Lifx from '../src/lants';
import { LifxLanDevice } from "../src/lants-device";

// const Lifx: LifxLan = require('node-lifx-lan'); // https://www.npmjs.com/package/node-lifx-lan
// https://github.com/futomi/node-lifx-lan
export const delaySeconds = (seconds: number) => new Promise(resolve => setTimeout(resolve, seconds * 1000));

type Integer = number;      // Should rename to named types at some point
type Duration = number;     // milliseconds integer
type Float = number;        // Typically 0.0 to 1.0

const devicesPath = path.join(__dirname.split(/\\lib/)[0], "devices.json"); // hack

export function msg(txt: string) {
    console.log(`${new Date().toLocaleString()} ${txt}`);
}

export function err(txt: string, e: Error) {
    console.error(`${new Date().toLocaleString()} ${txt}: ${e}\n${e.stack}`);
}

let devices: LifxLanDevice[] = null;
let gettingDevices = false;
export async function assureDevices() {
    if (devices) return;
    if (gettingDevices) return;
    try {
        if (fs.existsSync(devicesPath)) {
            msg(`Reading from ${devicesPath}`);
            const dj = fs.readFileSync(devicesPath, "utf8");
            devices = [];   // Allocate
            const xdevices: LifxLanDevice[] = JSON.parse(dj);
            for (var xn in xdevices) {
                const d = xdevices[xn];
                let nd = await Lifx.createDevice(d);
                nd.deviceInfo = d.deviceInfo;
                devices[xn] = nd
            };

            msg(`Read ${devicesPath}`);
            WriteDevices();
            await getMoreDevices();   // Look but don't wait!
            return;
        }
        msg(`Getting initial devices`);
        await getMoreDevices();   // look for and update
    }
    catch (e) {
        err(`Error getting devices`, e)
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

function addDevice(adevice: LifxLanDevice) {
    for (var dn in devices) {
        const device = devices[dn];
        if (device.mac != adevice.mac) continue;
        // Replacement
        devices[dn] = adevice;
        return false;   // Not new
    }
    msg(`Added ${adevice.deviceInfo.label}`);
    devices.push(adevice);
    return true;    // New
}

let gettingMoreDevices = false;
async function getMoreDevices() {
    if (gettingMoreDevices) return; // Huh?
    try {
        gettingMoreDevices = true;
        msg(`Getting more devices`);
        const start = new Date().getTime();

        const moreDevices: LifxLanDevice[] = await Lifx.discover();
        const took = ((new Date().getTime() - start) / 1000).toFixed(3);
        msg(`Got ${moreDevices.length.toString().padStart(3)} devices in ${took} seconds`)
        if (!devices) devices = []; // Safety
        let added = 0;
        moreDevices.forEach(mdevice => {
            if (addDevice(mdevice)) added++;
        });
        devices.sort((a, b) => {
            if (!a.deviceInfo) {
                return b.deviceInfo ? 1 : 0;
            }
            else
                if (!b.deviceInfo) return 1;
            const na = a.deviceInfo.label.toLowerCase();
            const nb = b.deviceInfo.label.toLowerCase();
            if (na == nb) return 0;
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
        msg(`Finished gettingMoreDevices`)
        gettingMoreDevices = false
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
                // WiFi: d.deviceInfo && d.deviceInfo.WiFiVersion ? d.deviceInfo.WiFiVersion.toString(16) : null
            }
        }
    }); // Reduced version with the essential info.
    fs.writeFileSync(devicesPath, jspc(devicesx), "utf8");   // Update the cache
    msg(`Saved ${devicesx.length} devices`);
}

async function listDevices() {
    if (!devices)
        await assureDevices()
    devices.forEach((device, i) => msg(`${i.toString().padStart(3)} ${device.ip.padEnd(17)}${device.mac} ${device.deviceInfo.label}`));
}

// For now we need both the MAC and the IP address
export async function createDevice(mac: string, ip: string) {
    let ldev: LifxLanDevice = null;
    try {
        if (mac.includes(":")) mac = mac.match(/..:?/g).join(":").replace(/::/g, ":").toUpperCase(); // Normalize
        const lds = devices.filter(d => d.mac == mac);
        if (lds.length == 1) return lds[0];
        ldev = await Lifx.createDevice({ mac: mac, ip: ip });
        ldev.deviceInfo = await ldev.getDeviceInfo();
        if (addDevice(ldev))
            msg(`Added ${ldev.deviceInfo.label}`);
    }
    catch (e) {
        err('createDevice(${mac},${ip})', e)
    }
}

export async function findDevice(name: string) {
    await assureDevices();

    // How do we 
    // Assume label starts with or contains the name
    name = name.toLowerCase();
    // First search for an exact match
    const dlabel = (d:LifxLanDevice) => d.deviceInfo && d.deviceInfo.label ? d.deviceInfo.label.toLowerCase() : null;
    let ds = devices.filter(d => dlabel(d) !=null && dlabel(d) == name);
    if (ds.length != 1) ds = devices.filter(d => dlabel(d) !=null && dlabel(d).startsWith(name));
    if (ds.length != 1) ds = devices.filter(d => dlabel(d) !=null && dlabel(d).includes(name));
    // Force error
    // if (ds.length != 1) throw new Error(ds.length == 0 ? `Didn't find ${name}` : `Found ${ds.length} matches for ${name}`);
    return ds.length == 1 ? ds[0] : null;
}

