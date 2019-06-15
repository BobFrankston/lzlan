import { Brightness0To1 } from "./lants-device";
export interface LifxLanColorHSB {
    [key: string]: number;
    hue?: number;
    saturation?: number;
    brightness?: Brightness0To1;
    kelvin?: number;
}
export interface LifxLanColorRGB {
    [key: string]: number;
    red?: number;
    green?: number;
    blue?: number;
    brightness?: Brightness0To1;
    kelvin?: number;
}
export interface LifxLanColorXyb {
    [key: string]: number;
    x: number;
    y: number;
    brightness?: number;
    kelvin?: number;
}
export interface LifxLanColorCSS {
    [key: string]: number | string;
    css: string;
    brightness?: number;
    kelvin?: number;
}
export declare type LifxLanColorAny = LifxLanColorCSS | LifxLanColorHSB | LifxLanColorRGB | LifxLanColorXyb;
export declare function cssToHsb(p: LifxLanColorCSS): LifxLanColorHSB;
export declare function rgbToHsb(p: LifxLanColorRGB): LifxLanColorHSB;
export declare function hsbToRgb(p: LifxLanColorHSB): LifxLanColorRGB;
export declare function rgbToXyb(p: LifxLanColorRGB): LifxLanColorXyb;
export declare function xybToRgb(p: LifxLanColorXyb): LifxLanColorRGB;
export declare function hsbToXyb(p: LifxLanColorHSB): LifxLanColorXyb;
export declare function xybToHsb(p: LifxLanColorXyb): LifxLanColorHSB;
export declare function mergeToHsb(c: LifxLanColorAny, color: LifxLanColorHSB): LifxLanColorHSB;
export declare function anyToHsb(c: LifxLanColorAny): LifxLanColorHSB;
//# sourceMappingURL=lants-color.d.ts.map