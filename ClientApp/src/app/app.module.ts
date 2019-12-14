// angular
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

//material
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatAutocompleteModule, MatDividerModule, MatFormFieldModule} from "@angular/material";
import {MatInputModule} from '@angular/material';

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
import {EthModule} from "./ethereum/eth.module";
import {environment} from "../environments/environment";

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
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

    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot([]),

    // Instrumentation must be imported after importing StoreModule (config is optional)
    StoreDevtoolsModule.instrument({
      name: 'Ether Smart Contract State',
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode
    }),

    EthModule //TODO: Maybe try to remove this from here!! Use the Router like the other example!

  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
