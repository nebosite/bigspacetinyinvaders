import { IAppModel, AppModel } from "../models/AppModel";
import { KeycodeTranslator, KeyboardManager } from "../ui/KeyboardInput";
import { NewPlayerControl } from "./NewPlayerControl";
import { Player } from "../models/Player";
import { DrawHelper, DrawnObject, DrawnText } from "../ui/DrawHelper";
import { GamepadManager, GamepadInputCode, GamepadTranslator } from "../ui/GamepadInput";
import { GameObjectType, GameObject } from "../models/GameObject";
import { Alien } from "../models/Alien";
import { GameObjectRenderer, PlayerObjectRenderer, BulletObjectRenderer, AlienObjectRenderer, ShieldBlockObjectRenderer } from "./GameObjectRendering";
import { Bullet } from "../models/Bullet";
import { DiagnosticsControl } from "./DiagnosticsControl";
import { GLOBALS } from "../globals";
import { SoundHelper } from "src/ui/SoundHelper";

const PLAYER_SIZE = 16;

export enum PlayerAction {
    None,
    Up,
    Left,
    Right,
    Down,
    Fire
}

class PlayerIdentity{
    id = 0;
    name = "";
}

export class GameController 
{
    appModel: IAppModel;
    drawing: DrawHelper;
    sound: SoundHelper;
    gamepadThingX = 0;
    keyboardManager: KeyboardManager;
    gamepadManager: GamepadManager;
    newPlayerControl: NewPlayerControl | null = null;
    diagnosticsControl: DiagnosticsControl | null = null;
    lastFrameTime = Date.now();
    inputState = new Array<number>();
    playerIdentities = new Map<string, PlayerIdentity>();
    seenPlayersCount = 0;
    inviteText: DrawnText | null = null;
    renderingControls = new Map<GameObject, GameObjectRenderer>();
    versonText: DrawnText;
    playerScoresText: DrawnText;
    mainScoreText: DrawnText;

    CommonDirectionKeyLayouts = new Map([
        ["IJKL", [73,74,75,76]],
        ["WASD", [87,65,83,68]],
        ["Arrows", [38,37,40,39]],
        ["Numpad 8456", [104,100,101,102]]
    ]);

    CommonActionKeyLayouts = new Map([
        ["ShiftZX", [16,90,88]],
        ["SpcNM", [32,78,77]],
        ["0.Enter", [96,110,13]],
        ["DelEndPgdwn", [46,35,24]]
    ]);

    CommonGamepadDirectionLayouts  = new Map([
        ["Left Stick", [GamepadInputCode.Axis_Stick0X, GamepadInputCode.Axis_Stick0Y]],
        ["Right Stick", [GamepadInputCode.Axis_Stick1X, GamepadInputCode.Axis_Stick1Y]],
    ]); 

    CommonGamepadActionButtonLayouts  = new Map([
        ["DPad", [GamepadInputCode.Button_DPadDown,GamepadInputCode.Button_DPadLeft,GamepadInputCode.Button_DPadRight,GamepadInputCode.Button_DPadUp]],
        ["Diamond", [GamepadInputCode.Button_DiamondDown,GamepadInputCode.Button_DiamondLeft,GamepadInputCode.Button_DiamondRight,GamepadInputCode.Button_DiamondUp]],
        ["Right Trigger", [GamepadInputCode.Button_ShoulderRight,GamepadInputCode.Button_TriggerRight]],
        ["Left Trigger", [GamepadInputCode.Button_ShoulderLeft,GamepadInputCode.Button_TriggerLeft]],
    ]); 

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(appModel: IAppModel, drawing: DrawHelper, sound: SoundHelper)
    {
        this.appModel = appModel; 
        this.drawing = drawing; 
        this.sound = sound;
        this.appModel.worldSize = {width: this.drawing.width, height: this.drawing.height};
        this.drawing.onWindowResized.subscribe("gameController resized", this.handleResize);
        appModel.onPlayerRemoved = player => {};
        appModel.onAddedGameObject = this.handleAddedGameObject;
        appModel.onRemovedGameObject = this.handleRemovedGameObject;
        this.keyboardManager = new KeyboardManager();
        this.keyboardManager.onUnhandledKeyCode = this.handleUnhandledKey;
        this.gamepadManager = new GamepadManager();
        this.gamepadManager.onUnhandledInputCode = this.handleUnhandledGamepadCode;
    
        requestAnimationFrame(this.animation_loop);
        window.addEventListener("click", this.handleCanvasClick);
        window.addEventListener("mousemove", this.handleCanvasMouseMove);

        for(var i = 0; i < 50; i++) this.inputState.push(0);

        this.versonText = drawing.addTextObject(`Version ${GLOBALS.version}`, 5, drawing.height, 15, "#800000", "", 0, 1000, [0,1]);
        this.playerScoresText = drawing.addTextObject("P0:0000\nP1:0000\nP3:0000", 5, drawing.height-20, 10, "#FFFF00", "", 0, 1000, [0,1] );
        this.mainScoreText = drawing.addTextObject("Score: 00000", drawing.width-10, 3, 15, "#FFFF00", "", 0, 1000, [1,0] );
    } 

