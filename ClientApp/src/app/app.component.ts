import { Component } from '@angular/core';
import {FormControl} from '@angular/forms';
import {MatOptionSelectionChange} from "@angular/material";
import {Observable, of} from 'rxjs';
import {filter, map, startWith, switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  myControl = new FormControl();
  /*
  options: string[][] = [['One', '1'], ['Two', '2'], ['Three', '3']
    ,['Four', '4'], ['Five', '5'], ['Six', '6']
    ,['Seven', '7'], ['Eight', '8'], ['Nine', '9']
    ,['Ten', '10'], ['Eleven', '11'], ['Twelve', '12']
  ];
  */
  options: Observable<string[][]> = of([['One', '1'], ['Two', '2'], ['Three', '3']
    ,['Four', '4'], ['Five', '5'], ['Six', '6']
    ,['Seven', '7'], ['Eight', '8'], ['Nine', '9']
    ,['Ten', '10'], ['Eleven', '11'], ['Twelve', '12']
  ]);
  filteredOptions: Observable<string[][]>;

  ngOnInit() {
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value[0]), //When we set the value as an object/array and not a string it was also coming through here, and in that case we have to filter by the name/value[0] and not the all value.
        //map(value => this._filter(value))
        switchMap(value => this._filter(value))
      );
  }

  private _filter(value: string): Observable<string[][]> {
    console.log('Value Filter: "' + value + '"');
    //Get Value:
    //this.myControl.value
    const filterValue: string = value.toLowerCase();

    //return this.options.filter(option => option[0].toLowerCase().includes(filterValue));
    return this.options.pipe(
      map(
          options => options.filter(option => option[0].toLowerCase().includes(filterValue))
      )
    );
  }

  displayFn(option?: string[]): string | undefined {
    return option ? option[0] : undefined;
  }

  selectionChanged($event: MatOptionSelectionChange, optionSelectedId: string) {
    if($event.source.selected)
      console.log('Options Selected: ' + optionSelectedId);
  }

  fieldCleared() {
    console.log('Field was cleared no option selected now!!');
  }

  autocompletedEventDetected($event) {
    console.log('Field was AutoCompleted!!');
  }

  changeDetected($event) {
    console.log('Field was Changed!!');
  }
}
