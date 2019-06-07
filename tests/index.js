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
async function TryDev(di) {
    try {
        if (typeof di == "string") {
            if (!devs)
                devs = await lants_1.Lifx.discover(); // var for debugging
            let dname = di.toLowerCase();
            var dev = devs.filter(d => d.deviceInfo && d.deviceInfo.label && d.deviceInfo.label.toLowerCase().startsWith(dname))[0]; // Assume success
            if (!dev) {
                console.error(`Did not find ${di}`);
                debugger;
                return;
            }
            ToggleDev(dev, di);
            return;
        }
        msg(`TryDev(${di.Name})`);
        const aux = di.Adr.Aux;
        msg(`${di.Name} creating device`);
        const cdev = await lants_1.Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
        msg(`${di.Name} created  device`);
        ToggleDev(cdev, di.Name);
    }
    catch (e) {
        debugger;
    }
}
async function Turner(dev, name, level) {
    try {
        await dev.lightSetPower({ level: level });
    }
    catch (e) {
        if (e.message != "Timeout")
            throw e;
        await lz.delayms(250); // Breather?
        await dev.lightSetPower({ level: level });
    }
    await lz.delayms(250);
    let result = await dev.lightGetPower();
    if (result.level != level) {
        msg(`${name} Asked for level ${level} but got ${result.level}`);
    }
}
async function ToggleDev(dev, name) {
    try {
        for (let attempt = 0; attempt < 20; attempt++) {
            try {
                msg(`${name} Attempt# ${attempt}`);
                await Turner(dev, name, 1);
                await lz.delayms(wait);
                await Turner(dev, name, 0);
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
    let ucount = 0;
    lz.Lifx.AddUDPHandler((a, p) => {
        if (++ucount > 10)
            return;
        msg(`#${ucount} [${a.address}:${a.port}] ${JSON.stringify(p.payload)}`);
    });
    // TryDev("testbeam");
    TryDev(devices.devices["officeclosetlamp"]);
    TryDev(devices.devices["tiles"]);
    await lz.delayms(250);
    // TryDev(devices.devices["testbeam"])
}
tests();
//# sourceMappingURL=index.js.map