    //-------------------------------------------------------------------------
    // reset the game
    //-------------------------------------------------------------------------
    reset()
    {
        this.gamepadManager.reset();
        this.keyboardManager.reset();
        this.appModel.reset(); 
        for(let control of this.renderingControls.values())
        {
            control.delete();
        }
        this.renderingControls.clear();
    }

    //-------------------------------------------------------------------------
    // uhoh, the window resized
    //-------------------------------------------------------------------------
    handleResize = () =>{
        this.appModel.worldSize = {width: this.drawing.width, height: this.drawing.height};
    }

    //-------------------------------------------------------------------------
    // Deal with added objects
    //-------------------------------------------------------------------------
    handleAddedGameObject = (gameObject: GameObject) => {
        switch(gameObject.type)
        {
            case GameObjectType.Player: this.renderingControls.set(gameObject, new PlayerObjectRenderer(gameObject as Player, this.drawing, this.sound)); break;
            case GameObjectType.Bullet: this.renderingControls.set(gameObject, new BulletObjectRenderer(gameObject as Bullet, this.drawing, this.sound)); break;
            case GameObjectType.Alien: this.renderingControls.set(gameObject, new AlienObjectRenderer(gameObject as Alien, this.drawing, this.sound)); break;
            case GameObjectType.ShieldBlock: this.renderingControls.set(gameObject, new ShieldBlockObjectRenderer(gameObject as Alien, this.drawing, this.sound)); break;
        }
    }

