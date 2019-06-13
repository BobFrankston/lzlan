// import * as lz from "@bobfrankston/lzlan"
// import { LifxLan } from "../lib/lants";
import { Lifx } from "../lib/lants";
import * as lz from "../lib/lants";
import * as devices from "y:/x/Home Control/Data/Devices";
import * as fs from 'fs';
import { lifxMsgType } from "../lib/lants-parser";
import { getDefaultSettings } from "http2";
import { LifxLanColorCSS } from "../lib/lants-color";

var xdev: lz.LifxLanDevice;
var wait = 250; // Ms
function msg(text: string) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`)
}

const devpath = "y:\\x\\Home Control\\Data\\Devices.json";

class laux { IP4: string; MAC: string };
let devs: lz.LifxLanDevice[] = null;

async function GetDev(di: devices.DevInfo | string) {
    try {
        if (typeof di == "string") {
            if (!devs)
                devs = await Lifx.discover();   // var for debugging
            let dname = di.toLowerCase();
            var dev = devs.filter(d => d.deviceInfo && d.deviceInfo.label && d.deviceInfo.label.toLowerCase().startsWith(dname))[0];    // Assume success
            if (!dev) {
                console.error(`Did not find ${di}`);
                debugger;
                return null;
            }
            return dev;
        }
        const aux = <laux>di.Adr.Aux;
        return await Lifx.createDevice({ ip: aux.IP4, mac: aux.MAC.toUpperCase() });
    }
    catch (e) {
        debugger;
    }
}

async function TryDev(di: devices.DevInfo | string) {
    try {
        var dev = await GetDev(di);
        if (dev) ToggleDev(dev);
    }
    catch (e) {
        debugger;
    }
}

async function Turner(dev: lz.LifxLanDevice, level: number) {
    try {
        try {
            if (!dev) return;
            let color: LifxLanColorCSS = {
                css: "white",
                brightness: level
            }
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
            await lz.delayms(250);  // Breather?
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

async function ToggleDev(dev: lz.LifxLanDevice) {
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
async function Leveler(dev: lz.LifxLanDevice) {
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
            if (++ucount > 1) return;
            msg(`#${ucount} [${a.address}:${a.port}] ${JSON.stringify(p.payload)}`);
        })
        TryDev("testbeam");
        // TryDev(devices.devices["officeclosetlamp"]);
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