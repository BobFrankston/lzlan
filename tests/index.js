"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// import * as lz from "@bobfrankston/lzlan"
// import { LifxLan } from "../lib/lants";
const Lifx = __importStar(require("../lib/lants"));
const lz = __importStar(require("../lib/lants"));
const devices = __importStar(require("y:/x/Home Control/Data/Devices"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
let xdev;
let wait = 250; // Ms
let attempts = 15;
let noLevel = true;
function msg(text) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`);
}
const homeData = "y:/x/home control/data";
// const devpath = "y:\\x\\Home Control\\Data\\Devices.json";
class laux {
}
;
// let devs: lz.LifxLanDevice[] = null;
let devsByMAC = {};
let devsByName = {};
let ubntInfo = [];
function getUBNT() {
    try {
        const ub = fs.readFileSync(path.join(homeData, "ubnt.json"), "utf8");
        ubntInfo = JSON.parse(ub);
    }
    catch (e) {
        debugger;
    }
}
getUBNT();
function addDevs(devs) {
    msg(`Adding up to ${devs.length}`);
    devs.forEach(dv => {
        const dip = devsByMAC[dv.mac];
        if (dip) {
            if (dip.ip == dv.ip)
                return; // Already have it so don't worry
            console.log(`${dip.mac} IP changed form ${dip.ip} to ${dv.ip}`);
        }
        else
            console.log(`${dv.mac} Found ${dv.ip.padEnd(16)} ${dv.deviceInfo ? dv.deviceInfo.label : "No info"}`);
        if (!dv.deviceInfo)
            return; // NO name
        if (!dv.deviceInfo.label) {
            for (var dn in devices.devices) {
                const dev = devices.devices[dn];
                if (!dev || !dev.Adr || !dev.Adr.Aux)
                    continue;
                if (dev.Adr.Aux.IP4 != dv.ip)
                    continue;
                console.log(`Found ${dv.ip} but not it's label (${dev.Name})`);
                return;
            }
            console.log(`Found ${dv.mac} ${dv.ip} but no properties`);
            return;
        }
        const name = dv.deviceInfo.label.split(' ')[0].toLowerCase();
        devsByName[name] = dv;
        devsByMAC[dv.mac] = dv;
    });
    let count = 0;
    // devsByip.forEach(dv => count++);
    for (const dv in devsByName)
        count++;
    fs.writeFileSync(path.join(__dirname, "lifx.json"), JSON.stringify(devsByMAC, null, 4), "utf8");
    msg(`Have ${count} devices`);
}
let discovering = false;
async function discoverer() {
    if (discovering)
        return; // Prevent tripping over oruselves
    try {
        console.log("Discovering");
        discovering = true;
        addDevs(await Lifx.discover());
    }
    catch (e) {
        console.error(`Discoverer ${e.message}`);
    }
    finally {
        discovering = false;
    }
}
async function GetDev(di, comment) {
    if (util_1.isUndefined(di))
        throw new Error(`Device is undefined`);
    try {
        if (typeof di == "string") {
            const dname = di.toLowerCase();
            let dev = null;
            for (var tri = 0; tri < 3; tri++) {
                if (dev = devsByName[dname])
                    break; // Have
                msg(`Searching for devices try ${tri} [${comment}]`);
                addDevs(await Lifx.discover()); // var for debugging
                msg(`Searched  for devices try ${tri} [${comment}]`);
            }
            // dev = devsByName[dname];
            if (!dev) {
                msg(`Did not find ${di} [${comment}]`);
                debugger;
            }
            msg(`Found ${di} as ${dev.ip} [${comment}]`);
            return dev;
        }
        const aux = di.Adr.Aux;
        let dev = await Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
        if (!dev.deviceInfo)
            dev.deviceInfo = await dev.getDeviceInfo();
        return dev;
    }
    catch (e) {
        debugger;
    }
}
async function TryDev(di, comment) {
    try {
        var dev = await GetDev(di, comment);
        if (dev)
            ToggleDev(dev);
    }
    catch (e) {
        debugger;
    }
}
async function Turner(dev, level) {
    try {
        try {
            if (!dev)
                return;
            //  css: string,             // Conditional CSS color ("red", "#ff0000", or "rgb(255, 0, 0)")
            // brightness?: number,      // Optional Brightness in the range of 0.0 to 1.0.
            // kelvin?: number,          // Color temperature (°) in the range of 1500 to 9000.
            await dev.lightSetPower({ level: level > 0 ? 1 : 0 });
            if (level > 0 && !noLevel) {
                let color = {
                    css: "white",
                    brightness: level
                };
                await dev.setColor({ color: color, duration: 0 });
            }
        }
        catch (e) {
            if (e.message != "Timeout")
                throw e;
            await lz.delayms(250); // Breather?
            // await dev.lightSetPower({ level: level });
        }
        await lz.delayms(250);
        // let result = await dev.lightGetPower();
        // let results = await dev.getLightState();
        let result = await dev.lightGet();
        let brightness = result.power ? result.color.brightness : 0;
        if (Math.abs(brightness - level) > .1) {
            msg(`${dev.ip} Asked for level ${level} but got ${brightness}`);
        }
    }
    catch (e) {
        console.error(`Turner(${dev.ip}) ${e.message}`);
        // debugger;
        throw e;
    }
}
async function ToggleDev(dev) {
    try {
        let name = dev.deviceInfo ? dev.deviceInfo.label : dev.ip;
        for (let attempt = 0; attempt < attempts; attempt++) {
            try {
                // msg(`${name} Attempt# ${attempt}`);
                await Turner(dev, 1);
                await lz.delayms(wait);
                await Turner(dev, 0);
                await lz.delayms(wait);
            }
            catch (e) {
                console.error(`${name} ${e.message}`);
            }
        }
    }
    catch (e) {
        debugger;
    }
}
async function Leveler(dev) {
    try {
        let name = dev.deviceInfo ? dev.deviceInfo.label : dev.ip;
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                msg(`${name} Attempt# ${attempt}`);
                await Turner(dev, .3);
                await lz.delayms(wait);
                await Turner(dev, .1);
                await lz.delayms(wait);
                await Turner(dev, 0);
                await lz.delayms(wait);
            }
            catch (e) {
                console.error(`${name} ${e.message}`);
            }
        }
    }
    catch (e) {
        debugger;
    }
}
async function candy(di, comment) {
    try {
        let dev = await GetDev(di, "Candy");
        var name = dev.deviceInfo ? dev.deviceInfo.label : "Whatever";
        const tb = await GetDev(name, "Candy");
        if (!tb) {
            msg(`Didn't find ${name}`);
            return;
        }
        // const di = await tb.getDeviceInfo();
        msg(`Candy(${name})`);
        const zinfo = await tb.multiZoneGetColorZones({ start: 0, end: 255 });
        await tb.turnOff();
        await Lifx.delayms(3 * 1000);
        await tb.turnOn();
        // const zones = 20;   // How many
        const zcount = zinfo.count; // How many on the device
        const rand = Math.floor(Math.random() * 3);
        const width = Math.floor(Math.random() * 4) + 1;
        for (var zn = 0; zn < zcount / width; zn++) {
            const zone = zn * width;
            const red = 255 / zone;
            let cc = {
                red: zn % 3 == (rand + 0) % 3 ? .5 : 0,
                blue: zn % 3 == (rand + 1) % 3 ? .5 : 0,
                green: zn % 3 == (rand + 2) % 3 ? .5 : 0
            };
            // if (zone == 0)
            //     cc = { red: 0, blue: 0, green: 1 }
            // else if (zone == 50)
            //     cc = { red: 0, blue: 1, green: 0 }
            // const cn = (zn + rand) % colors.colors.length
            // const cc = colors.colors[cn];
            try {
                await Lifx.delayms(100);
                await tb.multiZoneSetColorZones({ start: zone, end: zone + width, color: cc });
            }
            catch (e) {
                if (e.message = "Timeout") {
                    console.log(`Zone ${name}.${zone} ${JSON.stringify(cc)} (${e}) retruing`);
                    try {
                        await tb.multiZoneSetColorZones({ start: zone, end: zone + width, color: cc });
                    }
                    catch (e) {
                        console.error(`Zone ${name}.${zone} ${JSON.stringify(cc)} (${e}) AGAIN`);
                    }
                }
                else
                    console.error(`Zone ${name}.${zone} ${JSON.stringify(cc)} (${e})`);
                // break;  // Once we get a timeout we are done
            }
        }
        // await tb.multiZoneSetColorZones({ start: 39, end: 39, color: { green: 0, blue: 1, red: 1 } });
        // await delay(.1);
        try {
            await tb.multiZoneSetColorZones({ start: 40, end: 40, color: { green: 1, blue: 0, red: 0 } });
        }
        catch (e) {
            console.error(`Zone ${name}.corner (${e})`);
        }
        // await delay(.1);
        // await tb.multiZoneSetColorZones({ start: 41, end: 41, color: { green: 0, blue: 0, red: 1 } });
        // await delay(.1);
    }
    catch (e) {
        console.error(`candy ${name}`, e);
    }
}
async function tests() {
    try {
        discoverer();
        setInterval(discoverer, 30 * 1000);
        // let ucount = 0;
        // lz.Lifx.AddUDPHandler((a, p) => {
        //     if (++ucount > 1) return;
        //     msg(`#${ucount} [${a.address}:${a.port}] ${JSON.stringify(p.payload)}`);
        // })
        // let testBeam = devices.devices["testbeam"];
        // candy(testBeam);
        // TryDev(testBeam, "TryDev");
        //TryDev(devices.devices["officeclosetlamp"]);
        // TryDev(devices.devices["tiles"]);
        // Leveler(await GetDev(devices.devices["OfficeTrack1"]));
        // await lz.delayms(250);
        // TryDev(devices.devices["testbeam"])
    }
    catch (e) {
        console.error(`${e.message}`);
        console.error(`  ${e.stack}`);
        debugger;
    }
}
tests();
//# sourceMappingURL=index.js.map