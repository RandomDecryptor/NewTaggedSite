// angular
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

//material
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {
    MatAutocompleteModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule, MatListModule
} from "@angular/material";

import {MatTableModule} from '@angular/material/table';

import { FlexLayoutModule } from '@angular/flex-layout';

// routing
import { AppRoutingModule } from './app-routing.module';


// Store
// NgRx
import { reducers, metaReducers } from './reducers';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { StoreRouterConnectingModule } from '@ngrx/router-store';


// components
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatGridListModule } from '@angular/material/grid-list';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import {EthModule} from "./ethereum/eth.module";

import {environment} from "../environments/environment";
import {TagMainContractModule} from "./tagmaincontract/tag-main-contract.module";
import { RestrictToDirective } from './inputs/restrict-to.directive';
import { ColorizeAddressPipe } from "./colorize/colorize-address.pipe";
import { TagCreationDialogComponent } from './creation/dialog/tag-creation-dialog.component';

import { WeiToEtherPipe } from './pipes/wei-to-ether.pipe';

import {ToastrModule} from "ngx-toastr";
import {TaggingComponent} from "./tagging/panel/tagging.component";
import {EscapeHtmlPipe} from "./pipes/keep-html.pipe";
import {ContrastCheckerService} from "./colorize/contrast-checker.service";

import {OverlayModule} from '@angular/cdk/overlay';
import { ConnectionStatusComponent } from './connection-status/connection-status.component';
import { OneConnectionStatusComponentComponent } from './connection-status/one-connection-status-component/one-connection-status-component.component';
import { SmallInfoOverlayComponent } from './connection-status/small-info-overlay/small-info-overlay.component';
import { ConnectWalletComponent } from './connection-status/connect-wallet/connect-wallet.component';
import { ConnectEthereumNetworkComponent } from './connection-status/connect-ethereum-network/connect-ethereum-network.component';
import { YourTagsComponent } from './consultation/your-tags/your-tags.component';

import { enableAkitaProdMode } from '@datorama/akita';
import {AkitaNgDevtools} from '@datorama/akita-ngdevtools';
import {RemoveTaggingComponent} from "./remove-tagging/panel/remove-tagging.component";
import {TaggedContractAddress} from "./services/tokens";

if (environment.production) {
    enableAkitaProdMode();
}
​
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    RestrictToDirective,
    ColorizeAddressPipe,
    EscapeHtmlPipe,
    TagCreationDialogComponent,
    WeiToEtherPipe,
    TaggingComponent,
    ConnectionStatusComponent,
    OneConnectionStatusComponentComponent,
    SmallInfoOverlayComponent,
    ConnectWalletComponent,
    ConnectEthereumNetworkComponent,
    YourTagsComponent,
    RemoveTaggingComponent,
  ],
    entryComponents: [
        TagCreationDialogComponent, //Dialog component will be instantiated dynamically by the Dialog service!
        ConnectionStatusComponent, //Overlay component will be instantiated dynamically by the Overlay service!
        OneConnectionStatusComponentComponent, //Overlay component will be instantiated dynamically by the Overlay service!
        SmallInfoOverlayComponent, //Overlay component will be instantiated dynamically by the Overlay service!
        ConnectWalletComponent, //Overlay component will be instantiated dynamically by the Overlay service!
        ConnectEthereumNetworkComponent, //Overlay component will be instantiated dynamically by the Overlay service!
    ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatDividerModule,
        MatGridListModule,
        MatButtonModule,
        MatTableModule,
        MatSlideToggleModule,
        FlexLayoutModule,
        //MatSnackBarModule,
        OverlayModule,
        ToastrModule.forRoot(), // ToastrModule added

        StoreModule.forRoot(reducers, {metaReducers}),
        EffectsModule.forRoot([]),

        // Instrumentation must be imported after importing StoreModule (config is optional)
        StoreDevtoolsModule.instrument({
            name: 'Ether Smart Contract State',
            maxAge: 25, // Retains last 25 states
            logOnly: environment.production, // Restrict extension to log-only mode
        }),

        EthModule, //TODO: Maybe try to remove this from here!! Use the Router like the other example!
        TagMainContractModule, //TODO: Maybe try to remove this from here!! Use the Router like the other example!
        MatDialogModule,
        MatListModule,
        environment.production ? [] : AkitaNgDevtools.forRoot()

    ],
  providers: [
      ContrastCheckerService,
      //{ provide: TaggedContractAddress, useValue: '0x0abd22a6c3f56d1ed0ad441db9be08291fa7cafe' } //Test Net Ropsten Contract Address
      //{ provide: TaggedContractAddress, useValue: '0x0824a71C5F61DC213Eb7c5830192a311F079Da09' } //Ganache Local Network Test new-tagged (New Value: Complete Contract Redeployed!)
      { provide: TaggedContractAddress, useValue: '0xdBaF944889A03715a9BC26590899109cb6dA134b' } //ganache-cli Local Network Test newtagged4 (New Value: Complete Contract Redeployed!)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
