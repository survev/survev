import $ from "jquery";
import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";
import type { EmoteDef } from "../../../shared/defs/gameObjects/emoteDefs";
import { PassDefs } from "../../../shared/defs/gameObjects/passDefs";
import { QuestDefs } from "../../../shared/defs/gameObjects/questDefs";
import { math } from "../../../shared/utils/math";
import type { Account } from "../account";
import { helpers } from "../helpers";
import type { LoadoutMenu } from "./loadoutMenu";
import type { Localization } from "./localization";
import { passUtil } from "./passUtil";

function i(e: string, t: number) {
    for (let r = PassDefs[e], a = 0; a < r.items.length; a++) {
        if (r.items[a].level == t + 1) {
            return r.items[a].item;
        }
    }
    return "";
}
function humanizeTime(time: number, minutesFloor = false) {
    // const minutesFloor =
    //     arguments.length > 1 &&
    //     arguments[1] !== undefined &&
    //     arguments[1];
    const hours = Math.floor(Math.ceil(time / 60) / 60);
    const minutes = minutesFloor ? Math.floor(time / 60) % 60 : Math.ceil(time / 60) % 60;
    Math.floor(time);
    let timeText = "";
    if (hours > 0) {
        timeText += `${hours}h `;
    }
    return (timeText += `${minutes}m`);
}

export class Pass {
    pass = {
        data: {
            type: "pass_survivr1",
        },
        currentXp: 0,
        currentLevel: 1,
        levelXp: 0,
        ticker: 0,
        animSteps: [] as Array<{
            startXp: number;
            targetXp: number;
            levelXp: number;
            targetLevel: number;
        }>,
        elems: {},
    };

    quests: Array<{
        data: {
            idx: number;
            type: string;
            complete: boolean;
            progress: number;
            target: number;
            rerolled: boolean;
        };
        start: number;
        current: number;
        ticker: number;
        delay: number;
        playCompleteAnim: boolean;
        progressAnimFinished: boolean;
        completeAnimFinished: boolean;
        shouldRequestRefresh: boolean;
        refreshTime: number;
        refreshSet: boolean;
        refreshEnabled: boolean;
        timer: {
            enabled: boolean;
            str: string;
            displayed: boolean;
        };
        elems: Record<string, JQuery<HTMLElement>>;
        // elems: {
        //     main: JQuery<HTMLElement>;
        //     xp: JQuery<HTMLElement>;
        //     info: JQuery<HTMLElement>;
        //     desc: JQuery<HTMLElement>;
        //     cur: JQuery<HTMLElement>;
        //     target: JQuery<HTMLElement>;
        //     refresh: JQuery<HTMLElement>;
        //     refreshPrompt: JQuery<HTMLElement>;
        //     refreshConfirm: JQuery<HTMLElement>;
        //     refreshCancel: JQuery<HTMLElement>;
        //     counter: JQuery<HTMLElement>;
        //     barFill: JQuery<HTMLElement>;
        //     timer: JQuery<HTMLElement>;
        //     loading: JQuery<HTMLElement>;
        // }
    }> = [];

    loaded = false;
    lockDisplayed = false;
    updatePass = false;
    updatePassTicker = 0;

    constructor(
        public account: Account,
        public loadoutMenu: LoadoutMenu,
        public localization: Localization,
    ) {
        this.account = account;
        this.loadoutMenu = loadoutMenu;
        this.localization = localization;

        this.account.addEventListener("request", this.onRequest.bind(this));
        this.account.addEventListener("pass", this.onPass.bind(this));
        this.loadPlaceholders();
        $("#pass-progress-unlock-wrapper")
            .on("mouseenter", () => {
                $("#pass-unlock-tooltip").fadeIn(50);
            })
            .on("mouseleave", () => {
                $("#pass-unlock-tooltip").fadeOut(50);
            });
    }

