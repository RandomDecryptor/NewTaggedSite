import {Directive, HostListener, Input} from '@angular/core';

@Directive({
    selector: '[appRestrictTo]'
})
export class RestrictToDirective {

    @Input('appRestrictTo') patternRestrictTo: string;

    @Input('allowControlV') allowControlV = true;

    constructor() {
    }

    @HostListener('keydown', ['$event']) onKeyDown(event: KeyboardEvent) {
        //console.log('!!! Key DOWN!!!:' + event.key + ' Control: ' + event.ctrlKey);
        var re = RegExp(this.patternRestrictTo);
        var exclude = /Backspace|Enter|Tab|Delete|Del|ArrowUp|Up|ArrowDown|Down|ArrowLeft|Left|ArrowRight|Right/;

        if (this.allowControlV && event.ctrlKey && event.key === 'v') {
            console.log('!!! Key DOWN: Allowed Control+V');
            return true;
        }

        if (!exclude.test(event.key) && !re.test(event.key)) {
            event.preventDefault();
            return false;
        }
        //TODO: Pass key to uppercase:
        //event.key = event.key.toUpperCase();
        return true;
    }

}
