import { IAppModel, AppModel, IGameListener } from "../models/AppModel";
import { KeycodeTranslator, KeyboardManager } from "../ui/KeyboardInput";
import { NewPlayerWidget } from "./NewPlayerWidget";
import { Player } from "../models/Player";
import { DrawHelper, DrawnObject, DrawnText } from "../ui/DrawHelper";
import { GamepadManager, GamepadInputCode, GamepadTranslator } from "../ui/GamepadInput";
import { GameObjectType, GameObject } from "../models/GameObject";
import { Alien } from "../models/Alien";
import { GameObjectRenderer, PlayerObjectRenderer, BulletObjectRenderer, AlienObjectRenderer, ShieldBlockObjectRenderer, DebrisObjectRenderer } from "./GameObjectRendering";
import { Bullet } from "../models/Bullet";
import { DiagnosticsControl } from "./DiagnosticsControl";
import { GLOBALS } from "../globals";
import { SoundHelper } from "../ui/SoundHelper";
import { EventThing } from "../tools/EventThing";
import { Widget } from "../WidgetLib/Widget";
import { MainMenuWidget } from "./MainMenuWidget";
import { PlayerDetailControl } from "./PlayerDetailControl";
import { Debris } from "../models/Debris";
import { WidgetButtonCode, ButtonEvent } from "../WidgetLib/WidgetSystem";
import { ButtonEventTranslator } from "../tools/ButtonEventTranslator";

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
    controllerId = "";
    actionControl = "";
    movementControl = "";
}

export class GameWidget extends Widget implements IGameListener
{
    theAppModel: IAppModel;
    newPlayerWidget: NewPlayerWidget | null = null;
    diagnosticsControl: DiagnosticsControl | null = null;
    lastFrameTime = Date.now();
    playerIdentities = new Map<string, PlayerIdentity>();
    seenPlayersCount = 0;
    renderingControls = new Map<GameObject, GameObjectRenderer>();
    playerDetailControls = new Map<number, PlayerDetailControl>();
    buttonTranslationMap = new Map<string, ButtonEventTranslator>();
    inviteText: DrawnText | null = null;
    mainScoreText: DrawnText| null = null;
    maxScoreText: DrawnText| null = null;
    onGameOver = new EventThing<void>("Game Widget");
    hasSetSize = false;
    started = false;

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

        this.onLoaded.subscribe(`${this.name} Load`, this.loadMe);
        this.onParentLayoutChanged.subscribe(`${this.name} parentLayoutChanged`, this.updateBasedOnParent);
        this.onRender.subscribe(`${this.name} render`, this.renderMe);
        this.onDestroyed.subscribe(`${this.name} destroy`, this.destroyMe);
        this.onButtonEvent.subscribe(`${this.name} Button`, this.handleButtons ); 