    onPass(pass: any, quests: any[], resetRefresh: boolean) {
        const refreshOffset = 5 * 1000;
        const newQuests = [];
        let questAnimCount = 0;
        for (let p = 0; p < quests.length; p++) {
            ((e) => {
                const questData = quests[e];
                const quest = {
                    data: questData,
                    start: 0,
                    current: 0,
                    ticker: 0,
                    delay: questAnimCount * 0.5,
                    playCompleteAnim: false,
                    progressAnimFinished: false,
                    completeAnimFinished: false,
                    shouldRequestRefresh: resetRefresh,
                    refreshTime: Date.now() + questData.timeToRefresh + refreshOffset,
                    refreshSet: false,
                    refreshEnabled: false,
                    timer: {
                        enabled: false,
                        str: "",
                    },
                } as (typeof this.quests)[number];
                const curQuest = this.quests.find((x) => {
                    return x.data.idx == quest.data.idx && x.data.type == quest.data.type;
                });

                if (curQuest) {
                    quest.start = curQuest.current;
                    quest.current = curQuest.current;
                    if (!curQuest.data.complete && quest.data.complete) {
                        quest.playCompleteAnim = true;
                    }
                }
                quest.data.progress = math.min(quest.data.progress, quest.data.target);
                if (quest.data.progress > quest.current) {
                    questAnimCount++;
                }
                const fixedQuestElem = $(`#pass-quest-${quest.data.idx}`);
                quest.elems = {
                    main: fixedQuestElem,
                    xp: fixedQuestElem.find(".pass-quest-xp"),
                    info: fixedQuestElem.find(".pass-quest-info"),
                    desc: fixedQuestElem.find(".pass-quest-desc"),
                    cur: fixedQuestElem.find(".pass-quest-counter-current"),
                    target: fixedQuestElem.find(".pass-quest-counter-target"),
                    refresh: fixedQuestElem.find(".pass-quest-refresh"),
                    refreshPrompt: fixedQuestElem.find(".pass-quest-refresh-prompt"),
                    refreshConfirm: fixedQuestElem.find(".pass-quest-refresh-confirm"),
                    refreshCancel: fixedQuestElem.find(".pass-quest-refresh-cancel"),
                    counter: fixedQuestElem.find(".pass-quest-counter"),
                    barFill: fixedQuestElem.find(".pass-quest-bar-fill"),
                    timer: fixedQuestElem.find(".pass-quest-timer"),
                    loading: fixedQuestElem.find(".pass-quest-spinner"),
                };
                quest.elems.barFill.clearQueue();
                quest.elems.main.removeClass("pass-bg-pulse");
                quest.elems.main.stop().css({
                    opacity: 1,
                });
                quest.elems.xp.removeClass("pass-text-pulse");
                quest.elems.refresh.stop().css({
                    opacity: 1,
                });
                quest.elems.counter.stop().css({
                    opacity: 1,
                });

                // Initialize quest UI
                const questDef = QuestDefs[quest.data.type];
                const title =
                    this.localization.translate(`${quest.data.type}`) || quest.data.type;
                const pct = (quest.current / quest.data.target) * 100;
                quest.elems.main.css("display", "block");
                quest.elems.desc.html(title);
                quest.elems.cur.html(Math.round(quest.current));
                quest.elems.xp.html(`${questDef.xp} XP`);
                quest.elems.barFill.css({
                    width: `${pct}%`,
                });
                quest.elems.loading.css("display", "none");

                // Humanize time for timed quests
                let targetText: string | number = quest.data.target;
                if (questDef.timed) {
                    targetText = humanizeTime(targetText);
                }

                quest.elems.target.html(targetText);
                if (questDef.icon) {
                    quest.elems.desc.addClass("pass-quest-desc-icon");
                    quest.elems.desc.css({
                        "background-image": `url(${questDef.icon})`,
                    });
                } else {
                    quest.elems.desc.removeClass("pass-quest-desc-icon");
                    quest.elems.desc.attr("style", "");
                }
                this.setQuestRefreshEnabled(quest);
                newQuests.push(quest);
            })(p);
        }
        this.quests = newQuests;
        this.pass.data = pass;
        this.pass.animSteps = [];
        this.pass.currentXp = Math.round(this.pass.currentXp);
        this.pass.levelXp = passUtil.getPassLevelXp(pass.type, this.pass.currentLevel);
        if (!this.loaded) {
            const u = passUtil.getPassLevelXp(pass.type, pass.level);
            this.pass.currentXp = 0;
            this.pass.currentLevel = pass.level;
            this.pass.levelXp = u;
            this.pass.ticker = 0;
        }
        let level = this.pass.currentLevel;
        let xp = this.pass.currentXp;
        // Animate level-ups

        if (this.loaded) {
            while (level < pass.level) {
                const levelXp = passUtil.getPassLevelXp(pass.type, level);
                this.pass.animSteps.push({
                    startXp: xp,
                    targetXp: levelXp,
                    levelXp,
                    targetLevel: level + 1,
                });
                level++;
                xp = 0;
            }
            const delay = questAnimCount > 0 ? 2 : 0;
            this.pass.ticker = -delay;
        }

        // Animate leftover xp
        const levelXp = passUtil.getPassLevelXp(pass.type, level);
        this.pass.animSteps.push({
            startXp: xp,
            targetXp: pass.xp,
            levelXp,
            targetLevel: level,
        });
        $("#pass-block").css("z-index", "1");
        $("#pass-locked").css("display", "none");
        $("#pass-loading").css("display", "none");
        const b = i(this.pass.data.type, this.pass.currentLevel);
        this.setPassUnlockImage(b);
        const x = this.localization.translate(pass.type).toUpperCase();
        $("#pass-name-text").html(x);
        $("#pass-progress-level").html(this.pass.currentLevel);
        $("#pass-progress-xp-current").html(this.pass.currentXp);
        $("#pass-progress-xp-target").html(this.pass.levelXp);
        const pct = (this.pass.currentXp / this.pass.levelXp) * 100;
        $("#pass-progress-bar-fill").css({
            width: `${pct}%`,
        });
        this.loaded = true;
    }

