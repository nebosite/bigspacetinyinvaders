import { IAppModel, AppModel, IGameListener } from "../models/AppModel";
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
import { SoundHelper } from "../ui/SoundHelper";
import { EventThing } from "../tools/EventThing";
import { Widget } from "../WidgetLib/Widget";
import { MainMenuWidget } from "./MainMenuWidget";
import { PlayerDetailControl } from "./PlayerDetailControl";

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

export class GameWidget extends Widget implements IGameListener
{
    theAppModel: IAppModel;
    newPlayerControl: NewPlayerControl | null = null;
    diagnosticsControl: DiagnosticsControl | null = null;
    lastFrameTime = Date.now();
    playerIdentities = new Map<string, PlayerIdentity>();
    seenPlayersCount = 0;
    renderingControls = new Map<GameObject, GameObjectRenderer>();
    playerDetailControls = new Map<number, PlayerDetailControl>();
    inviteText: DrawnText | null = null;
    mainScoreText: DrawnText| null = null;
    onGameOver = new EventThing<void>("Game Widget");

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
    constructor(appModel: IAppModel)
    {
        super("TheGame");
        this.theAppModel = appModel; 
        this.theAppModel.reset(); 
        let hasSetSize = false;

        this.onLoaded.subscribe(`${this.name} Load`, this.loadMe);
        this.onParentLayoutChanged.subscribe(`${this.name} parentLayoutChanged`, () => {
            console.log(`Layout changed ${this.width},${this.height}`)
            // if we exit fullscreen, just end the game
            if(hasSetSize && this.theAppModel.settings.isFullScreen && !document.fullscreen)
            {
                this.theAppModel.endGame();
            }

            if(!hasSetSize || this.theAppModel.settings.isFullScreen)
            {
                let width = this.width;
                let height = this.height;
                if(this.theAppModel.settings.isFullScreen)
                {
                    width = this.widgetSystem?.drawing.width as number;
                    height = this.widgetSystem?.drawing.height as number;
                }
                hasSetSize = true;
                console.log(`Setting world size to ${width},${height}`);
                this.theAppModel.worldSize = { width, height};
            }
        });

        this.onRender.subscribe(`${this.name} render`, this.renderMe);
        this.onDestroyed.subscribe(`${this.name} destroy`, this.destroyMe);

        this.theAppModel.onGameEnded = () =>
        {
            console.log("End game signalled");
            if(document.fullscreen && this.theAppModel.settings.isFullScreen)  document.exitFullscreen();   
            this.parent?.AddChild(new MainMenuWidget("Main Menu", this.theAppModel));
            this.parent?.RemoveChild(this);
        }
    } 

    //-------------------------------------------------------------------------
    // destroyMe
    //-------------------------------------------------------------------------
    destroyMe = () =>
    {
        if(this.diagnosticsControl) {
            this.diagnosticsControl.cancelMe();
            this.diagnosticsControl = null;
        }
        if(this.newPlayerControl) {
            this.newPlayerControl.cancelMe();
            this.newPlayerControl = null;
        }
        this.theAppModel.gameListener = null;
        this.widgetSystem?.keyboardManager.onUnhandledKeyCode.unsubscribe("Game Controller unhandled Key");
        this.mainScoreText?.delete();

        for(let control of this.renderingControls.values())
        {
            control.delete();
        }
        this.renderingControls.clear();
        
        for(let control of this.playerDetailControls.values())
        {
            control.cancelMe();
        }
        this.playerDetailControls.clear();
        
        this.widgetSystem?.gamepadManager.reset();
        this.widgetSystem?.keyboardManager.reset();
        this.inviteText?.delete();
    }

    //-------------------------------------------------------------------------
    // loadMe
    //-------------------------------------------------------------------------
    loadMe = () =>
    {
        if(!this.widgetSystem) throw new Error("Widget System is not loaded!");

        this.theAppModel.worldSize = {width: this.widgetSystem.drawing.width, height: this.widgetSystem.drawing.height};
        this.theAppModel.gameListener = this;

        this.widgetSystem.keyboardManager.onUnhandledKeyCode.subscribe("Game Controller unhandled Key", this.handleUnhandledKey);
        //this.gamepadManager.onUnhandledInputCode.subscribe("Game Controller unhandled gamepad", this.handleUnhandledGamepadCode);
    
        this.mainScoreText = this.widgetSystem.drawing.addTextObject("Score: 00000", this.width-10, 3, 15, 0xffff00, 0x0, 0, 1000, [1,0] );
    }

    //-------------------------------------------------------------------------
    // When a player goes away
    //-------------------------------------------------------------------------
    onPlayerRemoved = (player: Player) => {

    }

    //-------------------------------------------------------------------------
    // Deal with added objects
    //-------------------------------------------------------------------------
    onAddedGameObject = (gameObject: GameObject) => {
        if(!this.widgetSystem) throw new Error("Shouldn't be adding game objects with no widget system!")
        switch(gameObject.type)
        {
            case GameObjectType.Player: 
                let player = gameObject as Player;
                this.renderingControls.set(gameObject, new PlayerObjectRenderer(gameObject as Player, this.widgetSystem.drawing, this.widgetSystem.sound)); 
                if(!this.playerDetailControls.has(player.number))
                {
                    let size = GLOBALS.INFO_Y_AREA;
                    let control = new PlayerDetailControl(this.widgetSystem?.drawing as DrawHelper, player, size, size);
                    control.x = player.number * size + size * .2;
                    this.playerDetailControls.set(player.number, control);
                }
                let playerControl = this.playerDetailControls.get(player.number);
                if(playerControl)
                {
                    playerControl.player = player;    
                }

                break;
            case GameObjectType.Bullet: this.renderingControls.set(gameObject, new BulletObjectRenderer(gameObject as Bullet, this.widgetSystem.drawing, this.widgetSystem.sound)); break;
            case GameObjectType.Alien: this.renderingControls.set(gameObject, new AlienObjectRenderer(gameObject as Alien, this.widgetSystem.drawing, this.widgetSystem.sound)); break;
            case GameObjectType.ShieldBlock: this.renderingControls.set(gameObject, new ShieldBlockObjectRenderer(gameObject as Alien, this.widgetSystem.drawing, this.widgetSystem.sound)); break;
        }
    }