    //-------------------------------------------------------------------------
    // Deal with removed objects
    //-------------------------------------------------------------------------
    handleRemovedGameObject = (gameObject: GameObject) => {
        let renderer = this.renderingControls.get(gameObject);
        if(!renderer) return;
        renderer.delete();
        this.renderingControls.delete(gameObject);
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    animation_loop = (event: unknown) => {
        let gameTime = Date.now();
        let elapsed = gameTime - this.lastFrameTime;
        this.lastFrameTime = gameTime;

        // Update rendered object
        this.appModel.think(gameTime, elapsed);
        for(let renderer of this.renderingControls.values()) {
            renderer.render();
        };

        if(this.appModel.getPlayers().length == 0 && !this.inviteText)
        {
            this.inviteText = this.drawing.addTextObject("Use movement controls to add a new player...",
                this.drawing.width/2, this.drawing.height - 100, 20,"#FFFFFF","",0,2000, [.5,.5]);
        }

        if(this.appModel.getPlayers().length > 0 && this.inviteText)
        {
            this.inviteText.delete();
            this.inviteText = null;
        }

        if(this.newPlayerControl) this.newPlayerControl.render();
        if(this.diagnosticsControl) this.diagnosticsControl.render();

        this.versonText.y = this.drawing.height - 5;
        if(this.inviteText)
        {
            this.inviteText.x = this.drawing.width/2;
            this.inviteText.y = 100;
        }

        let scores = "";
        this.appModel.getPlayers().forEach(player => {
            scores += `${player.name}:${player.score.toString().padStart(5, '0')}\n`;
        });
        this.playerScoresText.text = scores;

        let totalText = this.appModel.totalScore.toString().padStart(6, '0');
        let maxText = this.appModel.maxScore.toString().padStart(6, '0');
        this.mainScoreText.text = `Score: ${totalText}  Max:${maxText}`;

        requestAnimationFrame(this.animation_loop);
    }

    //-------------------------------------------------------------------------
    // showGamepadStates
    //-------------------------------------------------------------------------
    generatePlayer(controlId: string)
    {
        let newPlayer = new Player(this.appModel);
        var playerInfo = new PlayerIdentity();
        if(this.playerIdentities.has(controlId))
        {
            playerInfo = this.playerIdentities.get(controlId) as PlayerIdentity;
        }
        else
        {
            playerInfo.id = this.seenPlayersCount++;
            playerInfo.name = `P:${playerInfo.id}`;
            this.playerIdentities.set(controlId, playerInfo);
        }
        newPlayer.number = playerInfo.id;
        newPlayer.name = playerInfo.name;
        return newPlayer;
    }

    //-------------------------------------------------------------------------
    // handle gamepads
    //-------------------------------------------------------------------------
    handleUnhandledGamepadCode = (controllerIndex: number, code: GamepadInputCode, value: number) => {
        this.inputState[code] = value;
        if(code == GamepadInputCode.Button_Back) {
            console.log("BACK");
            this.reset();
            return;
        }
        if(this.newPlayerControl) 
        {
            if(this.newPlayerControl.controllerId != controllerIndex.toString()) return;
            // Let's see if the staged player has pressed a fire key
            this.CommonGamepadActionButtonLayouts.forEach((value, key) =>
            {
                for(let i = 0; i < value.length; i++)
                {
                    if(value[i] == code)
                    {
                        const translator = this.newPlayerControl?.translator as GamepadTranslator<PlayerAction>;
                        this.newPlayerControl?.cancelMe();
                        if(translator)
                        {
                            translator.mapButton(value[0], PlayerAction.Fire);
                            translator.mapButton(value[1], PlayerAction.Fire);
                            translator.mapButton(value[2], PlayerAction.Fire);
                            translator.mapButton(value[3], PlayerAction.Fire);
                            if(this.newPlayerControl)
                            {
                                translator.removeSubscriber(this.newPlayerControl);
                            }
                            let newPlayer = this.generatePlayer(translator.name);
                            translator.addSubscriber(newPlayer);
                            this.appModel.addPlayer(newPlayer);
                            this.gamepadManager.addTranslator(translator);
                            newPlayer.onCleanup.subscribe("removeTranslator", () => this.gamepadManager.removeTranslator(translator));
                        }
                        this.newPlayerControl = null;
                        return;
                    }
                }
            });
        }
        else
        {      
            // Look for direction keys that are not bound yet
            this.CommonGamepadDirectionLayouts.forEach((value, key) =>
            {
                for(let i = 0; i < value.length; i++)
                {
                    if(value[i] == code)
                    {
                        var newTranslator = new GamepadTranslator<PlayerAction>(`${key}:${controllerIndex}`, controllerIndex);
                        this.newPlayerControl = new NewPlayerControl(controllerIndex.toString(), this.drawing, () =>
                        {
                            this.gamepadManager.removeTranslator(newTranslator);
                            this.newPlayerControl = null;
                        });

                        newTranslator.mapAxis(value[0], PlayerAction.Left, PlayerAction.Right);
                        newTranslator.mapAxis(value[1], PlayerAction.Up, PlayerAction.Down);

                        this.gamepadManager.addTranslator(newTranslator);
                        newTranslator.addSubscriber(this.newPlayerControl);
                        this.newPlayerControl.translator = newTranslator;
                    }
                }
            });
        }
    }

    //-------------------------------------------------------------------------
    // handle keyboard
    //-------------------------------------------------------------------------
    handleUnhandledKey = (keyCode: number) => {
        if(keyCode == 192){ // ` turns diagnostics on/off
            if(this.diagnosticsControl) {
                this.diagnosticsControl.cancelMe();
                this.diagnosticsControl = null;
            }
            else {
                this.diagnosticsControl = new DiagnosticsControl(this.drawing, this.gamepadManager, this.keyboardManager, this.appModel.diagnostics)
            }
            return;
        }

        if(keyCode == 27) {  // Esc to reset the game
            this.reset();
        }

        if(this.newPlayerControl) 
        {
            if(this.newPlayerControl.controllerId != 'keyboard') return;
            // Let's see if the staged player has pressed a fire key
            this.CommonActionKeyLayouts.forEach((value, key) =>
            {
                for(let i = 0; i < value.length; i++)
                {
                    if(value[i] == keyCode)
                    {
                        const translator = this.newPlayerControl?.translator as KeycodeTranslator<PlayerAction>;
                        this.newPlayerControl?.cancelMe();
                        if(translator)
                        {
                            translator.mapKey(value[0], PlayerAction.Fire);
                            translator.mapKey(value[1], PlayerAction.Fire);
                            translator.mapKey(value[2], PlayerAction.Fire);
                            if(this.newPlayerControl)
                            {
                                translator.removeSubscriber(this.newPlayerControl);
                            }
                            let newPlayer = this.generatePlayer(translator.name);
                            translator.addSubscriber(newPlayer);
                            this.appModel.addPlayer(newPlayer);
                            this.keyboardManager.addTranslator(translator);
                            newPlayer.onCleanup.subscribe("removeKeyTranslator",() =>  this.keyboardManager.removeTranslator(translator));
                        }
                        this.newPlayerControl = null;
                        return;
                    }
                }
            });
        }
        else
        {      
            // Look for direction keys that are not bound yet
            this.CommonDirectionKeyLayouts.forEach((value, key) =>
            {
                for(let i = 0; i < value.length; i++)
                {
                    if(value[i] == keyCode)
                    {
                        var newTranslator = new KeycodeTranslator<PlayerAction>(key);
                        this.newPlayerControl = new NewPlayerControl('keyboard', this.drawing, () =>
                        {
                            this.keyboardManager.removeTranslator(newTranslator);
                            this.newPlayerControl = null;
                        });
                        newTranslator.mapKey(value[0], PlayerAction.Up);
                        newTranslator.mapKey(value[1], PlayerAction.Left);
                        newTranslator.mapKey(value[2], PlayerAction.Down);
                        newTranslator.mapKey(value[3], PlayerAction.Right);
                        this.keyboardManager.addTranslator(newTranslator);
                        newTranslator.addSubscriber(this.newPlayerControl);
                        this.newPlayerControl.translator = newTranslator;
                    }
                }
            });
        }
    }

    //-------------------------------------------------------------------------
    // handle mouse clicks
    //-------------------------------------------------------------------------
    handleCanvasClick = (e: MouseEvent) => {
        // this.mouseX = e.clientX;
        // this.mouseY = e.clientY;
    }

    //-------------------------------------------------------------------------
    // handle mouse movement
    //-------------------------------------------------------------------------
    handleCanvasMouseMove = (e: MouseEvent) => {
        // this.mouseX = e.clientX;
        // this.mouseY = e.clientY;
    }

}