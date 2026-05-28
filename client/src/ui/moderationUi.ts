import $ from "jquery";
import { Game } from "../game";
import * as net from "../../../shared/net/net";

const BTN = (label: string, bg: string) =>
    $("<button>")
        .text(label)
        .css({
            background: bg,
            border: "none",
            color: "#fff",
            padding: "3px 9px",
            borderRadius: "3px",
            cursor: "pointer",
            fontSize: "11px",
            fontFamily: "inherit",
            letterSpacing: "0.5px",
            whiteSpace: "nowrap",
        });

export class ModerationUi {
    visible = false;
    game: Game;

    private panel: JQuery;
    private playerListBody!: JQuery;
    private announceSection!: JQuery;
    private announceMsgInput!: JQuery;
    private announceTargetLabel!: JQuery;
    private banSection!: JQuery;
    private banReasonInput!: JQuery;
    private banDaysInput!: JQuery;
    private banTargetLabel!: JQuery;
    private playerCountLabel!: JQuery;
    private announceTarget: string | null = null;
    private banTarget: string | null = null;

    // drag state
    private dragging = false;
    private dragOffsetX = 0;
    private dragOffsetY = 0;

    // popup
    private channel = new BroadcastChannel("mod-panel");
    private popupWindow: Window | null = null;

    constructor(game: Game) {
        this.game = game;
        this.panel = this.buildDom();
        this.setupHandlers();
    }

