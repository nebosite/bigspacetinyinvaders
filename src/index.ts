
class Sprite {
    _spriteWidth: number;
    _spriteHeight: number;
    _context: CanvasRenderingContext2D;
    _imageName: string;
    _spritesPerRow: number;
    _spriteBuffer: HTMLImageElement;

    constructor(context: CanvasRenderingContext2D, 
        imageName: string, 
        spriteWidth: number, 
        spriteHeight: number) {
        this._spriteWidth = spriteWidth;
        this._spriteHeight = spriteHeight;
        this._context = context;
        this._imageName = imageName;
        this._spriteBuffer = new Image();
        this._spritesPerRow = -1;
        this._spriteBuffer.src = imageName;
    }

    draw(spriteNumber: number, x: number, y: number) {
        if(this._spritesPerRow == -1)
        {
            this._spritesPerRow = Math.floor(this._spriteBuffer.width / this._spriteWidth);
        }
        var spriteX = (spriteNumber % this._spritesPerRow) * this._spriteWidth;
        var spriteY = Math.floor(spriteNumber / this._spritesPerRow) * this._spriteHeight;
        this._context.drawImage(this._spriteBuffer, spriteX, spriteY, this._spriteWidth, this._spriteHeight, x, y, this._spriteWidth, this._spriteHeight);
    } 
}

// Globals
var resized_recently = true;
var play_ding = false;
var width = 200;
var height = 200;
var frame = 0;
var gameSprites: Sprite;
var drawContext: CanvasRenderingContext2D;
var mouseX = 0;
var mouseY = 0;
var sound_ding = document.getElementById("audio_ding"); 

function handleCanvasClick(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    play_ding = true;
}

function handleCanvasMouseMove(e: MouseEvent) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}

//-------------------------------------------------------------------------
// Resize event - don't do anything here other than signal a resize
//-------------------------------------------------------------------------
function resize_handler(event: unknown) {
    resized_recently = true;
}

//-------------------------------------------------------------------------
// Animation Loop
//-------------------------------------------------------------------------
function animation_loop(event: unknown) {
    if (resized_recently) {
        // Uncomment this to resize the canvas with the window
        // width = window.innerWidth;
        // height = window.innerHeight;
        // myCanvas.width = width;
        // myCanvas.height = height;
        // resized_recently = false;
    }

    // if(play_ding)
    // {
    //     // https://webaudioapi.com/samples/
    //     play_ding = false;
    //     sound_ding.play();
    // }

    // Fill the screen with gray
    drawContext.fillStyle = "#999999"
    drawContext.fillRect(0, 0, width, height);
    drawContext.fillStyle = "#ffffff"
    drawContext.strokeStyle = "#000000";
    
    // Show some info about the current frame and screen size
    // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText
    drawContext.font = '50px serif';
    drawContext.fillText("Current Size: " + width + "," + height, 10, 400);
    drawContext.strokeText("Frame: " + frame, 10, 590);

    //Draw some sprites
    gameSprites.draw(1, 150, 100);
    gameSprites.draw(10, 100, 150);
    gameSprites.draw(0, mouseX - myCanvas.offsetLeft - 25, mouseY - myCanvas.offsetTop - 25);


    // Some vector art 
    // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes
    drawContext.fillStyle = "#ff0000"
    drawContext.beginPath();
    drawContext.moveTo(75, 50);
    drawContext.lineTo(100, 75);
    drawContext.lineTo(100, 25);
    drawContext.fill();

    frame++;
}

// Startup code
var myCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
width=myCanvas.width;
height=myCanvas.height;
drawContext = myCanvas.getContext("2d") || (() => { throw new Error('No 2D support'); })();
gameSprites = new Sprite(drawContext, "sprites.png", 50, 50);
setInterval(animation_loop, 30);
window.addEventListener("resize", resize_handler);
myCanvas.addEventListener("click", handleCanvasClick);
myCanvas.addEventListener("mousemove", handleCanvasMouseMove);