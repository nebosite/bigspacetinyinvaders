import { IAppModel } from "../models/AppModel";
import { Sprite } from "../ui/Sprite";

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
    _sound_ding = document.getElementById("audio_ding"); 

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
        this._gameSprites = new Sprite(this._drawContext, "sprites.png", 50, 50);
        requestAnimationFrame(this.animation_loop);
        window.addEventListener("resize", this.resize_handler);
        this._myCanvas.addEventListener("click", this.handleCanvasClick);
        this._myCanvas.addEventListener("mousemove", this.handleCanvasMouseMove);
        
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
        this._drawContext.fillStyle = "#ffffff"
        this._drawContext.strokeStyle = "#000000";
        
        // Show some info about the current frame and screen size
        // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
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

        this._frame++;
        requestAnimationFrame(this.animation_loop);
    }

}