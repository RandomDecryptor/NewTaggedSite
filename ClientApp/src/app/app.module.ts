// angular
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

//material
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatAutocompleteModule, MatDividerModule, MatFormFieldModule} from "@angular/material";
import {MatInputModule} from '@angular/material';

// routing
import { AppRoutingModule } from './app-routing.module';

// components
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatGridListModule } from '@angular/material/grid-list';

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
    MatGridListModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
