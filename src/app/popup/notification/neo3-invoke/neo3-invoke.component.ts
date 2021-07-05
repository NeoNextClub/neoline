import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalService, NeonService, ChromeService, AssetState } from '@/app/core';
import { Transaction } from '@cityofzion/neon-core-neo3/lib/tx';
import { tx, rpc as rpc3 } from '@cityofzion/neon-js-neo3';
import { MatDialog } from '@angular/material/dialog';
import { ERRORS } from '@/models/dapi';
import { requestTargetN3 } from '@/models/dapi_neo3';
import { PopupDapiPromptComponent, PopupEditFeeDialogComponent } from '../../_dialogs';
import { GasFeeSpeed } from '../../_lib/type';
import { bignumber } from 'mathjs';
import { NEO3_MAGIC_NUMBER_TESTNET, NEO3_CONTRACT } from '../../_lib';
import { Neo3InvokeService } from '../../transfer/neo3-invoke.service';
import { forkJoin } from 'rxjs';

@Component({
    templateUrl: 'neo3-invoke.component.html',
    styleUrls: ['neo3-invoke.component.scss']
})
export class PopupNoticeNeo3InvokeComponent implements OnInit {
    public net: string = '';
    public dataJson: any = {};
    public rateCurrency = '';
    public txSerialize = '';
    public assetImageUrl = '';
    public showFeeEdit: boolean = true;

    private pramsData: any;
    public scriptHash = '';
    public tx: Transaction;
    public invokeArgs: any[] = [];
    public signers = null;
    public minFee = 0;
    public broadcastOverride = null;
    public loading = false;
    public loadingMsg: string;
    private messageID = 0;
    public invokeArgsArray: any[] = [];

    public fee = null;
    public systemFee;
    public networkFee;
    public feeMoney = '0';
    public systemFeeMoney;
    public networkFeeMoney;
    public totalFee;
    public totalMoney;
    public rpcClient;

    constructor(
        private aRoute: ActivatedRoute,
        private router: Router,
        private global: GlobalService,
        private neon: NeonService,
        private dialog: MatDialog,
        private chrome: ChromeService,
        private assetState: AssetState,
        private neo3Invoke: Neo3InvokeService,
        private globalService: GlobalService,
    ) {
        this.rpcClient = new rpc3.RPCClient(this.globalService.Neo3RPCDomain);
    }

    ngOnInit(): void {
        this.assetImageUrl = this.assetState.getAssetImageFromAssetId(NEO3_CONTRACT);
        this.aRoute.queryParams.subscribe(async ({ messageID }) => {
            let params: any;
            this.messageID = messageID;
            this.chrome.getInvokeArgsArray().subscribe(invokeArgsArray => {
                this.invokeArgsArray = invokeArgsArray;
                params = invokeArgsArray.filter(item => (item as any).messageID === messageID)[0];
                this.dataJson = {
                    ...params,
                    messageID: undefined,
                    hostname: undefined,
                };
                this.pramsData = params;
                this.net = this.global.net;
                this.pramsData.invokeArgs = this.neo3Invoke.createInvokeInputs(this.pramsData);
                this.scriptHash = this.pramsData.scriptHash;
                this.invokeArgs.push({
                    ...this.neo3Invoke.createInvokeInputs(this.pramsData)
                });
                if (params.minReqFee) {
                    this.minFee = Number(params.minReqFee);
                }
                if (params.fee) {
                    this.fee = Number(params.fee);
                } else {
                    this.fee = 0;
                    if (this.showFeeEdit) {
                        if (this.assetState.gasFeeSpeed) {
                            this.fee = bignumber(this.minFee).add(bignumber(this.assetState.gasFeeSpeed.propose_price)).toNumber();
                        } else {
                            this.assetState.getGasFee().subscribe((res: GasFeeSpeed) => {
                                this.fee = bignumber(this.minFee).add(bignumber(res.propose_price)).toNumber();
                            });
                        }
                    }
                }
                this.broadcastOverride = this.pramsData.broadcastOverride || false;
                this.signers = this.pramsData.signers;
                this.prompt();
                this.signTx();
            });
        });
        window.onbeforeunload = () => {
            this.chrome.windowCallback({
                error: ERRORS.CANCELLED,
                return: requestTargetN3.Invoke,
                ID: this.messageID
            });
        };
    }

    private async resolveSign() {
        this.loading = true;
        this.loadingMsg = 'Wait';
        if (this.tx === null) {
            return;
        }
        try {
            const wif = this.neon.WIFArr[
                this.neon.walletArr.findIndex(item => item.accounts[0].address === this.neon.wallet.accounts[0].address)
            ]
            try {
                this.tx = this.tx.sign(wif, NEO3_MAGIC_NUMBER_TESTNET);
            } catch (error) {
                console.log(error);
            }
            this.txSerialize = this.tx.serialize(true);
            this.loading = false
        } catch (error) {
            this.loading = false;
            this.loadingMsg = '';
            this.global.snackBarTip('verifyFailed', error);
            this.chrome.windowCallback({
                error: ERRORS.DEFAULT,
                return: requestTargetN3.Invoke,
                ID: this.messageID
            });
            window.close();
        }
    }

