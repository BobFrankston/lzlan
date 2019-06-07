// import * as lz from "@bobfrankston/lzlan"
// import { LifxLan } from "../lib/lants";
import { Lifx } from "../lib/lants";
import * as lz from "../lib/lants";
import * as devices from "y:/x/Home Control/Data/Devices";
import * as fs from 'fs';
import { lifxMsgType } from "../lib/lants-parser";

var xdev: lz.LifxLanDevice;
var wait = 250; // Ms
function msg(text: string) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`)
}

const devpath = "y:\\x\\Home Control\\Data\\Devices.json";

class laux { IP4: string; MAC: string };
let devs: lz.LifxLanDevice[] = null;
async function TryDev(di: devices.DevInfo | string) {
    try {
        if (typeof di == "string") {
            if (!devs)
                devs = await Lifx.discover();   // var for debugging
            let dname = di.toLowerCase();
            var dev = devs.filter(d => d.deviceInfo && d.deviceInfo.label && d.deviceInfo.label.toLowerCase().startsWith(dname))[0];    // Assume success
            if (!dev) {
                console.error(`Did not find ${di}`);
                debugger;
                return;
            }
            ToggleDev(dev, di);
            return;
        }
        msg(`TryDev(${di.Name})`);
        const aux = <laux>di.Adr.Aux;
        msg(`${di.Name} creating device`);
        const cdev = await Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
        msg(`${di.Name} created  device`);
        ToggleDev(cdev, di.Name);
    }
    catch (e) {
        debugger;
    }
}

async function Turner(dev: lz.LifxLanDevice, name: string, level: number) {
    try {
        await dev.lightSetPower({ level: level });
    }
    catch (e) {
        if (e.message != "Timeout")
            throw e;
        await lz.delayms(250);  // Breather?
        await dev.lightSetPower({ level: level });
    }
    await lz.delayms(250);
    let result = await dev.lightGetPower();
    if (result.level != level) {
        msg(`${name} Asked for level ${level} but got ${result.level}`);
    }
}

async function ToggleDev(dev: lz.LifxLanDevice, name: string) {
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
        if (++ucount > 10) return;
        msg(`#${ucount} [${a.address}:${a.port}] ${JSON.stringify(p.payload)}`);
    })
    // TryDev("testbeam");
    TryDev(devices.devices["officeclosetlamp"]);
    TryDev(devices.devices["tiles"]);
    await lz.delayms(250);
    // TryDev(devices.devices["testbeam"])
}

tests();