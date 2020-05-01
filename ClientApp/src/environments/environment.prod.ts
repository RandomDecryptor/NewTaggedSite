export const environment = {
    production: true,
    extraInfo: false,
    taggedContractInfo: {
        contractAddress: '0x0abd22a6c3f56d1ed0ad441db9be08291fa7cafe', //Ropsten Test Network
        contractFirstBlock: 4704782
    },
    externals: {
        urlTraceTransaction: 'https://ropsten.etherscan.io/tx/{0}',
        urlFilterByTokenAndTagger: 'https://ropsten.etherscan.io/token/{0}?a={1}',
        urlFilterByTokenAndTagged: 'https://ropsten.etherscan.io/token/{0}?a={1}', //TODO: Update the url for this!!
    }
};
