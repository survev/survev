import type { Application } from "../main";

export class SDKManager {
    isPoki = false;
    isCrazyGames = false;
    isGameMonetize = false;
    isSpellSync = false;
    isAnySDK = false;

    respawns: number[] = [];
    adCallback = () => {};

    constructor() {}

    async init(app: Application) {}

    disableBloodParticles() {
        return false;
    }

    gameLoadComplete() {}

    gamePlayStart() {}

    gamePlayStop() {}

    requestMidGameAd(callback: () => void): void {
        callback();
    }

    requestFullscreenAd(callback: () => void): void {
        callback();
    }

    // biome-ignore lint/suspicious/useAwait: no op
    async getPlayerName(): Promise<string | undefined> {
        return undefined;
    }

    hideInviteButton() {}

    showInviteButton(roomID: string) {}

    supportsInviteLink() {
        return false;
    }

    // biome-ignore lint/suspicious/useAwait: no op
    async getInviteLink(_roomID: string): Promise<string | undefined> {
        return undefined;
    }

    getRoomInviteParam() {
        return undefined;
    }

    async requestAd(ad: string): Promise<void> {}

    removeAllAds() {}

    showStickyAd(): void {}

    hideStickyAd(): void {}
}
