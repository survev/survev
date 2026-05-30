import $ from "jquery";
import { Game } from "../game";
import * as net from "../../../shared/net/net";
import { InputHandler } from "../input";

export class ChatUi{

    chatInput = $("#ui-chat-wrapper");
    input = document.getElementById("ui-chat-input") as HTMLInputElement;
    button = document.getElementById("ui-chat-send");
    game: Game;
    inputHandler: InputHandler;
    chatShown = false;
    chatType = 0; // 0 = all | 1 = team | 3 = spectator
    clientSideChatSlowdown = 0;

    constructor(
        game: Game,
        input: InputHandler
    ){

        this.game = game;
        this.inputHandler = input;
        // Button click
        this.button?.addEventListener("click", () => {
            this.sendChatMessage.call(this);
        });
        // don't want to trigger keybinds (like L to fullscreen) while typing
            this.input.addEventListener("keyup", (e) => e.stopPropagation());
            this.input.addEventListener("keydown", (e) => {
                e.stopPropagation();

                if (e.key == "Enter" ) {
                    this.sendChatMessage();
                }
                if(e.key == "Tab"){
                    e.preventDefault();
                    this.switchChat();
                    this.input.focus();
                }
            });
            window.addEventListener("mousedown", (e) =>{
                this.leaveChat();
            });
            window.addEventListener("keydown", (e) => {
                if(e.key == "Escape" || e.key == "<"){
                    this.leaveChat();
                }
            });
            this.input.placeholder = "[ALL]";
    }

    sendChatMessage() {
        const text = this.input.value.trim();
        if (!text) return;
        if(this.clientSideChatSlowdown >0) {

            const txt = this.game.m_ui2Manager.getAdminChatMessage("ADMIN", "chat-cooldown");

            this.game.m_ui2Manager.addChatMessage(txt, "#ff0000", "#000000");
            
            return;
        }    
        const msg = new net.KillFeedMsg();
        msg.string = text;
        msg.player = this.game.m_activePlayer.nameText.text;
        msg.chatType = this.chatType;
        msg.type = net.KillFeedMsgType.ChatMsg;

        this.game.m_sendMessage(net.MsgType.KillFeed, msg);

        this.input.value = "";
        this.clientSideChatSlowdown = 3;

        //this.input.focus();
        this.leaveChat();

    }


    joinChat(){
        this.chatInput.css("display", "block");
        this.inputHandler.isTyping = true;
        this.input.focus();
    }

    leaveChat(){
        this.chatInput.css("display", "none");
        this.inputHandler.isTyping = false;
    }

    switchChat(){
        const currentChat = this.chatType;
        switch(currentChat){
            case(0):{
                this.chatType = 1
                this.input.placeholder = "[TEAM]";
                this.input.focus();
                break;
            }
            case(1):{
                this.chatType = 0
                this.input.placeholder = "[ALL]";
                this.input.focus();
                break;
            }
        }
        this.input.focus();
    }

    adminCommands: Record<string, (admin: string, content: string, args: string[]) => void> = {
        announce: (admin, content, args) => {
            this.sendAnnouncementMsg(admin, content, args);
        },
    };

    chatIsEnabled(): boolean {

        const style = window.getComputedStyle(this.chatInput[0]);
            if(style.display !== "none"){
                return true;
            }

        return false;
    }


    handleAdminCmds(cmd: string, admin: string, content: string, args: string[]){
        const handler = this.adminCommands[cmd];

        if (!handler) return;

        handler(admin, content, args);
    }

    sendAnnouncementMsg(admin: string, content: string, args: string[]){
        const msg = `[${admin}]: ${content}`;
        const color = args[0];
        const time = Number(args[1]);
        this.game.m_uiManager.displayAnnouncement(msg, color, time);
    }

    update(dt: number){
        if(this.clientSideChatSlowdown>0)
        this.clientSideChatSlowdown -= dt;
    }
}