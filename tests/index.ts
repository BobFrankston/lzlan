// import * as lz from "@bobfrankston/lzlan"
// import { LifxLan } from "../lib/lants";
import { Lifx } from "../lib/lants";
import * as lz from "../lib/lants";
import * as devices from "y:/x/Home Control/Data/Devices";
import * as fs from 'fs';
import { lifxMsgType } from "../lib/lants-parser";

var xdev: lz.LifxLanDevice;
var wait = 500; // Ms
function msg(text:string) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`)
}

async function ToggleDev(dname: string) {
    try {
        // const Lifx = new LifxLan();
        var devs = await Lifx.discover();   // var for debugging
        var dev = devs.filter(d => d.deviceInfo && d.deviceInfo.label.toLowerCase().startsWith(dname))[0];    // Assume success
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
        console.error(`Turning on ${dname}`)
        console.dir(e);
        debugger;
    }
}

const devpath = "y:\\x\\Home Control\\Data\\Devices.json";

class laux { IP4: string; MAC: string };
async function TryDev(dev: devices.DevInfo) {
    try {
        msg(`TryDev(${dev.Name})`);
        const aux = <laux>dev.Adr.Aux;
        msg(`${dev.Name} creating device`);
        const cdev = await Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
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
    TryDev(devices.devices["testbeam"])
}

tests();