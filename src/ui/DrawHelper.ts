// https://pixijs.io/examples/#/demos-basic/container.js

// TODO: Find out why the heck the "import" syntax isn't working here
import * as PIXI from 'pixi.js'; 
//const PIXI = require('pixi.js');

var currentObjectId = 0;

export class DrawnObject
{
    id: number;
    pixiObject: any;
    drawHelper: DrawHelper;

    constructor(drawHelper: DrawHelper, pixiObject: any)
    {
        this.id = currentObjectId++;
        this.drawHelper = drawHelper;
        this.pixiObject = pixiObject;
    }

    delete() {
        this.drawHelper.removeTrackedObject(this.pixiObject);
    }
}

export class DrawnText extends DrawnObject 
{
    private _pixiObject: PIXI.Text;
    get x(): number { return this._pixiObject.x; }
    set x(value: number) { this._pixiObject.x = value; }
    
    get y(): number { return this._pixiObject.y; }
    set y(value: number) { this._pixiObject.y = value; }

    get text(): string { return this._pixiObject.text; }
    set text(value: string) { this._pixiObject.text = value; }

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Text)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;
    }
}

export class DrawnVectorObject extends DrawnObject 
{
    private _pixiObject: PIXI.Graphics;
    get x(): number { return this._pixiObject.x; }
    set x(value: number) { this._pixiObject.x = value; }
    
    get y(): number { return this._pixiObject.y; }
    set y(value: number) { this._pixiObject.y = value; }

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Graphics)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;   
    }
}


export class DrawHelper {

    pixiRenderer: PIXI.Renderer;
    pixiStage: PIXI.Container;
    shipTextures: PIXI.Texture[] = new Array<PIXI.Texture>();

    width = 0;
    height = 0;

    testSprite: PIXI.Sprite;

    constructor() {
        document.documentElement.style.overflow = 'hidden';  // firefox, chrome
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.pixiRenderer = new PIXI.Renderer();
        this.pixiRenderer.view.style.position = "absolute";
        this.pixiRenderer.view.style.display = "block";
        this.pixiRenderer.resize(this.width, this.height);  
        this.pixiStage = new PIXI.Container();      
        document.body.appendChild(this.pixiRenderer.view);
        window.addEventListener("resize", this.resize_handler);

        for(let i = 0; i < 10; i++)
        {
            this.shipTextures.push(PIXI.Texture.from(`sprites/ship${String(i).padStart(2, '0')}.png`));
        }

        this.testSprite = new PIXI.Sprite(this.shipTextures[0]);
        this.testSprite.anchor.set(.5);
        this.testSprite.x = 100;
        this.testSprite.y = 50;
        this.pixiStage.addChild(this.testSprite);

        requestAnimationFrame(this.handleAnimationFrame);
    }

    //-------------------------------------------------------------------------
    // For hooking into the animation loop
    //-------------------------------------------------------------------------
    handleAnimationFrame = () =>
    {
        this.testSprite.rotation += 0.005;
        this.pixiRenderer.render(this.pixiStage);
        requestAnimationFrame(this.handleAnimationFrame);
    }

    //-------------------------------------------------------------------------
    // Resize event - don't do anything here other than signal a resize
    //-------------------------------------------------------------------------
    resize_handler = (event: unknown) => {
        this.resizeToWindow();
    }

    //-------------------------------------------------------------------------
    // Remove an item from the stage
    //-------------------------------------------------------------------------
    removeTrackedObject(removeMe: any)
    {
        this.pixiStage.removeChild(removeMe);
    }

    //-------------------------------------------------------------------------
    // Add a text objet to the stage
    //-------------------------------------------------------------------------
    addTextObject (text: string,
        x: number, y:number, 
        size: number = 16, 
        fillStyle: string = "#FFFFFF", 
        strokeStyle: string = "",
        strokeWidth: number = 1,
        wrapWidth: number = 99999,
        centering: number[] = [0,0]) 
    {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: size,
            //fontStyle: 'italic',
            //fontWeight: 'bold',
            fill: [fillStyle], // gradient
            stroke: strokeStyle,
            strokeThickness: strokeWidth,
            //dropShadow: true,
            //dropShadowColor: '#000000',
            //dropShadowBlur: 4,
            //dropShadowAngle: Math.PI / 6,
            //dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: wrapWidth,
        });
        let pixiText = new PIXI.Text(text, style);
        pixiText.anchor.set(centering[0], centering[1]);
        pixiText.x = x;
        pixiText.y = y;
        this.pixiStage.addChild(pixiText);
        return new DrawnText(this, pixiText );
    } 

    makeVectorObject(
        x: number, y: number, width: number, height: number, 
        fillColor: number, 
        fillAlpha: number,
        centering: number[],    
        strokeColor: number,
        strokeAlpha: number, 
        strokeWidth: number ,
        drawVectors: (graphics: PIXI.Graphics, x: number, y: number) => void)
    {
        let graphics = new PIXI.Graphics();
        if(strokeWidth > 0 && strokeAlpha > 0)
        {
            graphics.lineStyle(strokeWidth, strokeColor, strokeAlpha, 0);
        }
        graphics.beginFill(fillColor, fillAlpha);
        let cx = -width * centering[0];
        let cy = -height * centering[1];
        drawVectors(graphics, cx, cy);
        graphics.x = x;
        graphics.y = y;
        graphics.endFill();
        this.pixiStage.addChild(graphics);
        return new DrawnVectorObject(this, graphics);
    }


    addRectangleObject(x: number, y: number, width: number, height: number, 
        fillColor: number = 0xffffff, 
        fillAlpha: number = 1,
        centering: number[] = [0,0],    
        strokeColor: number = 0,
        strokeAlpha: number = 0, 
        strokeWidth: number = 0
        )
    {
        return this.makeVectorObject(
            x, y, width, height, 
            fillColor, fillAlpha, centering, strokeColor, strokeAlpha, strokeWidth,
            (graphics, cx, cy) =>
            {
                graphics.drawRect(cx,cy,width, height);
            });
    }
    
    addTriangleObject(x: number, y: number, width: number, height: number, 
        fillColor: number = 0xffffff, 
        fillAlpha: number = 1,
        centering: number[] = [0.5,0.5],    
        strokeColor: number = 0,
        strokeAlpha: number = 0, 
        strokeWidth: number = 0
        )
    {
        return this.makeVectorObject(
            x, y, width, height, 
            fillColor, fillAlpha, centering, strokeColor, strokeAlpha, strokeWidth,
            (graphics, cx, cy) =>
            {
                graphics.moveTo(cx, cy + height);
                graphics.lineTo(cx + width/2, cy);
                graphics.lineTo(cx + width, cy + height);
                graphics.lineTo(cx, cy + height);
                graphics.closePath();
            });
    }
    
    drawSprite(index: number, x: number, y: number, alpha: number = 1)
    {
        // this.drawContext.globalAlpha = alpha;
        // this.gameSprites.draw(index, Math.floor(x), Math.floor(y));
    }
    
    resizeToWindow(){
        this.pixiRenderer.resize(window.innerWidth, window.innerHeight);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
}

