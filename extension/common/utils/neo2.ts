import { wallet } from '@cityofzion/neon-core';
import { checkReqArgsTarget } from '../constants/neo2';
export function checkNeo2Address(address: string): boolean {
    return wallet.isAddress(address);
}

export function checkDapiArgs(target: checkReqArgsTarget, parameter): boolean {
    let isError: boolean = null;
    switch (target) {
        case checkReqArgsTarget.BalanceArgs: {
            if (parameter === undefined || parameter.params === undefined || !(parameter.params instanceof Array)) {
                isError = true;
            }
            if (parameter.params instanceof Array) {
                parameter.params.map(item => {
                    if (!checkNeo2Address(item.address)) {
                        isError = true;
                    };
                });
            };
            return isError;
        }
        case checkReqArgsTarget.StorageArgs: {
            if (parameter === undefined || parameter.scriptHash === undefined || parameter.key === undefined) {
                isError = true;
            };
            return isError;
        }
        case checkReqArgsTarget.InvokeReadArgs: {
            if (
                parameter.scriptHash === undefined || parameter.scriptHash === '' ||
                parameter.operation === undefined || parameter.operation === ''
            ) {
                isError = true;
            }
            return isError;
        }
        case checkReqArgsTarget.InvokeReadMultiArgs: {
            if (
                !(parameter.invokeReadArgs instanceof Array) ||
                parameter.invokeReadArgs.length !== undefined &&
                parameter.invokeReadArgs.length === 0
            ) {
                isError = true;
            }
            return isError;
        }
        case checkReqArgsTarget.VerifyMessageArgs: {
            if (
                parameter.message === undefined ||
                parameter.data === undefined ||
                parameter.publicKey === undefined
            ) {
                isError = true;
            }
            return isError;
        }
        case checkReqArgsTarget.TransactionInputArgs: {
            if (
                parameter.txid === undefined
            ) {
                isError = true;
            }
            return isError;
        }
        case checkReqArgsTarget.InvokeArgs: {
            if (
                parameter.scriptHash === undefined || parameter.scriptHash === '' ||
                parameter.operation === undefined || parameter.operation === '' ||
                !(parameter.args instanceof Array)
            ) {
                isError = true;
            }
            return isError;
        }
        case checkReqArgsTarget.InvokeMultiArgs: {
            if (parameter.invokeArgs === undefined) {
                isError = true;
            }
            if (
                parameter.invokeArgs instanceof Array &&
                parameter.invokeArgs.length > 0
            ) {
                parameter.invokeArgs.forEach(item => {
                    if (
                        item.scriptHash === undefined || item.scriptHash === '' ||
                        item.operation === undefined || item.operation === '' ||
                        !(item.args instanceof Array)
                    ) {
                        isError = true;
                    }
                });
            } else {

            }
            return isError;
        }



        default:
            break;
    }
}

