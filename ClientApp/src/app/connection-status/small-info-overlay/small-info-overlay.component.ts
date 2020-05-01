import { Component, OnInit } from '@angular/core';

export class InfoData {
    msg: string;
    klass?: string; //CSS extra classes to add
}

@Component({
  selector: 'app-small-info-overlay',
  templateUrl: './small-info-overlay.component.html',
  styleUrls: ['./small-info-overlay.component.scss']
})
export class SmallInfoOverlayComponent implements OnInit {

  constructor(readonly data: InfoData) { }

  ngOnInit() {
  }

}
