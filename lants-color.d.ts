import { Brightness0To1 } from "./lants-device.js";
export interface LifxLanColorHSB {
    hue?: number;
    saturation?: number;
    brightness?: Brightness0To1;
    kelvin?: number;
}
type ColorComponents = {
    [key in 'red' | 'green' | 'blue']?: number;
};
export interface LifxLanColorRGB extends ColorComponents {
    red?: number;
    green?: number;
    blue?: number;
    brightness?: Brightness0To1;
    kelvin?: number;
}
export interface LifxLanColorXyb {
    x: number;
    y: number;
    brightness?: number;
    kelvin?: number;
}
export interface LifxLanColorCSS {
    css: string;
    brightness?: number;
    kelvin?: number;
}
export type LifxLanColorAny = LifxLanColorCSS | LifxLanColorHSB | LifxLanColorRGB | LifxLanColorXyb;
export declare function cssToHsb(p: LifxLanColorCSS): LifxLanColorHSB;
export declare function rgbToHsb(p: LifxLanColorRGB): LifxLanColorHSB;
export declare function hsbToRgb(p: LifxLanColorHSB): LifxLanColorRGB;
export declare function rgbToXyb(p: LifxLanColorRGB): LifxLanColorXyb;
export declare function xybToRgb(p: LifxLanColorXyb): LifxLanColorRGB;
export declare function hsbToXyb(p: LifxLanColorHSB): LifxLanColorXyb;
export declare function xybToHsb(p: LifxLanColorXyb): LifxLanColorHSB;
export declare function mergeToHsb(c: LifxLanColorAny, color: LifxLanColorHSB): LifxLanColorHSB;
export declare function anyToHsb(c: LifxLanColorAny): LifxLanColorHSB;
export {};
//# sourceMappingURL=lants-color.d.ts.map