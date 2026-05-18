import { Game } from "../game/game";
import { Player } from "../game/objects/player";

import * as net from "../../../shared/net/net";
import { chatLogger } from "./betterLogger";
import { apiPrivateRouter, checkForBadWords } from "./serverHelpers";
import { Config } from "../config";
import { hashIp, getActiveChatBan } from "../api/routes/private/ModerationRouter";
import { GameObjectDefs } from "../../../shared/defs/gameObjectDefs";



export class Chat{

    player: Player;
    game: Game;
    isAdmin: boolean;
    chatBanned: boolean = false;
    banExpiresAt: number = 0;

    constructor(player: Player, game: Game, isAdmin: boolean){
        this.player = player;
        this.game = game;
        this.isAdmin = isAdmin;
        if(Config.database.enabled){
            this.checkChatBan(this.player.ip).then((banData) => {
                if(banData && banData.banned){
                    this.chatBanned = true;
                    this.banExpiresAt = new Date(banData.banData.expiresIn).getTime();
                }    
            });   
        }
    }

    async checkChatBan(ip: string) {
            try {
                const apiRes = await apiPrivateRouter.check_chat_ip.$post({
                    json: {
                        ip,
                    },
                });
    
                if (apiRes.ok) {
                    const body = await apiRes.json();
                    return body;
                }
            } catch (err) {
                console.error(`Failed request API fetch_ip: `, err);
            }
    
            return undefined;
        }

    handleChatMessage(msg: net.KillFeedMsg){
        if(this.chatBanned){
            const msg1 = new net.KillFeedMsg();
            msg1.string = "chat-banned";
            msg1.player = "ADMIN";
            msg1.type = net.KillFeedMsgType.BannedMsg;
            msg1.cmd = this.banExpiresAt > 0 ? new Date(this.banExpiresAt).toISOString() : "0";
            this.player.sendMsg(net.MsgType.KillFeed, msg1);
            return;
        }
         const chatType = msg.chatType;
            const originalMsg = msg.string;
            //this only allows for philipp or if run locally
            //if(this.userId === "l0x54arv2o8qldq" || Config.debug.allowEditMsg){
            if(this.game.map.mapDef.gameMode.enableChat){
                const msg1 = new net.KillFeedMsg();
                if((this.isAdmin || Config.debug.allowEditMsg) && originalMsg.startsWith("/")){
                    //ADMIN CMD
                    this.handleAdminCmds(originalMsg);

                    return;
                }
                if(this.player.chatCooldown >0){
                    msg1.string = "chat-cooldown";
                    msg1.player = "ADMIN";
                    msg1.type = net.KillFeedMsgType.AdminMsg;
                    this.player.sendMsg(net.MsgType.KillFeed, msg1);
                    this.logChat(originalMsg, true, false, msg1.string);
                    return;
                }
                if(checkForBadWords(msg.string)){
                    msg1.string = "chat-bad-word";
                    msg1.player = "ADMIN";
                    msg1.type = net.KillFeedMsgType.AdminMsg;
                    this.player.sendMsg(net.MsgType.KillFeed, msg1);
                    this.logChat(originalMsg, true, false, msg1.string);
                    return;
                }
                if(this.player.spectator){
                    msg1.string = msg.string;
                    msg1.player = this.player.name;
                    msg1.chatType = 2;
                    msg1.type = net.KillFeedMsgType.ChatMsg;

                    //THIS ARE ONLY PEOPLE JOINED AS SPECS
                    //Already dead players can still type both chats
                    const spectators = this.game.playerBarn.players.filter(p => p.spectator);
                    for(const s of spectators){
                        s.sendMsg(net.MsgType.KillFeed, msg1)
                    }
                    this.logChat(originalMsg);
                    this.player.chatCooldown = 3;
                    return;
                }
                msg1.string = msg.string;
                msg1.player += this.player.name;
                msg1.type = net.KillFeedMsgType.ChatMsg;
                // 0 = ALL | 1 = TEAM
                switch(chatType){
                    case(0):{
                        
                        msg1.chatType = 0;
                        this.game.broadcastMsg(net.MsgType.KillFeed, msg1);
                        this.logChat(originalMsg);
                        this.player.chatCooldown = 3;
                        break;
                    }
                    case(1):{
                        if(!this.player.group){
                            msg1.string = "chat-no-team";
                            msg1.player = "ADMIN";
                            msg1.type = net.KillFeedMsgType.AdminMsg;
                            this.player.sendMsg(net.MsgType.KillFeed, msg1); 
                            this.logChat(originalMsg, true, false, msg1.string);
                            break;
                        }
                        const teamPlayers = this.player.group.players.filter(p => p !== this.player);
                        if(teamPlayers.length === 0){
                            msg1.string = "chat-no-team";
                            msg1.player = "ADMIN";
                            msg1.type = net.KillFeedMsgType.AdminMsg;
                            this.player.sendMsg(net.MsgType.KillFeed, msg1);  
                            this.logChat(originalMsg, true, false, msg1.string);
                            break;
                        }else{
                            
                            msg1.chatType = 1;
                            for(const p of teamPlayers){
                                p.sendMsg(net.MsgType.KillFeed, msg1);
                            }
                            
                            this.player.sendMsg(net.MsgType.KillFeed, msg1);
                            this.logChat(originalMsg);
                            this.player.chatCooldown = 3;
                            break;
                        }
                        break;
                    }
                }

                
            }else{
                const msg1 = new net.KillFeedMsg();
                msg1.string = "chat-not-allowed";
                msg1.player = "ADMIN";
                msg1.type = net.KillFeedMsgType.AdminMsg;
                this.player.sendMsg(net.MsgType.KillFeed, msg1);
                this.logChat(originalMsg, true, false, msg1.string);
                return;
            }
            
    }

