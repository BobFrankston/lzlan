LIFX LAN Interface
===============

This is based on  [node-lifx-lan link] https://www.npmjs.com/package/node-lifx-lan. The major changes have been in converting to TypeScript and async and relying on the compile time typechecks more than runtime checking.

See [link]https://www.npmjs.com/package/node-lifx-lan for the existing documentat

## Variations

* Use of typescript. Thus 

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
```
