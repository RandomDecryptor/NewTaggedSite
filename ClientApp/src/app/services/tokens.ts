import { InjectionToken} from '@angular/core';
import Web3 from 'web3';
import { TruffleContract } from 'truffle-contract';
import ContractAbi from '../../../../build/contracts/Tagged.json';


export const WEB3 = new InjectionToken<Web3>('web3Token', {
  providedIn: 'root',
  factory: () => {
    // based on https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    try {
      const provider = ('ethereum' in window) ? window['ethereum'] : Web3.givenProvider;

      return new Web3(provider);
    } catch (err) {
      throw new Error('Unable to retrieve the injected Ethereum provider from  MetaMask');
    }
  }
});


export const SmartContract = new InjectionToken<TruffleContract.Contract>('smartContract', {
  providedIn: 'root',
  factory: () =>  TruffleContract.Contract(ContractAbi),

});