    logChat(originalMsg: string, adminMsg?: boolean, cmd?: boolean, msg?: string,){
        if(adminMsg){
            const log = `[CHAT-${this.game.id}] || [${this.player.name}]: ${originalMsg} => [Response]: ${msg}`;
            chatLogger.info(log);
            return;
        }else if(cmd){
            const log = `[CHAT-${this.game.id}] || [${this.player.name}]: ${originalMsg}`;
            chatLogger.warn(log);
            return;
        }

        const log = `[CHAT-${this.game.id}] || [${this.player.name}]: ${originalMsg}`;
        chatLogger.info(log);
    }

    adminCommands: Record<string, (args: string[]) => void> = {
        announce: (args) => {
            const text = args[0];
            const color = args[2];
            const time = Number(args[1]);

        if (!text) {
            const msg = new net.KillFeedMsg;
            msg.type = net.KillFeedMsgType.AdminMsg;
            msg.string = "chat-missing-text";
            msg.player = "Philipp";
            this.player.sendMsg(net.MsgType.KillFeed, msg);
            return;
        }

        this.sendAnnouncementMsg(text, color, time);
        },
        kick: (args) => {
            const player = args[0];
            const reason = "kicked_by_admin";
            this.kickPlayer(player, reason);
        },
        give: (args) => {
            const itemName = args[0];
            const amount = Number(args[1]) || 1;
            if(GameObjectDefs[itemName]){
                this.game.lootBarn.addLoot(itemName, this.player.pos, this.player.layer, amount, false, 0);
            }
        },
        verify: (args) => {
            const reason = "player_not_verified";
            for(const p of this.game.playerBarn.livingPlayers){
                if(!p.userId){
                    this.kickPlayer(p.name, reason);
                }
            }
            const msg = new net.KillFeedMsg;
            msg.type = net.KillFeedMsgType.AdminMsg;
            msg.string = "chat-lobby-verified";
            msg.player = "Philipp";
            this.player.sendMsg(net.MsgType.KillFeed, msg);
            return;
        },
    };

    handleAdminCmds(originalMsg: string){

        const parts = originalMsg.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmd = parts[0]?.replace(/^\//, "");
        const args = parts.slice(1).map((arg: string) => arg.replace(/^"|"$/g, ""));
        const msg = new net.KillFeedMsg;

        if(!cmd){
            msg.type = net.KillFeedMsgType.AdminMsg;
            msg.string = "chat-no-cmd";
            msg.player = "Philipp";
            this.player.sendMsg(net.MsgType.KillFeed, msg);
            this.logChat(originalMsg, false, true);
            return;
        }

        const handler = this.adminCommands[cmd];

        if (!handler) {
            msg.type = net.KillFeedMsgType.AdminMsg;
            msg.string = "chat-unknown-cmd";
            msg.player = "Philipp";
            this.player.sendMsg(net.MsgType.KillFeed, msg);
            console.log(cmd);
            return;
        }

        this.logChat(originalMsg, false, true);

        handler(args);


    }

    sendAnnouncementMsg(content: string, color?: string, time?: number){
        const c = color ?? "#ff0000";
        const t = time ?? 3000;
        const msg = new net.KillFeedMsg;
        msg.type = net.KillFeedMsgType.CmdMsg;
        msg.player = this.player.name;
        msg.cmd = "announce";
        msg.string = content;
        msg.args.push(c);
        msg.args.push(t.toString());
        


        this.game.broadcastMsg(net.MsgType.KillFeed, msg);
    }

    kickPlayer(playerName: string, reason: string){
        const player = this.game.playerBarn.players.filter(p => p.name === playerName)[0];
        if(!player){
            const msg = new net.KillFeedMsg;
            msg.type = net.KillFeedMsgType.AdminMsg;
            msg.string = "chat-player-not-found";
            msg.player = "Philipp";
            this.player.sendMsg(net.MsgType.KillFeed, msg);
            return;
        }
        this.game.closeSocket(player.socketId, reason);
        this.game.checkGameOver();
    }

}