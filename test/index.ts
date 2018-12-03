import * as lxlib from './lifxlib';
import { msg, err, delaySeconds, createDevice, findDevice, assureDevices } from './lifxlib';
import Lifx from '../src/lants';
import { LifxDevice } from '../src/lants-device';

async function candy(name: string) {
    try {
        const tb = await findDevice(name);
        if (!tb) {
            msg(`Didn't find ${name}`);
            return;
        }
        msg(`Candy(${name})`)
        const di = await tb.getDeviceInfo();
        // const zinfo = await tb.multiZoneGetColorZones({ start: 0, end: 255 });
        // const zx = await tb.getLightMultiZoneState(tb.deviceInfo);  //??
        
        await tb.turnOff();
        await delaySeconds(3);
        await tb.turnOn();

        // const zones = 20;   // How many
        const zcount = tb.deviceInfo.multizone.count;

        const nx = 3;
        const rand = Math.floor(Math.random() * nx);

        const width = Math.floor(Math.random() * 4) + 1;
        for (var zn = 0; zn < zcount / width; zn++) {
            const zone = zn * width;
            let cc = {
                red: zn % 3 == (rand + 0) % 3 ? .5 : 0,
                blue: zn % 3 == (rand + 1) % 3 ? .5 : 0,
                green: zn % 3 == (rand + 2) % 3 ? .5 : 0
            }

            try {
                await delaySeconds(.1);
                await tb.multiZoneSetColorZones({ start: zone, end: zone + width, color: cc });
            }
            catch (e) {
                if (e.message == "Timeout") {
                    console.log(`Zone ${name}.${zone} ${JSON.stringify(cc)} (${e}) retrying`);
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
        err(`candy ${name}`, e);
    }
}

async function alight(lt: LifxDevice) {
    try {
        if (!lt) return;
        await lt.turnOn({ color: { css: "red" } })
        const res = await lt.lightGet();
        await delaySeconds(6);
        await lt.setColor({ color: { css: "green" } });
        await delaySeconds(10);
        await lt.setColor({ color: { css: "white" } });
        await lt.turnOff();
    }
    catch (e) {
        err(`alight ${lt.deviceInfo.label}`, e);
    }
}

async function lighter() {
    try {
        // Set zones of TestBeam
        // candy("b2mbeam");
        for (let i = 0; i < 2; i++) {
            await candy("testbeam");
        }
        // await candy('tiles')
        alight(await findDevice("officetrack2"));
    }
    catch (e) {
        err(`lighter`, e)
    }
}

async function tester() {
    await assureDevices();
    lighter();
}

tester();