    onRequest(account: Account) {
        $("#pass-loading").css("display", account.loggingIn ? "block" : "none");
    }

    scheduleUpdatePass(delay: number) {
        this.updatePass = true;
        this.updatePassTicker = delay;
    }

    setQuestRefreshEnabled(e: (typeof this.quests)[number]) {
        const r =
            (!e.data.rerolled && !e.data.complete) || e.refreshTime - Date.now() < 0;
        if (r != e.refreshEnabled || !e.refreshSet) {
            e.refreshEnabled = r;
            e.refreshSet = true;
            e.elems.refresh.off("click");
            e.elems.refreshConfirm.off("click");
            e.elems.refreshCancel.off("click");
            if (e.refreshEnabled) {
                e.elems.refreshConfirm.on("click", () => {
                    e.elems.loading.css("display", "block");
                    e.elems.refreshPrompt.css("display", "none");
                    this.account.refreshQuest(e.data.idx);
                });
                e.elems.refreshCancel.on("click", () => {
                    e.elems.refreshPrompt.css("display", "none");
                    e.elems.info.css("display", "block");
                });
                e.elems.refresh.on("click", () => {
                    e.elems.refreshPrompt.css("display", "block");
                    e.elems.info.css("display", "none");
                });
                e.elems.refresh.removeClass("pass-quest-refresh-disabled");
            } else {
                e.elems.refresh.addClass("pass-quest-refresh-disabled");
            }
        }
    }

