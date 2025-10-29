import { math } from "@survev/shared/utils/math";
import type { AudioManager } from "./audioManager";
import type { SoundHandle } from "./lib/createJS";

export class Ambiance {
    introMusic = true;
    soundUpdateThrottle = 0;
    tracks: Array<{
        name: string;
        sound: string;
        channel: string;
        immediateMode: boolean;
        inst: SoundHandle | null;
        instSound: string;
        filter: string;
        weight: number;
        volume: number;
    }>;

    trackToIdx: Record<string, number>;
    initTime: number;

    constructor() {
        this.tracks = [];
        this.trackToIdx = {};
        const addTrack = (
            name: string,
            sound: string,
            channel: string,
            immediateMode: boolean,
        ) => {
            this.tracks.push({
                name,
                sound,
                channel,
                immediateMode,
                inst: null,
                instSound: "",
                filter: "",
                weight: 0,
                volume: 0,
            });
            this.trackToIdx[name] = this.tracks.length - 1;
        };
        // Added in order of weight from least to greatest
        addTrack("music", "menu_music", "music", false);
        addTrack("wind", "ambient_wind_01", "ambient", false);
        addTrack("river", "ambient_stream_01", "ambient", false);
        addTrack("waves", "ambient_waves_01", "ambient", false);
        addTrack("interior_0", "", "ambient", true);
        addTrack("interior_1", "", "ambient", true);
        this.initTime = Date.now();
    }

    getTrack(name: string) {
        return this.tracks[this.trackToIdx[name]];
    }

    onGameStart() {
        this.introMusic = false;
        for (let i = 0; i < this.tracks.length; i++) {
            this.tracks[i].weight = 0;
        }
        this.getTrack("wind").weight = 1;
        this.soundUpdateThrottle = 0;
    }

    onGameComplete(_audioManager: AudioManager) {
        for (let i = 0; i < this.tracks.length; i++) {
            const track = this.tracks[i];
            if (track.immediateMode) {
                track.weight = 0;
            }
        }
        this.getTrack("river").weight = 0;
    }

    update(dt: number, audioManager: AudioManager, _inGame: boolean) {
        let updateVolume = false;
        this.soundUpdateThrottle -= dt;
        if (this.soundUpdateThrottle <= 0) {
            this.soundUpdateThrottle = 0.2;
            updateVolume = true;
        }
        let totalVolume = 0;
        for (let i = this.tracks.length - 1; i >= 0; i--) {
            const track = this.tracks[i];
            // Start sound if it's loaded

            if (
                !track.inst &&
                track.sound &&
                audioManager.isSoundLoaded(track.sound, track.channel)
            ) {
                console.log("Start track", track.sound, track.channel);
                track.inst = audioManager.playSound(track.sound, {
                    channel: track.channel,
                    startSilent: true,
                    loop: track.channel == "ambient",
                    forceStart: true,
                    filter: track.filter,
                    forceFilter: true,
                });
                track.instSound = track.sound;
                if (i == 0) {
                    console.log("Play delay", Date.now() - this.initTime);
                }
            }

            // Update sound volume
            if (track.inst && updateVolume) {
                // Compute volume based on weight
                const volume = track.weight * (1 - totalVolume);
                totalVolume += volume;
                track.volume = volume;
                const defVolume = audioManager.getSoundDefVolume(
                    track.sound,
                    track.channel,
                );
                audioManager.setVolume(track.inst, volume * defVolume, track.channel);
            }

            // Stop sound if it's no longer set and audible, or
            // of the track name has changed
            if (
                track.inst &&
                ((!track.sound && math.eqAbs(audioManager.getVolume(track.inst), 0)) ||
                    (track.sound && track.sound != track.instSound))
            ) {
                console.log("Stop track", track.name, track.channel);
                audioManager.stopSound(track.inst);
                track.inst = null;
                track.instSound = "";
            }

            // Reset immediate-mode sounds
            if (track.immediateMode) {
                track.sound = "";
                track.weight = 0;
            }
        }
        if (this.introMusic) {
            // Fade in the music track
            const music = this.getTrack("music");
            if (music.inst) {
                music.weight = math.min(music.weight + dt, 1);
            }

            // Fade in wind after the music finishes playing
            const wind = this.getTrack("wind");
            if (music.inst && !audioManager.isSoundPlaying(music.inst)) {
                wind.weight = math.min(wind.weight + dt, 1);
            }
        }
    }
}
