import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

//NGRX
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { reducers } from './tag-main-contract.reducers';
import { TagMainContractEffects } from './tag-main-contract.effects';

// Services
import { TagMainContractService } from './tag-main-contract.services';
import {TagContractService} from "./tagcontract/tag-contract.services";

//import { AttackChangeComponent } from './components/attack-change/attack-change.component';

/*
const routes: Routes = [

  {
      path: '',
      component: AttackChangeComponent,
  },

];
*/

@NgModule({
//  declarations: [AttackChangeComponent],
//  exports: [AttackChangeComponent],   // we use it from home.component which is defined in app.module
  imports: [
    CommonModule,
    ReactiveFormsModule,

    //RouterModule.forChild(routes),

    StoreModule.forFeature('tagMainContractState', reducers),
    EffectsModule.forFeature([TagMainContractEffects])
  ],
  providers: [TagMainContractService, TagContractService]
})
export class TagMainContractModule { }
