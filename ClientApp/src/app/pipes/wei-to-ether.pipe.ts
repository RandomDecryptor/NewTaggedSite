import {Inject, Pipe, PipeTransform} from '@angular/core';
import {WEB3} from "../services/tokens";
import Web3 from 'web3';

@Pipe({
    name: 'weiToEther'
})
export class WeiToEtherPipe implements PipeTransform {

    constructor(@Inject(WEB3) private web3: Web3) {
    }

    transform(value: any, format?: any): any {
        if(!value || (typeof value === "string" && (value as string).length == 0 )) return value;
        if(!format)
            format = 'ether'; //By default, convert to Ether!
        return this.web3.utils.fromWei(value, format);
    }

}
