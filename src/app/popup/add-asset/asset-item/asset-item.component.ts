import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Balance, NEO, GAS, EXT, EDS, Asset } from '@/models/models';
import { GlobalService } from '@/app/core';
import { NEO3_CONTRACT, GAS3_CONTRACT } from '@popup/_lib';

@Component({
    selector: 'app-asset-item',
    templateUrl: './asset-item.component.html',
    styleUrls: ['./asset-item.component.scss']
})
export class PopupAssetItemComponent implements OnInit {
    @Input() asset: Asset;
    @Input() index: number;
    @Input() isSearchAssets: boolean;

    // tslint:disable-next-line:no-output-on-prefix
    @Output() onAddAsset = new EventEmitter<any>();

    constructor(public global: GlobalService) {}

    ngOnInit(): void {}

    public fixed() {
        return [NEO, GAS, NEO3_CONTRACT, GAS3_CONTRACT].indexOf(this.asset.asset_id) >= 0;
    }

    public addAsset(index: number) {
        this.onAddAsset.emit(index);
    }
}
