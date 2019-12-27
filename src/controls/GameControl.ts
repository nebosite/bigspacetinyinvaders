import { IAppModel } from "../models/AppModel";
import { Sprite } from "../ui/Sprite";
import { KeycodeTranslator, KeyboardManager } from "../ui/KeyboardInput";
import { NewPlayerControl } from "./NewPlayerControl";

export enum PlayerAction {
    None,
    Up,
    Left,
    Right,
    Down,
    
}

export class GameController 
{
    _appModel: IAppModel;
    _resized_recently = true;
    _play_ding = false;
    _width = 200;
    _height = 200;
    _frame = 0;
    _gameSprites: Sprite;
    _drawContext: CanvasRenderingContext2D;
    _myCanvas: HTMLCanvasElement;
    _mouseX = 0;
    _mouseY = 0;
    _arrowOn = false;
    _keyThingX = 0;
    _gamepadThingX = 0;
    keyboardManager = new KeyboardManager();
    newPlayerControl: NewPlayerControl | null = null;

    CommonDirectionKeyLayouts = new Map([
        ["IJKL", [73,74,75,76]],
        ["WASD", [87,65,83,68]],
        ["Arrows", [38,37,40,39]],
        ["Numpad 8456", [104,100,101,102]]
    ]);

    
    // CommonActionKeyLayouts = {
    //     "ShiftZX": [16,90,88],
    //     "SpcNM": [32,78,77],
    //     "0.Enter": [96,110,13],
    //     "DelEndPgdwn": [46,35,24],
    // };

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(appModel: IAppModel)
    {
        this._appModel = appModel;  

        this._myCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
        this._width =  this._myCanvas.width;
        this._height = this._myCanvas.height;
        this._drawContext = this._myCanvas.getContext("2d") || (() => { throw new Error('No 2D support'); })();
        this._gameSprites = new Sprite(this._drawContext, "sprites.png", 16,16);
        requestAnimationFrame(this.animation_loop);
        window.addEventListener("resize", this.resize_handler);
        this._myCanvas.addEventListener("click", this.handleCanvasClick);
        this._myCanvas.addEventListener("mousemove", this.handleCanvasMouseMove);
        window.addEventListener('gamepadconnected', e => this.handleGamepadConnect(e, true));
        window.addEventListener('gamepaddisconnected',  e => this.handleGamepadConnect(e, false));
    } 

    //-------------------------------------------------------------------------
    // handle gamepad connection
    //-------------------------------------------------------------------------
    handleGamepadConnect = (e: Event, connecting: boolean) => {
        const gamepadEvent = e as GamepadEvent;
        if(connecting) {
            // access like this: gam
            const gp = gamepadEvent.gamepad;    
            console.log(`Connect detected: Axes:${gp.axes.length} Buttons:${gp.buttons.length} Id:${gp.id}`);
            
            for(var i = 0; i < gp.buttons.length; i++)
            {
                console.log(`Button ${i}: ${gp.buttons[i].value} `);
            }
        }

        // XBox layout
        // buttons: [
        //     'DPad-Up','DPad-Down','DPad-Left','DPad-Right',
        //     'Start','Back','Axis-Left','Axis-Right',
        //     'LB','RB','Power','A','B','X','Y',
        //   ],
    }

    //-------------------------------------------------------------------------
    // handle keyboard
    //-------------------------------------------------------------------------
    handleUnhandledKey = (keyCode: number) => {
        if(this.newPlayerControl) return;
        this.CommonDirectionKeyLayouts.forEach((value, key) =>
        {
            for(let i = 0; i < value.length; i++)
            {
                if(value[i] == keyCode)
                {
                    this.newPlayerControl = new NewPlayerControl(this._drawContext);
                    var newTranslator = new KeycodeTranslator<PlayerAction>();
                    newTranslator.mapKey(value[0], PlayerAction.Up);
                    newTranslator.mapKey(value[1], PlayerAction.Left);
                    newTranslator.mapKey(value[2], PlayerAction.Down);
                    newTranslator.mapKey(value[3], PlayerAction.Right);
                    this.keyboardManager.addTranslator(newTranslator);
                }
            }
        });
    }

    //-------------------------------------------------------------------------
    // handle mouse clicks
    //-------------------------------------------------------------------------
    handleCanvasClick = (e: MouseEvent) => {
        this._mouseX = e.clientX;
        this._mouseY = e.clientY;
        this._play_ding = true;
    }

    //-------------------------------------------------------------------------
    // handle mouse movement
    //-------------------------------------------------------------------------
    handleCanvasMouseMove = (e: MouseEvent) => {
        this._mouseX = e.clientX;
        this._mouseY = e.clientY;
    }

    //-------------------------------------------------------------------------
    // Resize event - don't do anything here other than signal a resize
    //-------------------------------------------------------------------------
    resize_handler = (event: unknown) => {
        this._resized_recently = true;
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    animation_loop = (event: unknown) => {
        if (this._resized_recently) {
            // Uncomment this to resize the canvas with the window
            // width = window.innerWidth;
            // height = window.innerHeight;
            // myCanvas.width = width;
            // myCanvas.height = height;
            // resized_recently = false;
        }

        if(this._play_ding)
        {
            this._play_ding = false;
            const sound = new Audio("ding.wav");
            sound.play();
        }

        // Fill the screen with gray
        this._drawContext.fillStyle = "#999999"
        this._drawContext.fillRect(0, 0, this._width, this._height);
        
        // Show some info about the current frame and screen size
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
        this._drawContext.fillStyle = "#ffffff"
        this._drawContext.strokeStyle = "#000000";
        this._drawContext.font = '50px serif';
        this._drawContext.fillText("Current Size: " + this._width + "," + this._height, 10, 400);
        this._drawContext.strokeText("Frame: " + this._frame, 10, 590);

        //Draw some sprites
        this._gameSprites.draw(1, 150, 100);
        this._gameSprites.draw(10, 100, 150);
        this._gameSprites.draw(0, 
            this._mouseX - this._myCanvas.offsetLeft - 25, 
            this._mouseY - this._myCanvas.offsetTop - 25);


        // Some vector art 
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
        this._drawContext.fillStyle = "#ff0000"
        this._drawContext.beginPath();
        this._drawContext.moveTo(75, 50);
        this._drawContext.lineTo(100, 75);
        this._drawContext.lineTo(100, 25);
        this._drawContext.fill();

        //Keyboard controlled object
        if(this._arrowOn) this._keyThingX++;
        this._drawContext.fillStyle = "#000000"
        this._drawContext.font = '20px sans-serif';
        this._drawContext.fillText("Press right arrow", this._keyThingX + 20, 300);
      
        //Gamepad controlled object
        const gamePads = navigator.getGamepads();
        if(gamePads)
        {
            for (var i = 0, len = gamePads.length; i < len; i++) {
                const gp =  gamePads[i] as Gamepad;
                if(!gp) continue;
                if(gp.buttons[0].pressed)
                {
                    this._gamepadThingX++;
                }
            }
        }
        this._drawContext.fillText("Press button on gamepad", this._gamepadThingX + 20, 330);

        if(this.newPlayerControl)
        {
            this.newPlayerControl.render();
        }

        this._frame++;
        requestAnimationFrame(this.animation_loop);
    }
}