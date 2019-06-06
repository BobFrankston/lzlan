LIFX LAN Interface
===============

**This is a work-in-progress** with only limited support. It is as-is and not fully tested.

**I am assuming no one is depending on this implementation so may make breaking changes.**

Changes:
* Removed broadcast calls because it doesn't make sense to broadcast to all devices since there isn't a single "scene" and fast enough to send explicitly.

This is based on [node-lifx-lan] https://www.npmjs.com/package/node-lifx-lan. The major changes has been in converting to TypeScript and async and relying on the compile time type checks rather than runtime checks.

See https://www.npmjs.com/package/node-lifx-lan for the existing documentation. You can use intellisense in Visual Studio Code to see the parameters. Support for groups and filtering has been removed since they don't provide any advantages for the LAN API

## Moving from JavaScript promises to TypeScript and async

Thus 

```JavaScript
// Create a LifxLan object
const Lifx  = require('node-lifx-lan');

// Turn on all LIFX bulbs in the local network
Lifx.turnOnBroadcast({
  color: {css: 'green'}
}).then(() => {
  console.log('Done!');
}).catch((error) => {
  console.error(error);
});
```

becomes

```JavaScript
// Create a LifxLan object
import * as lz from "lzlan";

// Turn on all LIFX bulbs in the local network
async function TurnOnAll() {
    try {
        lz.turnOnBroadcast({color: {css: 'green'});
        console.log('Done!');
    }
    catch(e) {
        console.error(`Error: ${e.message}`);
    }
}
TurnOnAll();
```