// export class DrawHelper_OLD {
//     // https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
//     drawContext: CanvasRenderingContext2D;
//     gameSprites: Sprite;

//     width = 0;
//     height = 0;

//     constructor(drawContext: CanvasRenderingContext2D) {
//         this.drawContext = drawContext;
//         this.width = drawContext.canvas.width;
//         this.height = drawContext.canvas.height;
//         this.gameSprites = new Sprite(this.drawContext, "sprites.png", 16,16);
//     }

//     clear(fillStyle: string = "#0000000") {
//         this.drawContext.fillStyle = fillStyle;
//         this.drawContext.globalAlpha = 1.0;
//         this.drawContext.fillRect(0, 0, this.width, this.height);
//     }

//     drawRect(x: number, y: number, width: number, height: number, 
//         fillStyle: string = "#FFFFFF", 
//         strokeStyle: string = "", 
//         lineWidth: number = 1, alpha: number = 1.0)
//     {
//         this.drawContext.fillStyle = fillStyle
//         this.drawContext.strokeStyle = strokeStyle;
//         this.drawContext.globalAlpha = alpha;
//         this.drawContext.lineWidth = lineWidth;

//         if(fillStyle && fillStyle != "")
//         {
//             this.drawContext.fillRect(x, y, width, height);
//         }
//         if(strokeStyle && strokeStyle != "")
//         {
//             this.drawContext.strokeRect(x, y, width, height);
//         }    
//     }

//     drawTriangle(x: number, y: number, width: number, height: number, 
//         fillStyle: string = "#FFFFFF", 
//         strokeStyle: string = "", 
//         lineWidth: number = 1, alpha: number = 1.0)
//     {
//         // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes    

//         this.drawContext.fillStyle = fillStyle
//         this.drawContext.strokeStyle = strokeStyle;
//         this.drawContext.globalAlpha = alpha;
//         this.drawContext.lineWidth = lineWidth;
//         this.drawContext.lineCap = "round";

//         this.drawContext.beginPath();
//         this.drawContext.moveTo(x, y);
//         this.drawContext.lineTo(x + width/2, y - height);
//         this.drawContext.lineTo(x + width, y);
//         this.drawContext.lineTo(x,y);

//         this.drawContext.fill();
//         if(fillStyle && fillStyle != "")
//         {
//             this.drawContext.beginPath();
//             this.drawContext.moveTo(x, y);
//             this.drawContext.lineTo(x + width/2, y - height);
//             this.drawContext.lineTo(x + width, y);
//             this.drawContext.lineTo(x,y);
//             this.drawContext.fill();
//         }
//         if(strokeStyle && strokeStyle != "")
//         {
//             this.drawContext.beginPath();
//             this.drawContext.moveTo(x, y);
//             this.drawContext.lineTo(x + width/2, y - height);
//             this.drawContext.moveTo(x + width/2, y - height);
//             this.drawContext.lineTo(x + width, y);
//             this.drawContext.moveTo(x + width, y);
//             this.drawContext.lineTo(x,y);    
//             this.drawContext.stroke();
//         }    

//     }

//     print(text: string, x: number, y:number, size: number = 16, 
//         fillStyle: string = "#FFFFFF", 
//         strokeStyle: string = "",
//         strokeWidth: number = 1,
//         alpha: number = 1.0)
//     {
//         this.drawContext.fillStyle = fillStyle
//         this.drawContext.strokeStyle = strokeStyle;
//         this.drawContext.font = `${size}px sans-serif`;
//         this.drawContext.globalAlpha = alpha;
//         this.drawContext.lineWidth = strokeWidth;

//         if(fillStyle && fillStyle != "")
//         {
//             this.drawContext.fillText(text, x,y);
//         }
//         if(strokeStyle && strokeStyle != "")
//         {
//             this.drawContext.strokeText(text, x, y);
//         }    
//     }

//     drawSprite(index: number, x: number, y: number, alpha: number = 1)
//     {
//         this.drawContext.globalAlpha = alpha;
//         this.gameSprites.draw(index, Math.floor(x), Math.floor(y));
//     }
    
//     resizeToWindow(){
//         this.width = window.innerWidth - 5;
//         this.height = window.innerHeight - 5;
//         this.drawContext.canvas.width = this.width;
//         this.drawContext.canvas.height = this.height;
//     }
// }