    setPassUnlockImage(item: string) {
        const t = GameObjectDefs[item] as EmoteDef;
        const r = t ? helpers.getSvgFromGameType(item) : "img/emotes/surviv.svg";
        const a = `url(${r})`;
        const i = helpers.getCssTransformFromGameType(item);
        $("#pass-progress-unlock").css({
            opacity: t ? 1 : 0.15,
            transform: `translate(-50%, -50%) ${i}`,
        });
        $("#pass-progress-unlock-image").css({
            "background-image": a,
        });
        const o = t
            ? this.localization
                  .translate(
                      `loadout-title-${this.loadoutMenu.getCategory(t.type)!.loadoutType}`,
                  )
                  .toUpperCase()
            : "";
        const s = $("#pass-unlock-tooltip");
        s.css("opacity", t ? 1 : 0);
        s.find(".tooltip-pass-title").html(o);
        s.find(".tooltip-pass-desc").html(t ? t.name! : "");
        const c = t ? `url(${this.loadoutMenu.getCategory(t.type)!.categoryImage})` : "";
        $("#pass-progress-unlock-type-image").css({
            "background-image": c,
        });
        $("#pass-progress-unlock-type-wrapper").css({
            display: t ? "block" : "none",
        });
    }

    animatePassLevelUp() {
        const t = $("#pass-progress-bar-fill");
        const r = $("#pass-progress-level");
        const a = $("#pass-progress-unlock-wrapper");
        const o = $("#pass-progress-unlock-image");
        const s = $("#pass-progress-unlock-type-image");
        r.html(this.pass.currentLevel);
        t.queue((e) => {
            a.addClass("pass-unlock-pulse");
            $(e).dequeue();
        })
            .delay(750)
            .queue((e) => {
                o.animate(
                    {
                        opacity: 0,
                    },
                    250,
                );
                s.animate(
                    {
                        opacity: 0,
                    },
                    250,
                );
                $(e).dequeue();
            })
            .delay(250)
            .queue((t) => {
                const r = i(this.pass.data.type, this.pass.currentLevel);
                this.setPassUnlockImage(r);
                a.removeClass("pass-unlock-pulse");
                o.animate(
                    {
                        opacity: 1,
                    },
                    250,
                );
                s.animate(
                    {
                        opacity: 1,
                    },
                    250,
                );
                $(t).dequeue();
            });
    }

    animateQuestComplete(quest: (typeof this.quests)[number]) {
        quest.elems.barFill
            .queue((el) => {
                quest.elems.main.addClass("pass-bg-pulse");
                quest.elems.xp.addClass("pass-text-pulse");
                quest.elems.refresh.animate(
                    {
                        opacity: 0.25,
                    },
                    250,
                );
                quest.elems.refresh.removeClass("pass-quest-refresh-disabled");
                quest.elems.refresh.animate(
                    {
                        opacity: 0,
                    },
                    250,
                );
                quest.elems.counter.animate(
                    {
                        opacity: 0,
                    },
                    250,
                );
                quest.elems.desc.html("QUEST COMPLETE!");
                $(el).dequeue();
            })
            .delay(1000)
            .queue((el) => {
                quest.elems.main.animate(
                    {
                        opacity: 0,
                    },
                    750,
                );
                $(el).dequeue();
            });
    }

