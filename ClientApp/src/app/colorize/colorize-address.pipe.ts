import {Pipe, PipeTransform} from '@angular/core';
import {ContrastCheckerService} from "./contrast-checker.service";

@Pipe({
    name: 'colorizeAddress'
})
export class ColorizeAddressPipe implements PipeTransform {

    boldify = false;

    constructor(private _contrastChecker: ContrastCheckerService) {
    }

    transform(value: string): string {
        let ret = value;
        if (value) {
            let valueToColorize = value;
            if (value.startsWith("0x")) {
                valueToColorize = value.substr(2);
            }
            ret = "0x " + this.formatAddress(valueToColorize);

            if (this.boldify) {
                //ret = `<span style="font-weight: bold; mix-blend-mode: difference;" >${ret}</span>`;
                //ret = `<span style="font-weight: normal; mix-blend-mode: darken;" >${ret}</span>`;
                ret = `<span style="font-weight: normal; mix-blend-mode: multiply;" >${ret}</span>`;
            }

            ret = `<span class="address-base">${ret}</span>`;
        }
        return ret;
    }

    private formatAddress(valueToColorize: string) {
        const addressBlocks: string[] = [];
        //Break address in blocks of siz characters:
        for (let i = 0; i < 7; i++) {
            addressBlocks.push(valueToColorize.substr(i * 6, 6));
        }
        let ret = "";
        addressBlocks.forEach((value, index) => {
            //text-shadow: -1px 0 snow, 0 1px snow, 1px 0 black, 0 -1px snow;
            //Change Background color! Probably best way! Make background darker if values of color summed greater than a certain limit!
            const valueForCalculations = index === 6 ? value + "00" : value;
            const bgColor = this._contrastChecker.isContrastToWhiteOk(valueForCalculations) ? '' : 'background-color: #808080;';
            ret = ret + `<span style="color: #${valueForCalculations}; ${bgColor}">${value}</span> `;
        });

        return ret.trimRight();
    }
}