    private async resolveSend() {
        this.loading = true;
        this.loadingMsg = 'Wait';
        return this.neo3Invoke.sendNeo3Tx(
            this.neo3Invoke.hexToBase64(this.tx.serialize(true))
        ).then(async txHash => {
            if (
                !txHash || !txHash.startsWith('0x')
            ) {
                throw {
                    msg: 'Transaction rejected by RPC node.'
                };
            }
            this.loading = false;
            this.loadingMsg = ''
            this.chrome.windowCallback({
                data: {
                    txid: txHash,
                    nodeUrl: `${this.global.Neo3RPCDomain}`
                },
                return: requestTargetN3.Invoke,
                ID: this.messageID
            });
            this.chrome.getWallet().subscribe(async wallet => {
                const symbolRes = await this.rpcClient.invokeFunction(this.scriptHash, 'symbol', []);
                const address = wallet.accounts[0].address;
                const sendTx = {
                    txid: txHash,
                    from: address,
                    to: '',
                    value: 0,
                    block_time: new Date().getTime() / 1000,
                    asset_id: this.scriptHash,
                    symbol: this.base64Decod(symbolRes.stack[0].value),
                    id: -1
                };
                this.chrome.getTransactions().subscribe(transactions => {
                    let addressTxs = transactions[address] ? transactions[address] : [];
                    addressTxs = [...addressTxs]
                    transactions[address] = [sendTx, ...addressTxs];
                    this.chrome.setTransactions(transactions);
                });
            });
            const setData = {};
            setData[`N3${this.net}TxArr`] = await this.chrome.getLocalStorage(`N3${this.net}TxArr`) || [];
            setData[`N3${this.net}TxArr`].push(txHash);
            this.chrome.setLocalStorage(setData);
            this.router.navigate([{
                outlets: {
                    transfer: ['transfer', 'result']
                }
            }]);
        }).catch(err => {
            this.loading = false;
            this.loadingMsg = '';
            this.chrome.windowCallback({
                error: ERRORS.RPC_ERROR,
                return: requestTargetN3.Invoke,
                ID: this.messageID
            });
            this.global.snackBarTip('transferFailed', err.msg || err);
        });
    }

    public confirm() {
        if (!this.tx) {
            this.signTx();
            return;
        }
        if (this.broadcastOverride) {
            this.loading = false;
            this.loadingMsg = '';
            this.chrome.windowCallback({
                data: {
                    txid: this.tx.hash(),
                    signedTx: this.tx.serialize(true)
                },
                return: requestTargetN3.Invoke,
                ID: this.messageID
            });
            this.signTx();
            window.close();
        } else {
            this.resolveSend();
        }
        const saveData = this.invokeArgsArray.filter(item => item.messageID !== this.messageID);
        this.chrome.setInvokeArgsArray(saveData);
    }

    public editFee() {
        this.dialog.open(PopupEditFeeDialogComponent, {
            panelClass: 'custom-dialog-panel',
            data: {
                fee: this.fee,
                minFee: this.minFee
            }
        }).afterClosed().subscribe(res => {
            if (res !== false) {
                this.signTx();
            }
        })
    }

    public exit() {
        this.chrome.windowCallback({
            error: ERRORS.CANCELLED,
            return: requestTargetN3.Invoke,
            ID: this.messageID
        });
        window.close();
    }

    private signTx() {
        setTimeout(() => {
            this.loading = true;
            this.neo3Invoke.createNeo3Tx({
                invokeArgs: this.invokeArgs,
                signers: this.signers,
                networkFee: this.fee,
            }).subscribe((unSignTx: Transaction) => {
                this.systemFee = unSignTx.systemFee.toString();
                this.networkFee = unSignTx.networkFee.toString();
                this.tx = unSignTx;
                this.resolveSign();
            }, error => {
                console.log(error);
                if (error.type === 'rpcError') {
                    this.global.snackBarTip('rpcError');
                } else if (error.type === 'scriptError') {
                    this.global.snackBarTip('checkInput');
                }
                this.loading = false;
                this.chrome.windowCallback({
                    error: error.data,
                    return: requestTargetN3.Invoke,
                    ID: this.messageID
                });
            });
        }, 0);
    }

    private prompt() {
        if (this.signers[0].scopes === tx.WitnessScope.Global) {
            this.dialog.open(PopupDapiPromptComponent, {
                panelClass: 'custom-dialog-panel',
                data: {
                    scopes: this.signers[0].scopes
                }
            }).afterClosed().subscribe(() => { });
        }
    }

    public getUrlArgStr(){
        const q=location.search.substr(1);
        const qs=q.split('&');
        let argStr='';
        if(qs){
          // tslint:disable-next-line:prefer-for-of
          for(let i=0;i < qs.length; i++){
            argStr+=qs[i].substring(0,qs[i].indexOf('='))+'='+qs[i].substring(qs[i].indexOf('=')+1)+'&';
          }
        }
        return argStr;
    }

    public base64Decod(value: string): string {
        return decodeURIComponent(window.atob(value));
    }
}