    update(dt: number) {
        this.updatePassTicker -= dt;

        if (this.updatePass && this.updatePassTicker < 0) {
            this.updatePass = false;
            this.account.getPass(false);
        }
        for (let i = 0; i < this.quests.length; i++) {
            const fixedQuest = this.quests[i];
            this.setQuestRefreshEnabled(fixedQuest);
            fixedQuest.ticker += dt;
            if (!fixedQuest.progressAnimFinished) {
                const a = math.clamp((fixedQuest.ticker - fixedQuest.delay) / 1, 0, 1);
                fixedQuest.current = math.lerp(
                    math.easeOutExpo(a),
                    fixedQuest.start,
                    fixedQuest.data.progress,
                );
                const pctComplete = (fixedQuest.current / fixedQuest.data.target) * 100;

                // Humanize time for timed quests
                const questDef = QuestDefs[fixedQuest.data.type];
                let currentText: number | string = Math.round(fixedQuest.current);
                if (questDef.timed) {
                    currentText = humanizeTime(currentText, true);
                }
                fixedQuest.elems.cur.html(currentText);
                fixedQuest.elems.barFill.css({
                    width: `${pctComplete}%`,
                });
                if (a >= 1) {
                    fixedQuest.progressAnimFinished = true;
                }
            }
            if (
                fixedQuest.playCompleteAnim &&
                !fixedQuest.completeAnimFinished &&
                fixedQuest.ticker - fixedQuest.delay > 1.25
            ) {
                this.animateQuestComplete(fixedQuest);
                fixedQuest.completeAnimFinished = true;
            }
            const m =
                !fixedQuest.playCompleteAnim ||
                (fixedQuest.completeAnimFinished &&
                    fixedQuest.ticker - fixedQuest.delay > 4.25);
            if (
                fixedQuest.data.complete &&
                m &&
                fixedQuest.refreshEnabled &&
                fixedQuest.shouldRequestRefresh
            ) {
                fixedQuest.shouldRequestRefresh = false;
                this.account.refreshQuest(fixedQuest.data.idx);
            }
            const p = fixedQuest.data.complete && m;
            if (p != fixedQuest.timer.displayed) {
                fixedQuest.timer.displayed = p;
                fixedQuest.elems.main.removeClass("pass-bg-pulse");
                fixedQuest.elems.main.stop().animate(
                    {
                        opacity: 1,
                    },
                    250,
                );
                const h = fixedQuest.elems.refreshPrompt.css("display") == "block";
                fixedQuest.elems.info.css("display", p || h ? "none" : "block");
                fixedQuest.elems.timer.css("display", p ? "block" : "none");
            }
            if (p) {
                const u = Math.max(fixedQuest.refreshTime - Date.now(), 0);
                const g = humanizeTime(u / 1000);
                if (g != fixedQuest.timer.str) {
                    fixedQuest.timer.str = g;
                    fixedQuest.elems.timer.html(g);
                }
            }
        }
        this.pass.ticker += dt;
        if (this.pass.animSteps.length > 0 && this.pass.ticker >= 0) {
            const y = this.pass.animSteps[0];
            const w = math.clamp(this.pass.ticker / 1.5, 0, 1);
            this.pass.currentXp = math.lerp(math.easeOutExpo(w), y.startXp, y.targetXp);
            this.pass.levelXp = y.levelXp;
            const f = (this.pass.currentXp / y.levelXp) * 100;
            $("#pass-progress-xp-current").html(Math.round(this.pass.currentXp));
            $("#pass-progress-xp-target").html(this.pass.levelXp);
            $("#pass-progress-bar-fill").css({
                width: `${f}%`,
            });
            if (w >= 1) {
                if (y.targetLevel > this.pass.currentLevel) {
                    this.pass.currentLevel = y.targetLevel;
                    this.animatePassLevelUp();
                }
                this.pass.animSteps.shift();
                this.pass.ticker -= 3;
            }
        }
        if (!this.account.loggingIn && !this.account.loggedIn && !this.lockDisplayed) {
            $("#pass-block").css("z-index", "1");
            $("#pass-loading").css("display", "none");
            $("#pass-locked").css("display", "block");
            this.lockDisplayed = true;
        }
    }

    onResize() {}
    loadPlaceholders() {
        const def = PassDefs.pass_survivr1;
        const passName = this.localization.translate("pass_survivr1").toUpperCase();
        $("#pass-name-text").html(passName);
        $("#pass-progress-level").html(1);
        $("#pass-progress-xp-current").html(0);
        $("#pass-progress-xp-target").html(def.xp[0]);
        this.setPassUnlockImage(def.items[0].item);
    }
}