        this.theAppModel.onGameEnded = () =>
        {
            console.log("End game signalled");
            if(document.fullscreen && this.theAppModel.settings.isFullScreen)  document.exitFullscreen();   
            this.parent?.AddChild(new MainMenuWidget("Main Menu", this.theAppModel));
            this.parent?.RemoveChild(this);
        }
    } 

    //-------------------------------------------------------------------------
    // loadMe
    //-------------------------------------------------------------------------
    updateBasedOnParent = () => 
    {
        console.log(`Layout changed ${this.width},${this.height}`)
        // if we exit fullscreen, just end the game
        if(!this.hasSetSize && this.theAppModel.settings.isFullScreen && !document.fullscreen)
        {
            this.theAppModel.endGame();
        }

        if(!this.hasSetSize || this.theAppModel.settings.isFullScreen)
        {
            let width = this.width;
            let height = this.height;
            if(this.theAppModel.settings.isFullScreen)
            {
                width = this.widgetSystem?.drawing.width as number;
                height = this.widgetSystem?.drawing.height as number;
            }
            this.hasSetSize = true;
            console.log(`Setting world size to ${width},${height}`);
            this.theAppModel.worldSize = { width, height};
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
        this.theAppModel.gameListener = null;
        // this.widgetSystem?.keyboardManager.onUnhandledKeyCode.unsubscribe("Game Controller unhandled Key");
        // this.widgetSystem?.gamepadManager.onUnhandledInputCode.unsubscribe("Game Controller unhandled gamepad");
        this.mainScoreText?.delete();
        this.maxScoreText?.delete();

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

        this.mainScoreText = this.widgetSystem.drawing.addTextObject("Score: 00000", this.width-10, 3, 30, 0xffff00, 0x0, 0, 1000, [1,0] );
        this.maxScoreText = this.widgetSystem.drawing.addTextObject("Score: 00000", this.width-10, 40, 30, 0xffff00, 0x0, 0, 1000, [1,0] );
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
            case GameObjectType.Debris: this.renderingControls.set(gameObject, new DebrisObjectRenderer(gameObject as Debris, this.widgetSystem.drawing, this.widgetSystem.sound)); break;
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
    // Signal that we can start actively managing the game
    //-------------------------------------------------------------------------
    Start()
    {
        this.started = true;
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

        if(this.diagnosticsControl) this.diagnosticsControl.render();

        if(this.inviteText)
        {
            this.inviteText.x = this.left + this.width/2;
            this.inviteText.y = this.top + 100;
        }

        let totalText = this.theAppModel.totalScore.toString().padStart(6, '0');
        let maxText = this.theAppModel.maxScore.toString().padStart(6, '0');
        if(this.mainScoreText) {
            this.mainScoreText.text = `Score: ${totalText}`;
            this.mainScoreText.x = this.left + this.width - 10;
            this.mainScoreText.y = this.top + 3;
        }
        if(this.maxScoreText) {
            this.maxScoreText.text = `Max: ${maxText}`;
            this.maxScoreText.x = this.mainScoreText?.x as number;
            this.maxScoreText.y = (this.mainScoreText?.y as number) + (this.mainScoreText?.height as number);
        }
    }

    //-------------------------------------------------------------------------
    // generatePlayer
    //-------------------------------------------------------------------------
    generatePlayer(controlId: string, actionControl: string, movementControl: string)
    {
        let key = `${controlId}:${actionControl}:${movementControl}`;
        let newPlayer = new Player(this.theAppModel);
        var playerInfo = new PlayerIdentity();
        if(this.playerIdentities.has(key))
        {
            playerInfo = this.playerIdentities.get(key) as PlayerIdentity;
        }
        else
        {
            playerInfo.id = this.seenPlayersCount++;
            playerInfo.name = `P:${playerInfo.id}`;
            playerInfo.actionControl = actionControl;
            playerInfo.movementControl = movementControl;
            playerInfo.controllerId = controlId;
            this.playerIdentities.set(key, playerInfo);
        }
        newPlayer.number = playerInfo.id;
        newPlayer.name = playerInfo.name;
        return newPlayer;
    }

    //-------------------------------------------------------------------------
    // handleButtons
    //-------------------------------------------------------------------------
    handleButtons = (event: ButtonEvent) =>
    {
        if(!this.started) return;
        if(this.destroyed) throw new Error("Should not be getting input on destroyed game");

        let key = `${event.controllerId}:${event.buttonId}`;
        if(this.buttonTranslationMap.has(key))
        {
            this.buttonTranslationMap.get(key)?.handleButtonEvent(event);
            event.handled = true;
            return;
        }
        
        if(event.isPressed && (
            event.buttonId == WidgetButtonCode.Button_Back
            || event.buttonValue == 27 // esc key
            )) 
        {
            this.theAppModel.endGame();
            event.handled = true;
            return;
        }

        // press tick (`) for diagnostics
        if(event.isPressed && event.buttonId ==  192) 
        {
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
            event.handled = true;
            return;
        }

        // THis is an unhandled button.  If there is no New Player widget and the
        // button is a control button, we need to show the new player widget
        if(!this.newPlayerWidget && NewPlayerWidget.isContollerButton( event.buttonId)) 
        {
            this.CreateNewPlayerWidget(event.controllerId);
        }
    }

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    CreateNewPlayerWidget(controllerId: string)
    {
        this.newPlayerWidget = new NewPlayerWidget(controllerId, 
            () => // OnCancel
            {
                this.RemoveChild(this.newPlayerWidget as Widget)
                this.newPlayerWidget = null;
            },
            () => // OnComplete;
            {
                let newPlayer = this.generatePlayer(
                    this.newPlayerWidget?.controllerId as string,
                    this.newPlayerWidget?.actionButtonCluster as string, 
                    this.newPlayerWidget?.movementButtonCluster as string);
                let buttonTranslator = this.newPlayerWidget?.buttonTranslator as ButtonEventTranslator;
                buttonTranslator.addSubscriber(newPlayer);
                for(let key of buttonTranslator.getHandledCodes())
                {
                    this.buttonTranslationMap.set(key, buttonTranslator);
                }
                this.theAppModel.addPlayer(newPlayer);
                newPlayer.onCleanup.subscribe("removeTranslator", () => 
                {
                    for(let key of buttonTranslator.getHandledCodes())
                    {
                        this.buttonTranslationMap.delete(key);
                    }
                });
                
                this.RemoveChild(this.newPlayerWidget as Widget);
                this.newPlayerWidget = null;
            }
        );

        this.newPlayerWidget.relativeLocation = {x:.2, y:.3};
        this.newPlayerWidget.relativeSize = {width:.3, height: null};
        this.AddChild(this.newPlayerWidget);
    }
}