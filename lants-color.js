"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.anyToHsb = exports.mergeToHsb = exports.xybToHsb = exports.hsbToXyb = exports.xybToRgb = exports.rgbToXyb = exports.hsbToRgb = exports.rgbToHsb = exports.cssToHsb = void 0;
const util_1 = require("util");
// Consider https://github.com/Qix-/color-convert
// https://www.npmjs.com/package/color-convert
// https://www.npmjs.com/package/color-temperature
// https://www.npmjs.com/package/color-temp
/* ------------------------------------------------------------------
* node-lifx-lan - lifx-lan-color.js
*
* Copyright (c) 2017-2018, Futomi Hatano, All rights reserved.
* Released under the MIT license
* Date: 2018-08-08
* ---------------------------------------------------------------- */
'use strict';
const _CSS_COLOR_KEYWORDS = {
    'aliceblue': [240, 248, 255],
    'antiquewhite': [250, 235, 215],
    'aqua': [0, 255, 255],
    'aquamarine': [127, 255, 212],
    'azure': [240, 255, 255],
    'beige': [245, 245, 220],
    'bisque': [255, 228, 196],
    'black': [0, 0, 0],
    'blanchedalmond': [255, 235, 205],
    'blue': [0, 0, 255],
    'blueviolet': [138, 43, 226],
    'brown': [165, 42, 42],
    'burlywood': [222, 184, 135],
    'cadetblue': [95, 158, 160],
    'chartreuse': [127, 255, 0],
    'chocolate': [210, 105, 30],
    'coral': [255, 127, 80],
    'cornflowerblue': [100, 149, 237],
    'cornsilk': [255, 248, 220],
    'crimson': [220, 20, 60],
    'cyan': [0, 255, 255],
    'darkblue': [0, 0, 139],
    'darkcyan': [0, 139, 139],
    'darkgoldenrod': [184, 134, 11],
    'darkgray': [169, 169, 169],
    'darkgreen': [0, 100, 0],
    'darkgrey': [169, 169, 169],
    'darkkhaki': [189, 183, 107],
    'darkmagenta': [139, 0, 139],
    'darkolivegreen': [85, 107, 47],
    'darkorange': [255, 140, 0],
    'darkorchid': [153, 50, 204],
    'darkred': [139, 0, 0],
    'darksalmon': [233, 150, 122],
    'darkseagreen': [143, 188, 143],
    'darkslateblue': [72, 61, 139],
    'darkslategray': [47, 79, 79],
    'darkslategrey': [47, 79, 79],
    'darkturquoise': [0, 206, 209],
    'darkviolet': [148, 0, 211],
    'deeppink': [255, 20, 147],
    'deepskyblue': [0, 191, 255],
    'dimgray': [105, 105, 105],
    'dimgrey': [105, 105, 105],
    'dodgerblue': [30, 144, 255],
    'firebrick': [178, 34, 34],
    'floralwhite': [255, 250, 240],
    'forestgreen': [34, 139, 34],
    'fuchsia': [255, 0, 255],
    'gainsboro': [220, 220, 220],
    'ghostwhite': [248, 248, 255],
    'gold': [255, 215, 0],
    'goldenrod': [218, 165, 32],
    'gray': [128, 128, 128],
    'green': [0, 128, 0],
    'greenyellow': [173, 255, 47],
    'grey': [128, 128, 128],
    'honeydew': [240, 255, 240],
    'hotpink': [255, 105, 180],
    'indianred': [205, 92, 92],
    'indigo': [75, 0, 130],
    'ivory': [255, 255, 240],
    'khaki': [240, 230, 140],
    'lavender': [230, 230, 250],
    'lavenderblush': [255, 240, 245],
    'lawngreen': [124, 252, 0],
    'lemonchiffon': [255, 250, 205],
    'lightblue': [173, 216, 230],
    'lightcoral': [240, 128, 128],
    'lightcyan': [224, 255, 255],
    'lightgoldenrodyellow': [250, 250, 210],
    'lightgray': [211, 211, 211],
    'lightgreen': [144, 238, 144],
    'lightgrey': [211, 211, 211],
    'lightpink': [255, 182, 193],
    'lightsalmon': [255, 160, 122],
    'lightseagreen': [32, 178, 170],
    'lightskyblue': [135, 206, 250],
    'lightslategray': [119, 136, 153],
    'lightslategrey': [119, 136, 153],
    'lightsteelblue': [176, 196, 222],
    'lightyellow': [255, 255, 224],
    'lime': [0, 255, 0],
    'limegreen': [50, 205, 50],
    'linen': [250, 240, 230],
    'magenta': [255, 0, 255],
    'maroon': [128, 0, 0],
    'mediumaquamarine': [102, 205, 170],
    'mediumblue': [0, 0, 205],
    'mediumorchid': [186, 85, 211],
    'mediumpurple': [147, 112, 219],
    'mediumseagreen': [60, 179, 113],
    'mediumslateblue': [123, 104, 238],
    'mediumspringgreen': [0, 250, 154],
    'mediumturquoise': [72, 209, 204],
    'mediumvioletred': [199, 21, 133],
    'midnightblue': [25, 25, 112],
    'mintcream': [245, 255, 250],
    'mistyrose': [255, 228, 225],
    'moccasin': [255, 228, 181],
    'navajowhite': [255, 222, 173],
    'navy': [0, 0, 128],
    'oldlace': [253, 245, 230],
    'olive': [128, 128, 0],
    'olivedrab': [107, 142, 35],
    'orange': [255, 165, 0],
    'orangered': [255, 69, 0],
    'orchid': [218, 112, 214],
    'palegoldenrod': [238, 232, 170],
    'palegreen': [152, 251, 152],
    'paleturquoise': [175, 238, 238],
    'palevioletred': [219, 112, 147],
    'papayawhip': [255, 239, 213],
    'peachpuff': [255, 218, 185],
    'peru': [205, 133, 63],
    'pink': [255, 192, 203],
    'plum': [221, 160, 221],
    'powderblue': [176, 224, 230],
    'purple': [128, 0, 128],
    'rebeccapurple': [102, 51, 153],
    'red': [255, 0, 0],
    'rosybrown': [188, 143, 143],
    'royalblue': [65, 105, 225],
    'saddlebrown': [139, 69, 19],
    'salmon': [250, 128, 114],
    'sandybrown': [244, 164, 96],
    'seagreen': [46, 139, 87],
    'seashell': [255, 245, 238],
    'sienna': [160, 82, 45],
    'silver': [192, 192, 192],
    'skyblue': [135, 206, 235],
    'slateblue': [106, 90, 205],
    'slategray': [112, 128, 144],
    'slategrey': [112, 128, 144],
    'snow': [255, 250, 250],
    'springgreen': [0, 255, 127],
    'steelblue': [70, 130, 180],
    'tan': [210, 180, 140],
    'teal': [0, 128, 128],
    'thistle': [216, 191, 216],
    'tomato': [255, 99, 71],
    'turquoise': [64, 224, 208],
    'violet': [238, 130, 238],
    'wheat': [245, 222, 179],
    'white': [255, 255, 255],
    'whitesmoke': [245, 245, 245],
    'yellow': [255, 255, 0],
    'yellowgreen': [154, 205, 50]
};
/* ------------------------------------------------------------------
* Method: cssToHsb(params)
* - params:
*   - css        | String | Required | "red", "#ff0000", "rgb(255, 0, 0)".
*   - brightness | Float | Optional | Brightness. 0.0 - 1.0
* ---------------------------------------------------------------- */
// export class _LifxLanColor {
function cssToHsb(p) {
    // Check the parameters
    if (typeof p.css != "string")
        throw new Error('The `css` is required.');
    let css = p.css.toLowerCase();
    let rgb = {};
    let cm;
    if (cm = css.match(/^\#([a-f0-9]{2})([a-f0-9]{2})([a-f0-9]{2})$/)) {
        // if (cm) {
        rgb = {
            red: parseInt(cm[1], 16) / 255,
            green: parseInt(cm[2], 16) / 255,
            blue: parseInt(cm[3], 16) / 255
        };
    }
    else if (cm = css.match(/^rgb\(\s*(\d{1,3})\,\s*(\d{1,3})\,\s*(\d{1,3})\s*\)$/)) {
        rgb = {
            red: parseInt(cm[1], 10) / 255,
            green: parseInt(cm[2], 10) / 255,
            blue: parseInt(cm[3], 10) / 255
        };
    }
    else if (_CSS_COLOR_KEYWORDS[css]) {
        let c = _CSS_COLOR_KEYWORDS[css];
        rgb = {
            red: c[0] / 255,
            green: c[1] / 255,
            blue: c[2] / 255
        };
    }
    else {
        throw new Error('The `css` is invalid as a CSS color string.');
    }
    if ('brightness' in p) {
        let v = p['brightness'];
        if (typeof (v) === 'number' && v >= 0.0 && v < 1.0) {
            rgb['brightness'] = v;
        }
    }
    return rgbToHsb(rgb);
}
exports.cssToHsb = cssToHsb;
;
/* ------------------------------------------------------------------
* Method: rgbToHsb(params)
* - params:
*   - red        | Float | Required | R component. 0.0 - 1.0.
*   - green      | Float | Required | G component. 0.0 - 1.0.
*   - blue       | Float | Required | B component. 0.0 - 1.0.
*   - brightness | Float | Optional | Brightness. 0.0 - 1.0
* ---------------------------------------------------------------- */
function rgbToHsb(p) {
    // Check the parameters
    let error = null;
    ['red', 'green', 'blue'].forEach((c) => {
        if (util_1.isUndefined(p[c]))
            p[c] = 0;
        let v = p[c];
        if (typeof (v) !== 'number' || v < 0 || v > 1) {
            throw new Error('The `' + c + '` must be a float between 0.0 and 1.0.');
        }
    });
    let r = p.red * 255;
    let g = p.green * 255;
    let b = p.blue * 255;
    // Determine the max and min value in RGB
    let max = Math.max(r, g, b);
    let min = Math.min(r, g, b);
    // Hue
    let hue = 0;
    if (r === max && g === max && b === max) {
        hue = 0;
    }
    else if (r === max) {
        hue = 60 * ((g - b) / (max - min));
    }
    else if (g === max) {
        hue = 60 * ((b - r) / (max - min)) + 120;
    }
    else {
        hue = 60 * ((r - g) / (max - min)) + 240;
    }
    if (hue < 0) {
        hue += 360;
    }
    hue = hue / 360;
    // Saturation
    let sat = 0;
    if (max > 0) {
        sat = (max - min) / max;
    }
    // Brightness
    let bri = max / 255;
    if ('brightness' in p) {
        let v = p['brightness'];
        if (typeof (v) === 'number' && v >= 0.0 && v < 1.0) {
            bri = v;
        }
    }
    return { hue: hue, saturation: sat, brightness: bri };
    //  hue: hue,
    //  saturation: sat,
    //  brightness: bri
}
exports.rgbToHsb = rgbToHsb;
;
/* ------------------------------------------------------------------
* Method: hsbToRgb(params)
* - params:
*   - hue        | Float | Required | Hue. 0.0 - 1.0.
*   - saturation | Float | Required | Saturation. 0.0 - 1.0.
*   - brightness | Float | Required | Brightness. 0.0 - 1.0.
* ---------------------------------------------------------------- */
function hsbToRgb(p) {
    // Check the parameters
    ['hue', 'saturation', 'brightness'].forEach((c) => {
        if (c in p) {
            let v = p[c];
            if (typeof (v) !== 'number' || v < 0 || v > 1) {
                throw new Error('The `' + c + '` must be a float between 0.0 and 1.0.');
            }
        }
        else
            throw new Error(`'The ${c} is required.`);
    });
    let hue = p['hue'] * 360;
    let sat = p['saturation'] * 255;
    let bri = p['brightness'] * 255;
    // Determine the max and min value in HSB
    let max = bri;
    let min = max - ((sat / 255) * max);
    //
    let r = 0;
    let g = 0;
    let b = 0;
    if (hue <= 60) {
        r = max;
        g = (hue / 60) * (max - min) + min;
        b = min;
    }
    else if (hue <= 120) {
        r = ((120 - hue) / 60) * (max - min) + min;
        g = max;
        b = min;
    }
    else if (hue <= 180) {
        r = min;
        g = max;
        b = ((hue - 120) / 60) * (max - min) + min;
    }
    else if (hue <= 240) {
        r = min;
        g = ((240 - hue) / 60) * (max - min) + min;
        b = max;
    }
    else if (hue <= 300) {
        r = ((hue - 240) / 60) * (max - min) + min;
        g = min;
        b = max;
    }
    else {
        r = max;
        g = min;
        b = ((360 - hue) / 60) * (max - min) + min;
    }
    return {
        red: r / 255,
        green: g / 255,
        blue: b / 255
    };
}
exports.hsbToRgb = hsbToRgb;
;
/* ------------------------------------------------------------------
* Method: rgbToXyb(params)
* - params:
*   - red   | Float | Required | R component. 0.0 - 1.0.
*   - green | Float | Required | G component. 0.0 - 1.0.
*   - blue  | Float | Required | B component. 0.0 - 1.0.
*
* https://www.developers.meethue.com/documentation/color-conversions-rgb-xy
* ---------------------------------------------------------------- */
function rgbToXyb(p) {
    // Check the parameters
    let error = null;
    ['red', 'green', 'blue'].forEach((c) => {
        if (c in p) {
            let v = p[c];
            if (typeof (v) !== 'number' || v < 0 || v > 1) {
                error = new Error('The `' + c + '` must be a float between 0.0 and 1.0.');
            }
        }
        else {
            error = new Error('The `' + c + '` is required.');
        }
    });
    let r = p.red || 0;
    let g = p.green || 0;
    let b = p.blue || 0;
    // Apply a gamma correction to the RGB values
    r = (r > 0.04045) ? Math.pow((r + 0.055) / (1.0 + 0.055), 2.4) : (r / 12.92);
    g = (g > 0.04045) ? Math.pow((g + 0.055) / (1.0 + 0.055), 2.4) : (g / 12.92);
    b = (b > 0.04045) ? Math.pow((b + 0.055) / (1.0 + 0.055), 2.4) : (b / 12.92);
    // Convert the RGB values to XYZ using the Wide RGB D65 conversion formula
    let X = r * 0.664511 + g * 0.154324 + b * 0.162028;
    let Y = r * 0.283881 + g * 0.668433 + b * 0.047685;
    let Z = r * 0.000088 + g * 0.072310 + b * 0.986039;
    // Calculate the xy values from the XYZ values
    let x = X / (X + Y + Z);
    let y = Y / (X + Y + Z);
    let bri = Y;
    return {
        x: x,
        y: y,
        brightness: bri
    };
}
exports.rgbToXyb = rgbToXyb;
;
/* ------------------------------------------------------------------
* Method: xybToRgb(params)
* - params:
*   - x          | Float | Required | x value. 0.0 - 1.0.
*   - y          | Float | Required | y value. 0.0 - 1.0.
*   - brightness | Float | Required | Brightness. 0.0 - 1.0.
*
* https://www.developers.meethue.com/documentation/color-conversions-rgb-xy
* ---------------------------------------------------------------- */
function xybToRgb(p) {
    // Check the parameters
    let x = p['x'];
    let y = p['y'];
    let bri = p['brightness'];
    // Calculate XYZ values
    let z = 1.0 - x - y;
    let Y = bri;
    let X = (Y / y) * x;
    let Z = (Y / y) * z;
    // Convert to RGB using Wide RGB D65 conversion
    let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
    let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
    let b = X * 0.051713 - Y * 0.121364 + Z * 1.011530;
    // Apply reverse gamma correction
    let rgb = {
        red: (r <= 0.0031308) ? 12.92 * r : (1.0 + 0.055) * Math.pow(r, (1.0 / 2.4)) - 0.055,
        green: (g <= 0.0031308) ? 12.92 * g : (1.0 + 0.055) * Math.pow(g, (1.0 / 2.4)) - 0.055,
        blue: (b <= 0.0031308) ? 12.92 * b : (1.0 + 0.055) * Math.pow(b, (1.0 / 2.4)) - 0.055
    };
    Object.keys(rgb).forEach((k) => {
        let v = rgb[k];
        if (v < 0.0) {
            v = 0.0;
        }
        if (v > 1.0) {
            v = 1.0;
        }
        rgb[k] = v;
    });
    return rgb;
}
exports.xybToRgb = xybToRgb;
;
/* ------------------------------------------------------------------
* Method: hsbToXyb(params)
* - params:
*   - hue        | Float | Required | Hue. 0.0 - 1.0.
*   - saturation | Float | Required | Saturation. 0.0 - 1.0.
*   - brightness | Float | Required | Brightness. 0.0 - 1.0.
* ---------------------------------------------------------------- */
function hsbToXyb(p) {
    return rgbToXyb(hsbToRgb(p));
}
exports.hsbToXyb = hsbToXyb;
;
/* ------------------------------------------------------------------
* Method: xybToHsb(params)
* - params:
*   - x          | Float | Required | x value. 0.0 - 1.0.
*   - y          | Float | Required | y value. 0.0 - 1.0.
*   - brightness | Float | Required | Brightness. 0.0 - 1.0.
* ---------------------------------------------------------------- */
function xybToHsb(p) {
    return rgbToHsb(xybToRgb(p));
}
exports.xybToHsb = xybToHsb;
// Second cphsb is for mergin with existing settings
function mergeToHsb(c, color) {
    const copyhsb = (hsb) => {
        color.hue = hsb.hue;
        color.saturation = hsb.saturation;
        color.brightness = hsb.brightness;
    };
    if ('hue' in c || 'saturation' in c) {
        const ch = c;
        if ('hue' in ch)
            color.hue = ch.hue;
        if ('saturation' in c)
            color.saturation = ch.saturation;
        if ('brightness' in c)
            color.brightness = ch.brightness;
    }
    else if ('x' in c || 'y' in c) {
        const cx = c;
        let xyb = hsbToXyb({ hue: color.hue, saturation: color.saturation, brightness: color.brightness });
        if ('x' in c)
            xyb.x = cx.x;
        if ('y' in c)
            xyb.y = cx.y;
        if ('brightness' in c)
            xyb.brightness = cx.brightness;
        copyhsb(xybToHsb(xyb));
    }
    else if ('red' in c || 'green' in c || 'blue' in c) {
        let rgb = hsbToRgb({ hue: color.hue, saturation: color.saturation, brightness: color.brightness });
        const crgb = c;
        if ('red' in c)
            rgb.red = crgb.red;
        if ('green' in c)
            rgb.green = crgb.green;
        if ('blue' in c)
            rgb.blue = crgb.blue;
        if ('brightness' in c)
            rgb.brightness = crgb.brightness;
        copyhsb(rgbToHsb(rgb));
    }
    else if ('css' in c) {
        copyhsb(cssToHsb(c));
    }
    if ('kelvin' in c)
        color.kelvin = c.kelvin;
    return color;
}
exports.mergeToHsb = mergeToHsb;
function anyToHsb(c) {
    let color;
    if ('hue' in c && 'saturation' in c && 'brightness' in c) {
        const ch = c;
        color = { hue: ch.hue, saturation: ch.saturation, brightness: ch.brightness };
    }
    else if ('x' in c && 'y' in c) {
        const cxy = c;
        color = xybToHsb({ x: cxy.x, y: cxy.y });
    }
    else if ('red' in c || 'green' in c || 'blue' in c) {
        c.red = c.red || 0;
        c.blue = c.blue || 0;
        c.green = c.green || 0;
        const crgb = c;
        color = rgbToHsb({ red: crgb.red, green: crgb.green, blue: crgb.blue, brightness: crgb.brightness });
    }
    else if ('css' in c) {
        color = cssToHsb(c);
    }
    else {
        throw new Error('The `color` is invalid.');
    }
    if ('kelvin' in c)
        color.kelvin = c.kelvin;
    return color;
}
exports.anyToHsb = anyToHsb;
// export const LifxLanColorx = new LifxLanColors();
// export const xLifxLanColor = new _LifxLanColor();
//# sourceMappingURL=lants-color.js.map