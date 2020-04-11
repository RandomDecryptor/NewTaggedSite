import {Injectable} from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class GainsSoundService {

    private audioObj = new Audio();

    private static readonly BASE_URL = 'assets/sounds/';

    private static readonly COINS_SOUND_URL = GainsSoundService.BASE_URL + 'coinsound_new.mp3';

    private static readonly SILENT_SOUND_URL = GainsSoundService.BASE_URL + 'silent.mp3';

    constructor() {
    }

    /*
        Appears to not be needed this method. The user just needs to click on the screen somewhere the first time and the browser after that will play the sound.
     */
    public preSensibilizeBrowserToSound() {
        this.playSound(GainsSoundService.SILENT_SOUND_URL);
    }

    public playGainsSound() {
        this.playSound(GainsSoundService.COINS_SOUND_URL);
    }

    private loadSound(url: string) {
        this.audioObj.src = url;
        this.audioObj.load();
    }

    private playSound(url: string) {
        this.loadSound(url);
        this.audioObj.play();
    }

}