    //-------------------------------------------------------------------------
    // Deal with removed objects
    //-------------------------------------------------------------------------
    onRemovedGameObject = (gameObject: GameObject) => {
        let renderer = this.renderingControls.get(gameObject);
        if(!renderer) return;
        renderer.delete();
        this.renderingControls.delete(gameObject);
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    renderMe = () => {
        let gameTime = Date.now();
        let elapsed = gameTime - this.lastFrameTime;
        this.lastFrameTime = gameTime;

        if(!this.widgetSystem) throw new Error("Lost the widget system somehouw");

        // Update rendered object
        this.theAppModel.think(gameTime, elapsed);
        for(let renderer of this.renderingControls.values()) {
            renderer.render();
        };

        for(let renderer of this.playerDetailControls.values()) {
            renderer.render();
        };

        if(this.theAppModel.getPlayers().length == 0 && !this.inviteText)
        {
            this.inviteText = this.widgetSystem.drawing.addTextObject("Use movement controls to add a new player...",
                this.width/2, this.height - 100, 20,0xFFFFFF,0x0,0,2000, [.5,.5]);
        }

        if(this.theAppModel.getPlayers().length > 0 && this.inviteText)
        {
            this.inviteText.delete();
            this.inviteText = null;
        }

        if(this.newPlayerControl) this.newPlayerControl.render();
        if(this.diagnosticsControl) this.diagnosticsControl.render();

        if(this.inviteText)
        {
            this.inviteText.x = this.width/2;
            this.inviteText.y = 100;
        }

        let scores = "";
        this.theAppModel.getPlayers().forEach(player => {
            scores += `${player.name}:${player.score.toString().padStart(5, '0')}\n`;
        });


        let totalText = this.theAppModel.totalScore.toString().padStart(6, '0');
        let maxText = this.theAppModel.maxScore.toString().padStart(6, '0');
        if(this.mainScoreText) {
            this.mainScoreText.text = `Score: ${totalText}  Max:${maxText}`;
            this.mainScoreText.x = this.width -this.mainScoreText.width;
        }
    }

    //-------------------------------------------------------------------------
    // generatePlayer
    //-------------------------------------------------------------------------
    generatePlayer(controlId: string)
    {
        let newPlayer = new Player(this.theAppModel);
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
        if(code == GamepadInputCode.Button_Back) {
            console.log("BACK");
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
                            this.theAppModel.addPlayer(newPlayer);
                            this.widgetSystem?.gamepadManager.addTranslator(translator);
                            newPlayer.onCleanup.subscribe("removeTranslator", () => this.widgetSystem?.gamepadManager.removeTranslator(translator));
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
                        this.newPlayerControl = new NewPlayerControl(controllerIndex.toString(), this.widgetSystem?.drawing as DrawHelper, () =>
                        {
                            this.widgetSystem?.gamepadManager.removeTranslator(newTranslator);
                            this.newPlayerControl = null;
                        });

                        newTranslator.mapAxis(value[0], PlayerAction.Left, PlayerAction.Right);
                        newTranslator.mapAxis(value[1], PlayerAction.Up, PlayerAction.Down);

                        this.widgetSystem?.gamepadManager.addTranslator(newTranslator);
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
                this.diagnosticsControl = new DiagnosticsControl(
                    this.widgetSystem?.drawing as DrawHelper, 
                    this.widgetSystem?.gamepadManager as GamepadManager, 
                    this.widgetSystem?.keyboardManager as KeyboardManager, 
                    this.theAppModel.diagnostics)
            }
            return;
        }

        if(keyCode == 27) {  // Esc to reset the game
            this.theAppModel.endGame();
            return;
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
                            this.theAppModel.addPlayer(newPlayer);
                            this.widgetSystem?.keyboardManager.addTranslator(translator);
                            newPlayer.onCleanup.subscribe("removeKeyTranslator",() =>  this.widgetSystem?.keyboardManager.removeTranslator(translator));
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
                        this.newPlayerControl = new NewPlayerControl('keyboard', this.widgetSystem?.drawing as DrawHelper, () =>
                        {
                            this.widgetSystem?.keyboardManager.removeTranslator(newTranslator);
                            this.newPlayerControl = null;
                        });
                        newTranslator.mapKey(value[0], PlayerAction.Up);
                        newTranslator.mapKey(value[1], PlayerAction.Left);
                        newTranslator.mapKey(value[2], PlayerAction.Down);
                        newTranslator.mapKey(value[3], PlayerAction.Right);
                        this.widgetSystem?.keyboardManager.addTranslator(newTranslator);
                        newTranslator.addSubscriber(this.newPlayerControl);
                        this.newPlayerControl.translator = newTranslator;
                    }
                }
            });
        }
    }
}