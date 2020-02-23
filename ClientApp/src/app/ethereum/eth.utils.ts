
export class EthUtils {
    public static isEqualAddress(address1: string, address2: string): boolean {
        return address1 == address2 || (address1 != null && address2 != null && address1.toLowerCase() === address2.toLowerCase());
    }
}
