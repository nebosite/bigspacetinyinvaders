// https://pixijs.io/examples/#/demos-basic/container.js

// TODO: Find out why the heck the "import" syntax isn't working here
import * as PIXI from 'pixi.js'; 
//const PIXI = require('pixi.js');

var currentObjectId = 0;

export abstract class DrawnObject
{
    id: number;
    pixiObject: any;
    drawHelper: DrawHelper;
    abstract get x(): number;
    abstract set x(value: number);
    abstract get y(): number;
    abstract set y(value: number);
    abstract get rotation(): number;
    abstract set rotation(value: number);

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

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

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

export class DrawnSprite extends DrawnObject 
{
    private _pixiObject: PIXI.Sprite;
    get x(): number { return this._pixiObject.x; }
    set x(value: number) { this._pixiObject.x = value; }
    
    get y(): number { return this._pixiObject.y; }
    set y(value: number) { this._pixiObject.y = value; }

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

    private _textureFrame = 0;
    private _textures: Array<PIXI.Texture>;
    get textureFrame(): number { return this._textureFrame; }
    set textureFrame(value: number) { 
        this._textureFrame = value; 
        this._pixiObject.texture = this._textures[this._textureFrame];
     }

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Sprite, textures: Array<PIXI.Texture>, textureFrame: number)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;  
        this._textureFrame = textureFrame;
        this._textures = textures; 
    }
}


export class DrawHelper {

    pixiRenderer: PIXI.Renderer;
    pixiStage: PIXI.Container;
    indexedSprites = new Map<string, Array<PIXI.Texture>>();
    onWindowResized = (width: number, height: number) => {};

    width = 0;
    height = 0;

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
        requestAnimationFrame(this.handleAnimationFrame);
    }

    addIndexedSpriteTextures(rootName: string, suffix: string, padSize: number, count: number)
    {
        let textureArray = new Array<PIXI.Texture>();
        for(let i = 0; i < count; i++)
        {
            textureArray.push(PIXI.Texture.from(`${rootName}${String(i).padStart(padSize, '0')}${suffix}`));
        }
        this.indexedSprites.set(rootName, textureArray);
    }

    //-------------------------------------------------------------------------
    // For hooking into the animation loop
    //-------------------------------------------------------------------------
    handleAnimationFrame = () =>
    {
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

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
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


    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
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
    
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
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
    
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    addSpriteObject(name: string, index: number, x: number, y: number, alpha: number = 1, centering: number[] = [0.5, 0.5], rgb: number[] = [1,1,1])
    {
        let textures = this.indexedSprites.get(name);
        if(!textures) {
            throw new Error(`Unknown sprite: ${name}`); 
        }
        let sprite = new PIXI.Sprite(textures[index]);
        sprite.anchor.set(centering[0], centering[1]);
        sprite.x = x;
        sprite.y = y;
        sprite.alpha = alpha;
        this.pixiStage.addChild(sprite);
        return new DrawnSprite(this, sprite, textures, index);
    }
    
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    resizeToWindow(){
        this.pixiRenderer.resize(window.innerWidth, window.innerHeight);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.onWindowResized(this.width, this.height);
    }
}