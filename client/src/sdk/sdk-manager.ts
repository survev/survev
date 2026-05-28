import type { Application } from "../main";

export class SDKManager {
    isPoki = false;
    isCrazyGames = false;
    isGameMonetize = false;
    isSpellSync = false;
    isAnySDK = false;

    respawns: number[] = [];

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

    async getPlayerName(): Promise<string | undefined> {
        return undefined;
    }

    hideInviteButton() {}

    showInviteButton(roomID: string) {}

    supportsInviteLink() {
        return false;
    }

    async getInviteLink(_roomID: string): Promise<string | undefined> {
        return undefined;
    }

    getRoomInviteParam() {
        return undefined;
    }

    async requestAd(ad: string): Promise<void> {}

    removeAllAds() {}

    enterMenuAdState(): void {}

    enterGameplayAdState(): void {}

    enterDeathAdState(): void {}

    async ensureNitroReady(): Promise<void> {}

    showNitroPlacements(_placementIDs: string[]): void {}

    hideNitroPlacementsById(_placementIDs: string[]): void {}

    showLoadoutAd(): void {}

    hideLoadoutAd(): void {}
}
