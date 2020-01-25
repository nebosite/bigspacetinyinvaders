import { IAppModel, IGameListener } from "../models/AppModel";
import { NewPlayerWidget } from "./NewPlayerWidget";
import { Player } from "../models/Player";
import { DrawHelper, DrawnText } from "../ui/DrawHelper";
import { GameObjectType, GameObject } from "../models/GameObject";
import { Alien } from "../models/Alien";
import { GameObjectRenderer, PlayerObjectRenderer, BulletObjectRenderer, AlienObjectRenderer, ShieldBlockObjectRenderer, DebrisObjectRenderer } from "./GameObjectRendering";
import { Bullet } from "../models/Bullet";
import { DiagnosticsControl } from "./DiagnosticsControl";
import { GLOBALS } from "../globals";
import { EventThing } from "../tools/EventThing";
import { Widget } from "../WidgetLib/Widget";
import { MainMenuWidget } from "./MainMenuWidget";
import { PlayerDetailControl } from "./PlayerDetailControl";
import { Debris } from "../models/Debris";
import { WidgetButtonCode, ButtonEvent, WidgetSystem } from "../WidgetLib/WidgetSystem";
import { ButtonEventTranslator } from "../tools/ButtonEventTranslator";
import { TextWidget } from "../WidgetLib/TextWidget";

const PLAYER_SIZE = 16;

class PlayerIdentity{
    id = 0;
    name = "";
    controllerId = "";
    actionControl = "";
    movementControl = "";
}

class InviteWidget extends Widget
{

    constructor()
    {
        super("Player Invite");
        // this.backgroundColor = 0x00ff00;
        // this.alpha = .1;

        this.onLoaded.subscribe(`${this.name} Load`, ()=>
        {
            if(!this.widgetSystem) return;
            
            let inviteText = new TextWidget("invite text", "Waiting for players to join ...");
            inviteText.foregroundColor = 0xffffff;
            inviteText.relativeSize = {width: .9, height: null};
            inviteText.relativeLocation = {x: .5, y: .1};
            inviteText.fontSize = 50;
            this.AddChild(inviteText);

            let detailText = new TextWidget("detail text", "KB move: IJKL, WASD, Arrows, 8456");
            detailText.foregroundColor = 0xffffff;
            detailText.relativeSize = {width: null, height: .1};
            detailText.relativeLocation = {x: .5, y: .3};
            detailText.fontSize = 30;
            this.AddChild(detailText);

            detailText = new TextWidget("detail text2", "KB action: SftZXC, SpcBNM, 0.Enter+, DelEndPgdwnPgup");
            detailText.foregroundColor = 0xffffff;
            detailText.relativeSize = {width: null, height: .1};
            detailText.relativeLocation = {x: .5, y: .5};
            detailText.fontSize = 30;
            this.AddChild(detailText);

            detailText = new TextWidget("detail text3", "Controllers: Left or Right stick + buttons");
            detailText.foregroundColor = 0xffffff;
            detailText.relativeSize = {width: null, height: .1};
            detailText.relativeLocation = {x: .5, y: .7};
            detailText.fontSize = 30;
            this.AddChild(detailText);

        });
    }
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
    invite: InviteWidget | null = null;
    mainScoreText: DrawnText| null = null;
    maxScoreText: DrawnText| null = null;
    onGameOver = new EventThing<void>("Game Widget");
    hasSetSize = false;
    started = false;

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

        if(this.theAppModel.getPlayers().length == 0 && !this.invite && this.started)
        {
            this.invite = new InviteWidget();
            this.invite.width = 100;
            this.invite.height = 50;
            this.invite.relativeSize = {width: .3, height: null};
            this.invite.relativeLocation = {x:.5, y:0.2};
            this.AddChild(this.invite);
        }

        if(this.theAppModel.getPlayers().length > 0 && this.invite)
        {
            this.RemoveChild(this.invite);
            this.invite = null;
        }

        if(this.diagnosticsControl) this.diagnosticsControl.render();

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

        let key = `${event.controllerId}:${event.buttonCode}`;
        if(this.buttonTranslationMap.has(key))
        {
            this.buttonTranslationMap.get(key)?.handleButtonEvent(event);
            event.handled = true;
            return;
        }
        
        if(event.isPressed && (
            event.buttonCode == WidgetButtonCode.Button_Back
            || event.buttonCode == 27 // esc key
            )) 
        {
            this.theAppModel.endGame();
            event.handled = true;
            return;
        }

        // press tick (`) for diagnostics
        if(event.isPressed && event.buttonCode ==  192) 
        {
            if(this.diagnosticsControl) {
                this.diagnosticsControl.cancelMe();
                this.diagnosticsControl = null;
            }
            else {
                this.diagnosticsControl = new DiagnosticsControl(
                    this.widgetSystem as WidgetSystem,
                    this.theAppModel.diagnostics)
            }
            event.handled = true;
            return;
        }

        // THis is an unhandled button.  If there is no New Player widget and the
        // button is a control button, we need to show the new player widget
        if(!this.newPlayerWidget && NewPlayerWidget.isContollerButton( event.buttonCode)) 
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