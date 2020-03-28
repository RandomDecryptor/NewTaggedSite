import { InjectionToken} from '@angular/core';
import Web3 from 'web3';
//import { TruffleContract } from 'truffle-contract';
import { default as contract } from 'truffle-contract';
import ContractAbi from '../../../../build/contracts/Tagged.json';

import SimpleTagContractAbi from '../../../../build/contracts/Tag.json';

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


export const SmartContract = new InjectionToken<contract>('smartContract', {
  providedIn: 'root',
  factory: () =>  contract(ContractAbi),

});

export const SimpleTagSmartContract = new InjectionToken<contract>('simpleTagSmartContract', {
    providedIn: 'root',
    factory: () =>  contract(SimpleTagContractAbi),

});

export const TaggedContractAddress = new InjectionToken<string>('taggedContractAddress');

export const TaggedContractFirstBlock = new InjectionToken<number>('taggedContractFirstBlock');

export const ExternalUrlTraceTransaction = new InjectionToken<string>('externalUrlTraceTransaction');

export const ExternalUrlFilterByTokenAndTagger = new InjectionToken<string>('externalUrlFilterByTokenAndTagger');

export const ExternalUrlFilterByTokenAndTagged = new InjectionToken<string>('externalUrlFilterByTokenAndTagged');

