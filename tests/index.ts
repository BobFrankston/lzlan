// import * as lz from "@bobfrankston/lzlan"
// import { LifxLan } from "../lib/lants";
import * as Lifx from "../lib/lants";
import * as lz from "../lib/lants";
import * as devices from "y:/x/Home Control/Data/Devices";
import * as ubnt from "y:/x/Home Control/Data/ubnt";
import * as fs from 'fs';
import * as path from 'path';
import { lifxMsgType } from "../lib/lants-parser";
import { getDefaultSettings } from "http2";
import { LifxLanColorCSS } from "../lib/lants-color";
import { ENETUNREACH } from "constants";
import { LifxDevice } from "../lib/lants-device";
import { homedir } from "os";

var xdev: lz.LifxLanDevice;
var wait = 250; // Ms
function msg(text: string) {
    console.log(`${new Date().toLocaleTimeString()} ${text}`)
}

const homeData = "y:/x/home control/data";
// const devpath = "y:\\x\\Home Control\\Data\\Devices.json";

class laux { IP4: string; MAC: string };
// let devs: lz.LifxLanDevice[] = null;
let devsByip: { [ip: string]: lz.LifxLanDevice } = {};
let devsByName: { [name: string]: lz.LifxLanDevice } = {}

let ubntInfo: ubnt.UbntData[] = [];
function getUBNT() {
    try {
        const ub = fs.readFileSync(path.join(homeData, "ubnt.json"), "utf8");
        ubntInfo = <ubnt.UbntData[]>JSON.parse(ub);
    }
    catch (e) {
        debugger;
    }
}
getUBNT();

function addDevs(devs: lz.LifxLanDevice[]) {
    console.log(`Adding up to ${devs.length}`);
    devs.forEach(dv => {
        devsByip[dv.ip] = dv;
        if (!dv.deviceInfo) return;  // NO name
        if (!dv.deviceInfo.label) {
            for (var dn in devices.devices) {
                const dev = devices.devices[dn];
                if (!dev || !dev.Adr || !dev.Adr.Aux) continue;
                if ((<any>dev.Adr.Aux).IP4 != dv.ip) continue;
                console.log(`Found ${dv.ip} but not it's label (${dev.Name})`);
                return;
            }
            console.log(`Found ${dv.ip} but no properties`);
            return;
        }
        const name = dv.deviceInfo.label.split(' ')[0].toLowerCase();
        devsByName[name] = dv;
    });

}

async function GetDev(di: devices.DevInfo | string) {
    try {
        if (typeof di == "string") {
            const dname = di.toLowerCase();
            let dev: LifxDevice = null;
            for (var tri = 0; tri < 2; tri++) {
                if (dev = devsByName[dname]) break;  // Have
                msg(`Searching for devices try ${tri}`)
                addDevs(await Lifx.discover());   // var for debugging
                msg(`Searched  for devices try ${tri}`)
            }
            // dev = devsByName[dname];
            if (!dev) {
                msg(`Did not find ${di}`);
                debugger;
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
        // debugger;
        throw e;
    }
}

async function ToggleDev(dev: lz.LifxLanDevice) {
    try {
        let name = dev.deviceInfo ? dev.deviceInfo.label : dev.ip;
        for (let attempt = 0; attempt < 5; attempt++) {
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
        // let ucount = 0;
        // lz.Lifx.AddUDPHandler((a, p) => {
        //     if (++ucount > 1) return;
        //     msg(`#${ucount} [${a.address}:${a.port}] ${JSON.stringify(p.payload)}`);
        // })
        TryDev("testbeam");
        //TryDev(devices.devices["officeclosetlamp"]);
        TryDev(devices.devices["tiles"]);
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