    private buildDom(): JQuery {
        const panel = $("<div>", { id: "mod-panel" }).css({
            display: "none",
            position: "fixed",
            top: "60px",
            right: "16px",
            width: "380px",
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
            background: "rgba(14, 14, 26, 0.95)",
            border: "1px solid #2a2a3a",
            borderRadius: "6px",
            color: "#eee",
            fontFamily: "'Roboto Condensed', sans-serif",
            fontSize: "13px",
            zIndex: 1000,
            boxShadow: "0 4px 20px rgba(0,0,0,0.7)",
            userSelect: "none",
        });

        // ── Header (draggable) ──────────────────────────────────────────
        const header = $("<div>", { id: "mod-header" }).css({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            background: "rgba(255,255,255,0.04)",
            borderBottom: "1px solid #2a2a3a",
            cursor: "move",
            borderRadius: "6px 6px 0 0",
        });

        $("<span>")
            .text("MODERATION")
            .css({ fontSize: "11px", letterSpacing: "2px", color: "#888" })
            .appendTo(header);

        const headerRight = $("<div>").css({ display: "flex", gap: "4px", alignItems: "center" });

        $("<button>", { id: "mod-popout" })
            .html("&#x2197;")
            .attr("title", "Pop out to new window")
            .css({
                background: "none",
                border: "none",
                color: "#555",
                fontSize: "15px",
                cursor: "pointer",
                padding: "0 4px",
                lineHeight: "1",
            })
            .appendTo(headerRight);

        const closeBtn = $("<button>", { id: "mod-close" })
            .html("&#x2715;")
            .css({
                background: "none",
                border: "none",
                color: "#666",
                fontSize: "14px",
                cursor: "pointer",
                padding: "0 2px",
                lineHeight: "1",
            });
        headerRight.append(closeBtn);
        header.append(headerRight);
        panel.append(header);

        // ── Body ────────────────────────────────────────────────────────
        const body = $("<div>").css({ padding: "10px 12px" });

        // Action buttons row
        const actionRow = $("<div>").css({ display: "flex", gap: "6px", marginBottom: "10px" });

        $("<button>", { id: "mod-verify" })
            .text("✓ VERIFY LOBBY")
            .css({
                flex: "1",
                background: "#122e12",
                border: "1px solid #1e5c1e",
                color: "#5fca5f",
                padding: "5px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                letterSpacing: "1px",
            })
            .appendTo(actionRow);

        $("<button>", { id: "mod-freeze" })
            .text("⛔ FREEZE")
            .css({
                flex: "1",
                background: "#2e1a0a",
                border: "1px solid #7a3a10",
                color: "#ff8c44",
                padding: "5px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                letterSpacing: "1px",
            })
            .appendTo(actionRow);

        $("<button>", { id: "mod-unfreeze" })
            .text("✅ UNFREEZE")
            .css({
                flex: "1",
                background: "#0a1a0a",
                border: "1px solid #1e5c1e",
                color: "#5fca5f",
                padding: "5px 8px",
                borderRadius: "4px",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "11px",
                letterSpacing: "1px",
            })
            .appendTo(actionRow);

        body.append(actionRow);

        // Player count
        const playerCount = $("<div>").css({
            fontSize: "10px",
            color: "#444",
            marginBottom: "6px",
            letterSpacing: "0.5px",
        });
        body.append(playerCount);
        this.playerCountLabel = playerCount;

        // Table
        const table = $("<table>").css({
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "12px",
        });

        const headRow = $("<tr>").css({ borderBottom: "1px solid #1e1e2e" });
        ["Name", "Kick", "Ban", "MSG"].forEach((h, i) => {
            $("<th>")
                .text(h)
                .css({
                    textAlign: i === 0 ? "left" : "center",
                    padding: "4px 4px",
                    fontWeight: "normal",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    color: "#444",
                })
                .appendTo(headRow);
        });
        $("<thead>").append(headRow).appendTo(table);

        const tbody = $("<tbody>");
        table.append(tbody);
        body.append(table);
        this.playerListBody = tbody;

        // ── Announce section ────────────────────────────────────────────
        const announceSection = $("<div>").css({
            display: "none",
            marginTop: "10px",
            borderTop: "1px solid #1e1e2e",
            paddingTop: "8px",
        });

        const targetLabel = $("<div>").css({
            fontSize: "10px",
            color: "#666",
            marginBottom: "5px",
        });
        targetLabel.append("MSG → ");
        const targetName = $("<span>").css({ color: "#44aaff" });
        targetLabel.append(targetName);
        announceSection.append(targetLabel);
        this.announceTargetLabel = targetName;

        const inputRow = $("<div>").css({ display: "flex", gap: "5px" });

        const msgInput = $("<input>", { type: "text", maxlength: "200" })
            .attr("placeholder", "Message...")
            .css({
                flex: "1",
                background: "#0a0a14",
                border: "1px solid #2a2a3a",
                color: "#eee",
                padding: "5px 8px",
                borderRadius: "3px",
                fontFamily: "inherit",
                fontSize: "12px",
                outline: "none",
                minWidth: "0",
            });
        this.announceMsgInput = msgInput;

        const sendBtn = BTN("SEND", "#1a3a99").css({ fontSize: "11px" });
        const cancelBtn = $("<button>")
            .html("&#x2715;")
            .css({
                background: "none",
                border: "none",
                color: "#555",
                cursor: "pointer",
                fontSize: "14px",
                padding: "0 4px",
            });

        inputRow.append(msgInput, sendBtn, cancelBtn);
        announceSection.append(inputRow);
        body.append(announceSection);
        this.announceSection = announceSection;

        sendBtn.on("click", () => this.sendAnnounce());
        cancelBtn.on("click", () => this.hideAnnounceSection());

        // ── Ban section ─────────────────────────────────────────────────
        const banSection = $("<div>").css({
            display: "none",
            marginTop: "8px",
            borderTop: "1px solid #3a1a1a",
            paddingTop: "8px",
        });

        const banLabel = $("<div>").css({ fontSize: "10px", color: "#666", marginBottom: "5px" });
        banLabel.append("BAN → ");
        const banName = $("<span>").css({ color: "#ff7777" });
        banLabel.append(banName);
        banSection.append(banLabel);
        this.banTargetLabel = banName;

        const inputStyle = {
            background: "#0a0a14",
            border: "1px solid #3a1a1a",
            color: "#eee",
            padding: "5px 8px",
            borderRadius: "3px",
            fontFamily: "inherit",
            fontSize: "12px",
            outline: "none",
        };

        const banRow1 = $("<div>").css({ display: "flex", gap: "5px", marginBottom: "5px" });
        const banReasonInput = $("<input>", { type: "text", maxlength: "100" })
            .attr("placeholder", "Reason (optional)…")
            .css({ ...inputStyle, flex: "1", minWidth: "0" });
        this.banReasonInput = banReasonInput;
        banRow1.append(banReasonInput);
        banSection.append(banRow1);

        const banInputRow = $("<div>").css({ display: "flex", gap: "5px", alignItems: "center" });

        const banDaysInput = $("<input>", { type: "number", min: "1", max: "9999", value: "7" })
            .css({ ...inputStyle, width: "60px", textAlign: "center", flexShrink: "0" });
        this.banDaysInput = banDaysInput;

        const daysLabel = $("<span>").text("days").css({ fontSize: "10px", color: "#666", whiteSpace: "nowrap" });

        const banConfirmBtn = BTN("BAN", "#7b1010").css({ fontSize: "11px", marginLeft: "auto" });
        const banCancelBtn = $("<button>")
            .html("&#x2715;")
            .css({ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "14px", padding: "0 4px" });

        banInputRow.append(banDaysInput, daysLabel, banConfirmBtn, banCancelBtn);
        banSection.append(banInputRow);
        body.append(banSection);
        this.banSection = banSection;

        banConfirmBtn.on("click", () => this.confirmBan());
        banCancelBtn.on("click", () => this.hideBanSection());
        for (const input of [banReasonInput, banDaysInput]) {
            input
                .on("focus", () => { this.game.m_input.isTyping = true; })
                .on("blur",  () => { this.game.m_input.isTyping = false; })
                .on("keydown", (e) => {
                    e.stopPropagation();
                    if (e.key === "Enter")  this.confirmBan();
                    if (e.key === "Escape") this.hideBanSection();
                })
                .on("keyup", (e) => e.stopPropagation());
        }

        panel.append(body);
        $("body").append(panel);
        return panel;
    }

