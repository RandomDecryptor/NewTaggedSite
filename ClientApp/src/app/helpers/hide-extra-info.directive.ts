import {Directive, OnInit, TemplateRef, ViewContainerRef} from '@angular/core';
import {environment} from "../../environments/environment";

/**
 * Structural Directive to hide extra info according to environment config.
 *
 * Example: <div *appHideExtraInfo></div>
 */
@Directive({
    selector: '[appHideExtraInfo]'
})
export class HideExtraInfoDirective implements OnInit {

    constructor(private templateRef: TemplateRef<any>, private viewContainerRef: ViewContainerRef) {
    }

    ngOnInit(): void {
        if (environment.extraInfo) {
            //Extra info is to show:
            this.viewContainerRef.createEmbeddedView(this.templateRef);
        }
    }
}
