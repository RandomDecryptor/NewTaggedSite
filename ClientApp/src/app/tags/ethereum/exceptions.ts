
export class EthereumMainContractException extends Error {

    constructor(msg: string) {
        super(`EthereumMainContractService: ${msg}`);
    }

}