    private setupHandlers() {
        $("#mod-close").on("click", () => this.hide());
        $("#mod-verify").on("click", () => this.verifyLobby());
        $("#mod-freeze").on("click", () => this.sendAdminCmd("/freeze"));
        $("#mod-unfreeze").on("click", () => this.sendAdminCmd("/unfreeze"));
        $("#mod-popout").on("click", () => this.openPopup());

        // BroadcastChannel: receive commands from popup + respond to sync requests
        this.channel.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === "cmd") {
                this.sendAdminCmd(msg.cmd);
            }
            if (msg.type === "requestSync") {
                this.sendAdminCmd("/modSync");
                this.broadcastSync();
            }
        };

        // Stop mouse events on the panel from reaching the game's window listener
        this.panel
            .on("mousedown", (e) => { e.stopPropagation(); })
            .on("mouseup",   (e) => { this.dragging = false; e.stopPropagation(); })
            .on("click",     (e) => { e.stopPropagation(); })
            .on("wheel",     (e) => { e.stopPropagation(); });

        // Block game keyboard input while panel is open
        this.panel
            .on("keydown", (e) => { e.stopPropagation(); })
            .on("keyup",   (e) => { e.stopPropagation(); });

        // Announce input: set isTyping while focused so game input is fully blocked
        this.announceMsgInput
            .on("focus", () => { this.game.m_input.isTyping = true; })
            .on("blur",  () => { this.game.m_input.isTyping = false; })
            .on("keydown", (e) => {
                e.stopPropagation();
                if (e.key === "Enter") this.sendAnnounce();
                if (e.key === "Escape") this.hideAnnounceSection();
            })
            .on("keyup", (e) => e.stopPropagation());

        // Drag — use getBoundingClientRect() for correct coords on position:fixed
        const header = $("#mod-header");
        header.on("mousedown", (e) => {
            if ((e.target as HTMLElement).closest("button")) return;
            this.dragging = true;
            const rect = this.panel[0].getBoundingClientRect();
            this.dragOffsetX = e.clientX - rect.left;
            this.dragOffsetY = e.clientY - rect.top;
            e.preventDefault();
        });

        $(document)
            .on("mousemove.modpanel", (e) => {
                if (!this.dragging) return;
                const w = this.panel.outerWidth() ?? 0;
                const x = Math.max(0, Math.min(window.innerWidth - w, e.clientX - this.dragOffsetX));
                const y = Math.max(0, Math.min(window.innerHeight - 40, e.clientY - this.dragOffsetY));
                this.panel.css({ left: x, top: y, right: "auto" });
            })
            .on("mouseup.modpanel", () => { this.dragging = false; });
    }

    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    private leftPlayerIds = new Set<number>();
    private gameId = "";
    private playerExtraData = new Map<number, { encodedIp: string; slug: string | null; discordId: string | null }>();

    setGameId(id: string) {
        this.gameId = id;
        this.broadcastSync();
    }

    setPlayerExtraData(data: Array<{ id: number; encodedIp: string; slug: string | null; discordId: string | null }>) {
        this.playerExtraData.clear();
        for (const d of data) this.playerExtraData.set(d.id, d);
        this.broadcastSync();
    }

    setSinglePlayerExtraData(data: {
        id: number;
        encodedIp: string;
        slug: string | null;
        discordId: string | null;
    }) {
        this.playerExtraData.set(data.id, data);
        this.broadcastSync();
    }

    onPlayerLeft(playerId: number) {
        this.leftPlayerIds.add(playerId);
        if (this.visible) this.refreshPlayerList();
    }

    resetForNewGame() {
        this.leftPlayerIds.clear();
        this.playerExtraData.clear();
        this.gameId = "";
    }

    private pollTick = 0;
    private lastPlayerKey = "";

    tick() {
        if (!this.visible) return;
        this.pollTick++;
        if (this.pollTick % 30 !== 0) return;
        // Also catch removes via deletedPlayerIds (pre-game / canDespawn cases)
        const key = Object.keys(this.game.m_playerBarn.playerInfo)
            .filter(id => !this.leftPlayerIds.has(Number(id)))
            .sort()
            .join(",");
        if (key !== this.lastPlayerKey) {
            this.lastPlayerKey = key;
            this.refreshPlayerList();
        }
    }

    show() {
        this.visible = true;
        this.lastPlayerKey = "";
        this.refreshPlayerList();
        this.panel.show();
    }

    hide() {
        this.visible = false;
        this.game.m_input.isTyping = false;
        this.hideAnnounceSection();
        this.panel.hide();
    }

    refreshPlayerList() {
        const playerInfo = this.game.m_playerBarn.playerInfo;
        const players = Object.values(playerInfo).filter(p => !this.leftPlayerIds.has(p.playerId));

        this.playerCountLabel.text(`PLAYERS: ${players.length}`);
        this.playerListBody.empty();

        for (const p of players) {
            const name = p.name;
            const isSelf = p.playerId === this.game.m_localId;

            const row = $("<tr>").css({ borderBottom: "1px solid #131320" });

            const nameCell = $("<td>").css({
                padding: "5px 4px",
                color: isSelf ? "#555" : "#ccc",
                maxWidth: "120px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            });
            nameCell.text(name);
            if (isSelf) {
                nameCell.append($("<span>").css({ color: "#444", fontSize: "9px", marginLeft: "4px" }).text("(you)"));
            }

            const kickTd = $("<td>").css({ padding: "5px 4px", textAlign: "center" });
            const banTd = $("<td>").css({ padding: "5px 4px", textAlign: "center" });
            const msgTd = $("<td>").css({ padding: "5px 4px", textAlign: "center" });

            if (!isSelf) {
                BTN("KICK", "#5c1a1a").on("click", () => this.kickPlayer(name)).appendTo(kickTd);
                BTN("BAN", "#3d0e0e").on("click", () => this.banPlayer(name)).appendTo(banTd);
            }

            BTN("MSG", "#0e2444").on("click", () => this.showAnnounceSection(name)).appendTo(msgTd);

            row.append(nameCell, kickTd, banTd, msgTd);
            this.playerListBody.append(row);
        }

        // Keep popup in sync whenever the list is redrawn
        this.broadcastSync();
    }

    private broadcastSync() {
        const playerInfo = this.game.m_playerBarn.playerInfo;
        const players = Object.values(playerInfo)
            .filter(p => !this.leftPlayerIds.has(p.playerId))
            .map(p => {
                const extra = this.playerExtraData.get(p.playerId);
                return {
                    id: p.playerId,
                    name: p.name,
                    isSelf: p.playerId === this.game.m_localId,
                    encodedIp: extra?.encodedIp ?? null,
                    slug: extra?.slug ?? null,
                    discordId: extra?.discordId ?? null,
                };
            });
        this.channel.postMessage({ type: "sync", players, gameId: this.gameId });
    }

    private openPopup() {
        if (this.popupWindow && !this.popupWindow.closed) {
            this.popupWindow.focus();
            return;
        }
        this.popupWindow = window.open(
            "/mod-popup.html",
            "mod-panel",
            "width=680,height=860,resizable=yes",
        );
        // Send initial data once popup signals it's ready (via requestSync ping)
    }

    private showAnnounceSection(playerName: string) {
        this.hideBanSection();
        this.announceTarget = playerName;
        this.announceTargetLabel.text(playerName);
        this.announceSection.show();
        this.announceMsgInput.trigger("focus");
    }

    private hideAnnounceSection() {
        this.announceTarget = null;
        this.announceSection.hide();
        this.announceMsgInput.val("");
        this.game.m_input.isTyping = false;
    }

    private sendAnnounce() {
        if (!this.announceTarget) return;
        const text = (this.announceMsgInput.val() as string).trim();
        if (!text) return;
        this.sendAdminCmd(`/announce_player "${this.announceTarget}" "${text}"`);
        this.hideAnnounceSection();
    }

    private showBanSection(playerName: string) {
        this.hideAnnounceSection();
        this.banTarget = playerName;
        this.banTargetLabel.text(playerName);
        this.banSection.show();
        this.banReasonInput.val("");
        this.banDaysInput.val("7");
        this.banReasonInput.trigger("focus");
    }

    private hideBanSection() {
        this.banTarget = null;
        this.banSection.hide();
        this.banReasonInput.val("");
        this.banDaysInput.val("7");
        this.game.m_input.isTyping = false;
    }

    private confirmBan() {
        if (!this.banTarget) return;
        const reason = (this.banReasonInput.val() as string).trim() || "banned_by_admin";
        const days = Math.max(1, Number(this.banDaysInput.val()) || 7);
        this.sendAdminCmd(`/ban "${this.banTarget}" ${days} "${reason}"`);
        this.hideBanSection();
        setTimeout(() => this.refreshPlayerList(), 600);
    }

    private kickPlayer(name: string) {
        this.sendAdminCmd(`/kick "${name}" kicked_by_admin`);
        setTimeout(() => this.refreshPlayerList(), 600);
    }

    private banPlayer(name: string) {
        this.showBanSection(name);
    }

    private verifyLobby() {
        this.sendAdminCmd("/verify");
        setTimeout(() => this.refreshPlayerList(), 600);
    }

    private sendAdminCmd(cmd: string) {
        const msg = new net.KillFeedMsg();
        msg.string = cmd;
        msg.player = this.game.m_activePlayer?.nameText?.text ?? "";
        msg.chatType = 0;
        msg.type = net.KillFeedMsgType.ChatMsg;
        this.game.m_sendMessage(net.MsgType.KillFeed, msg);
    }
}
