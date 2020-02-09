import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class ContrastCheckerService {

    private readonly _regExpHex2Rgd: RegExp;

    constructor() {
        this._regExpHex2Rgd = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
    }

    private hex2Rgb(hex: string) {
        var result = this._regExpHex2Rgd.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    public calculateLuminance(hexColor: string) {
        const rgbColor = this.hex2Rgb(hexColor);
        const a = [rgbColor.r, rgbColor.g, rgbColor.b].map(function(v) {
            v /= 255;
            return (v <= 0.03928) ?
                v / 12.92 :
                Math.pow(((v + 0.055) / 1.055), 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }

    public contrastToWhite(hexColor: string) {
        const whiteIlluminance = 1;
        const illuminance = this.calculateLuminance(hexColor);
        return whiteIlluminance / illuminance;
    }

    public isContrastToWhiteOk(hexColor: string) {
        return this.contrastToWhite(hexColor) > /*4.5*/ 1.8;
    }
}
