// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  taggedContractInfo: {
      contractAddress: '0xdBaF944889A03715a9BC26590899109cb6dA134b',
      contractFirstBlock: '0'
  },
  externals: {
      urlTraceTransaction: 'https://ropsten.etherscan.io/tx/{0}',
      urlFilterByTokenAndTagger: 'https://ropsten.etherscan.io/token/{0}?a={1}',
      urlFilterByTokenAndTagged: 'https://ropsten.etherscan.io/token/{0}?a={1}', //TODO: Update the url for this!!
  }

};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
