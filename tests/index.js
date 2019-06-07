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
var wait = 500; // Ms
function msg(text) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`);
}
async function ToggleDev(dname) {
    try {
        // const Lifx = new LifxLan();
        var devs = await lants_1.Lifx.discover(); // var for debugging
        var dev = devs.filter(d => d.deviceInfo && d.deviceInfo.label.toLowerCase().startsWith(dname))[0]; // Assume success
        xdev = dev;
        if (dev == null) {
            console.error(`Did not find ${dname}`);
            return;
        }
        for (let attempt = 0; attempt < 2; attempt++) {
            await dev.turnOn();
            await lz.delayms(wait);
            await dev.turnOff();
            await lz.delayms(wait);
        }
        // await TryDev(devices.devices["officeclosetlamp"])
    }
    catch (e) {
        console.error(`Turning on ${dname}`);
        console.dir(e);
        debugger;
    }
}
const devpath = "y:\\x\\Home Control\\Data\\Devices.json";
class laux {
}
;
async function TryDev(dev) {
    try {
        msg(`TryDev(${dev.Name})`);
        const aux = dev.Adr.Aux;
        msg(`${dev.Name} creating device`);
        const cdev = await lants_1.Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
        msg(`${dev.Name} created  device`);
        for (let attempt = 0; attempt < 100; attempt++) {
            try {
                msg(`${dev.Name} Turning on`);
                await cdev.turnOn();
                msg(`${dev.Name} ON`);
                await lz.delayms(wait);
                await cdev.turnOff();
                msg(`${dev.Name} OFF`);
                await lz.delayms(wait);
            }
            catch (e) {
                console.error(`${dev.Name} ${aux.IP4} ${e.message}`);
            }
        }
    }
    catch (e) {
        debugger;
    }
}
async function tests() {
    await ToggleDev("testbeam");
    // await TryDev(devices.devices["officeclosetlamp"]);
    TryDev(devices.devices["tiles"]);
    await lz.delayms(250);
    TryDev(devices.devices["testbeam"]);
}
tests();
//# sourceMappingURL=index.js.map