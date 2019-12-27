import { IAppModel, AppModel } from "../models/AppModel";
import { Sprite } from "../ui/Sprite";
import { KeycodeTranslator, KeyboardManager } from "../ui/KeyboardInput";
import { NewPlayerControl } from "./NewPlayerControl";
import { Player } from "../models/Player";
import { DrawHelper } from "../ui/DrawHelper";
import { GamepadManager, GamepadInputCode, GamepadTranslator } from "../ui/GamepadInput";

const PLAYER_SIZE = 16;

export enum PlayerAction {
    None,
    Up,
    Left,
    Right,
    Down,
    Fire
}

export class GameController 
{
    appModel: IAppModel;
    resized_recently = true;
    play_ding = false;
    frame = 0;
    drawing: DrawHelper;
    mouseX = 0;
    mouseY = 0;
    gamepadThingX = 0;
    keyboardManager: KeyboardManager;
    gamepadManager: GamepadManager;
    newPlayerControl: NewPlayerControl | null = null;
    lastFrameTime = Date.now();
    inputState = new Array<number>();

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
        ["Right Trigger", [GamepadInputCode.Axis_RightTrigger,GamepadInputCode.Axis_RightShoulder]],
        ["Left Trigger", [GamepadInputCode.Axis_LeftTrigger,GamepadInputCode.Axis_LeftShoulder]],
    ]); 

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(appModel: IAppModel, canvas: HTMLCanvasElement)
    {
        this.appModel = appModel;  
        const drawContext = canvas.getContext("2d") || (() => { throw new Error('No 2D support'); })();
        this.drawing = new DrawHelper(drawContext);
        this.keyboardManager = new KeyboardManager();
        this.keyboardManager.onUnhandledKeyCode = this.handleUnhandledKey;
        this.gamepadManager = new GamepadManager();
        this.gamepadManager.onUnhandledInputCode = this.handleUnhandledGamepadCode;
    
        requestAnimationFrame(this.animation_loop);
        window.addEventListener("resize", this.resize_handler);
        canvas.addEventListener("click", this.handleCanvasClick);
        canvas.addEventListener("mousemove", this.handleCanvasMouseMove);

        for(var i = 0; i < 50; i++) this.inputState.push(0);
    } 

    //-------------------------------------------------------------------------
    // handle gamepads
    //-------------------------------------------------------------------------
    handleUnhandledGamepadCode = (controllerIndex: number, code: GamepadInputCode, value: number) => {
        this.inputState[code] = value;
        if(this.newPlayerControl) 
        {
            // Let's see if the staged player has pressed a fire key
            this.CommonGamepadActionButtonLayouts.forEach((value, key) =>
            {
                for(let i = 0; i < value.length; i++)
                {
                    if(value[i] == code)
                    {
                        const translator = this.newPlayerControl?.translator as GamepadTranslator<PlayerAction>;
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
                            let newPlayer = new Player();
                            translator.addSubscriber(newPlayer);
                            this.appModel.addPlayer(newPlayer);
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
                        var newTranslator = new GamepadTranslator<PlayerAction>();
                        this.newPlayerControl = new NewPlayerControl(this.drawing, () =>
                        {
                            this.gamepadManager.removeTranslator(newTranslator);
                            this.newPlayerControl = null;
                        });

                        newTranslator.mapAxis(value[0], PlayerAction.Left, PlayerAction.Right);
                        newTranslator.mapAxis(value[1], PlayerAction.Up, PlayerAction.Down);

                        this.gamepadManager.addTranslator(newTranslator, controllerIndex);
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
        if(this.newPlayerControl) 
        {
            // Let's see if the staged player has pressed a fire key
            this.CommonActionKeyLayouts.forEach((value, key) =>
            {
                for(let i = 0; i < value.length; i++)
                {
                    if(value[i] == keyCode)
                    {
                        const translator = this.newPlayerControl?.translator;
                        if(translator)
                        {
                            translator.mapKey(value[0], PlayerAction.Fire);
                            translator.mapKey(value[1], PlayerAction.Fire);
                            translator.mapKey(value[2], PlayerAction.Fire);
                            if(this.newPlayerControl)
                            {
                                translator.removeSubscriber(this.newPlayerControl);
                            }
                            let newPlayer = new Player();
                            translator.addSubscriber(newPlayer);
                            this.appModel.addPlayer(newPlayer);
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
                        var newTranslator = new KeycodeTranslator<PlayerAction>();
                        this.newPlayerControl = new NewPlayerControl(this.drawing, () =>
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
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
        this.play_ding = true;
    }

    //-------------------------------------------------------------------------
    // handle mouse movement
    //-------------------------------------------------------------------------
    handleCanvasMouseMove = (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;
    }

    //-------------------------------------------------------------------------
    // Resize event - don't do anything here other than signal a resize
    //-------------------------------------------------------------------------
    resize_handler = (event: unknown) => {
        this.resized_recently = true;
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    animation_loop = (event: unknown) => {
        let gameTime = Date.now();
        let elapsed = gameTime - this.lastFrameTime;
        let lastFrameTime = gameTime;

        if (this.resized_recently) {
            // Uncomment this to resize the canvas with the window
            // width = window.innerWidth;
            // height = window.innerHeight;
            // myCanvas.width = width;
            // myCanvas.height = height;
            // resized_recently = false;
        }

        if(this.play_ding)
        {
            this.play_ding = false;
            const sound = new Audio("ding.wav");
            sound.play();
        }

        // Clear the screen
        this.drawing.clear("#000000");

        // Show some info about the current frame and screen size
        this.drawing.print(
            "Frame: " + this.frame, 
            10, this.drawing.height - 20, 10,"#0000FF");

        // Render the players
        this.appModel.getPlayers().forEach( player => {
            player.think(gameTime, elapsed);
            if(player.x < 0) player.x = 0;
            if(player.x > this.drawing.width - PLAYER_SIZE) player.x = this.drawing.width - PLAYER_SIZE;
            this.drawing.drawSprite(90, player.x, this.drawing.height - 40);
        });

        if(this.appModel.getPlayers().length == 0)
        {
            this.drawing.print(
                "Use movement controls to add a new player...", 
                this.drawing.width/2 - 200, this.drawing.height - 100, 20,"#FFFFFF");
        }

        if(this.newPlayerControl)
        {
            this.newPlayerControl.render();
        }

        this.showGamepadStates();

        this.frame++;
        requestAnimationFrame(this.animation_loop);
    }

    showGamepadStates()
    {
        for(var i = 0; i < 10; i++)
        {
            this.drawing.print(`A${i}: ${this.inputState[GamepadInputCode.Axis0 + i]}`, 30, 50 + i *15);
        }
        for(var i = 0; i < 20; i++)
        {
            this.drawing.print(`B${i}: ${this.inputState[GamepadInputCode.Button00 + i]}`, 330, 50 + i *15);
        }
    }
}