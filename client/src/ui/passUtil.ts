import { PassDefs } from "@survev/shared/defs/gameObjects/passDefs";

const passMaxLevel = 99;

export const passUtil = {
    getPassMaxLevel: function () {
        return passMaxLevel;
    },
    getPassLevelXp: function (passType: string, level: number) {
        const passDef = PassDefs[passType];
        const levelIdx = level - 1;
        if (levelIdx < passDef.xp.length) {
            return passDef.xp[levelIdx];
        }
        return passDef.xp[passDef.xp.length - 1];
    },
    getPassLevelAndXp: function (passType: string, passXp: number) {
        let xp = passXp;
        let level = 1;
        while (level < passMaxLevel) {
            const levelXp = passUtil.getPassLevelXp(passType, level);
            if (xp < levelXp) {
                break;
            }
            xp -= levelXp;
            level++;
        }
        return {
            level,
            xp,
            nextLevelXp: passUtil.getPassLevelXp(passType, level),
        };
    },
    timeUntilQuestRefresh: function (timeAcquired: number) {
        return (
            Math.floor((timeAcquired - 25200000 + 86400000 - 1) / 86400000) * 86400000 +
            25200000 -
            Date.now()
        );
    },
};
