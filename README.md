LIFX LAN Interface
===============

**This is a work-in-progress** with only limited support. It is as-is and not fully tested.

**I am assuming no one is depending on this implementation so may make breaking changes.**

Changes:
* Removed broadcast calls because it doesn't make sense to broadcast to all devices since there isn't a single "scene" and fast enough to send explicitly.

This is based on [node-lifx-lan] https://www.npmjs.com/package/node-lifx-lan. The major changes have been in converting to TypeScript and async and relying on the compile time type checks rather than runtime checks.

See https://www.npmjs.com/package/node-lifx-lan for the existing documentation. You can use intellisense in Visual Studio Code to see the parameters. Support for groups and filtering has been removed since they don't provide any advantages for the LAN API

## Moving from JavaScript promises to TypeScript and async

Thus 

**JavaScript**
```
const Lifx  = require('node-lifx-lan');
```

**TypeScript**
```
import { Lifx } from "../lib/lants";
```

```

const cdev = await Lifx.createDevice({ ip: "192.168.1.100", mac: "00:11:22:33:44:EE" });
await cdev.turnOn({color: {css: 'green'});
console.log('Done!');

```

To discovery and turn all bulbs.

**Note** Discovery is not perfect so you'll want wrapper code to keep rediscovering. Better to keep a local database of recent discoveries

```
const devs = await Lifx.discover(
devs.forEach(dev => dev.turnOn());

```
