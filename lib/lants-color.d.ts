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
export declare type LifxLanColor = LifxLanColorCSS | LifxLanColorHSB | LifxLanColorRGB | LifxLanColorXyb;
export declare class _LifxLanColor {
    cssToHsb(p: LifxLanColorCSS): LifxLanColorHSB;
    rgbToHsb(p: LifxLanColorRGB): LifxLanColorHSB;
    hsbToRgb(p: LifxLanColorHSB): LifxLanColorRGB;
    rgbToXyb(p: LifxLanColorRGB): LifxLanColorXyb;
    xybToRgb(p: LifxLanColorXyb): LifxLanColorRGB;
    hsbToXyb(p: LifxLanColorHSB): LifxLanColorXyb;
    xybToHsb(p: LifxLanColorXyb): LifxLanColorHSB;
    mergeToHsb(c: LifxLanColor, color: LifxLanColorHSB): LifxLanColorHSB;
    anyToHsb(c: LifxLanColor): LifxLanColorHSB;
}
export declare const mLifxLanColor: _LifxLanColor;
//# sourceMappingURL=lants-color.d.ts.map