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
const lants_1 = require("../lib/lants");
const lz = __importStar(require("../lib/lants"));
const devices = __importStar(require("y:/x/Home Control/Data/Devices"));
var xdev;
var wait = 250; // Ms
function msg(text) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`);
}
const devpath = "y:\\x\\Home Control\\Data\\Devices.json";
class laux {
}
;
let devs = null;
async function GetDev(di) {
    try {
        if (typeof di == "string") {
            if (!devs)
                devs = await lants_1.Lifx.discover(); // var for debugging
            let dname = di.toLowerCase();
            var dev = devs.filter(d => d.deviceInfo && d.deviceInfo.label && d.deviceInfo.label.toLowerCase().startsWith(dname))[0]; // Assume success
            if (!dev) {
                console.error(`Did not find ${di}`);
                debugger;
                return null;
            }
            return dev;
        }
        const aux = di.Adr.Aux;
        return await lants_1.Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
    }
    catch (e) {
        debugger;
    }
}
async function TryDev(di) {
    try {
        var dev = await GetDev(di);
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
            let color = {
                css: "white",
                brightness: level
            };
            //  css: string,             // Conditional CSS color ("red", "#ff0000", or "rgb(255, 0, 0)")
            // brightness?: number,      // Optional Brightness in the range of 0.0 to 1.0.
            // kelvin?: number,          // Color temperature (°) in the range of 1500 to 9000.
            await dev.lightSetPower({ level: level > 0 ? 1 : 0 });
            if (level > 0)
                await dev.setColor({ color: color, duration: 0 });
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
        debugger;
        throw e;
    }
}
async function ToggleDev(dev) {
    try {
        let name = dev.deviceInfo ? dev.deviceInfo.label : dev.ip;
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                msg(`${name} Attempt# ${attempt}`);
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
async function tests() {
    try {
        let ucount = 0;
        lz.Lifx.AddUDPHandler((a, p) => {
            if (++ucount > 1)
                return;
            msg(`#${ucount} [${a.address}:${a.port}] ${JSON.stringify(p.payload)}`);
        });
        // TryDev("testbeam");
        // TryDev(devices.devices["officeclosetlamp"]);
        // TryDev(devices.devices["tiles"]);
        Leveler(await GetDev(devices.devices["OfficeTrack1"]));
        await lz.delayms(250);
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