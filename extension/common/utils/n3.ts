import { wallet } from '@cityofzion/neon-core-neo3';

export function checkN3Address(address: string): boolean {
    return wallet.isAddress(address);
}
