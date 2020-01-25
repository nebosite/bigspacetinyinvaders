// https://pixijs.io/examples/#/demos-basic/container.js

// TODO: Find out why the heck the "import" syntax isn't working here
import * as PIXI from 'pixi.js'; 
import { EventThing } from '../tools/EventThing';
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
    abstract get width(): number;
    abstract set width(value: number);
    abstract get height(): number;
    abstract set height(value: number);

    abstract get nativeWidth(): number;
    abstract get nativeHeight(): number;

    abstract get scale(): number[];
    abstract set scale(value: number[]);
    abstract get rotation(): number;
    abstract set rotation(value: number);
    abstract get color(): number;
    abstract set color(value: number);
    abstract get strokeColor(): number;
    abstract set strokeColor(value: number);

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

    get width(): number { return this._pixiObject.width; }
    set width(value: number) { this._pixiObject.width = value; }

    get height(): number { return this._pixiObject.height; }
    set height(value: number) { this._pixiObject.height = value; }

    _nativeSize = [0,0];
    get nativeWidth() {return this._nativeSize[0];}
    get nativeHeight() {return this._nativeSize[1];}

    get scale(): number[] { return [this._pixiObject.scale.x, this._pixiObject.scale.y]; }
    set scale(value: number[]) { this._pixiObject.scale = new PIXI.Point(value[0], value[1]) ; }

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

    get wrapWidth(): number { return (this._pixiObject.style as PIXI.TextStyle).wordWrapWidth as number; }
    set wrapWidth(value: number) {
        const style = this.pixiObject.style as PIXI.TextStyle;
        style.wordWrapWidth = value;
        this._pixiObject.style = style; }

    get text(): string { return this._pixiObject.text; }
    set text(value: string) { this._pixiObject.text = value; }

    get color(): number { return (this._pixiObject.style as PIXI.TextStyle).fill as number; }
    set color(value: number) {
        const style = this.pixiObject.style as PIXI.TextStyle;
        style.fill = value;
        this._pixiObject.style = style; }

    get strokeColor(): number { return (this._pixiObject.style as PIXI.TextStyle).stroke as number; }
    set strokeColor(value: number) {
        const style = this._pixiObject.style as PIXI.TextStyle;
        style.stroke = value;
        this._pixiObject.style = style; }

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Text)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;
        this._nativeSize = [pixiObject.width, pixiObject.height];
    }
}

export class DrawnVectorObject extends DrawnObject 
{
    private _pixiObject: PIXI.Graphics;
    get x(): number { return this._pixiObject.x; }
    set x(value: number) { this._pixiObject.x = value; }
    
    get y(): number { return this._pixiObject.y; }
    set y(value: number) { this._pixiObject.y = value; }

    get scale(): number[] { return [this._pixiObject.scale.x, this._pixiObject.scale.y]; }
    set scale(value: number[]) { this._pixiObject.scale = new PIXI.Point(value[0], value[1]) ; }

    get width(): number { return this._pixiObject.width; }
    set width(value: number) { this._pixiObject.width = value; }

    get height(): number { return this._pixiObject.height; }
    set height(value: number) { this._pixiObject.height = value; }

    _nativeSize = [0,0];
    get nativeWidth() {return this._nativeSize[0];}
    get nativeHeight() {return this._nativeSize[1];}

    get fillColor(): number { return this._pixiObject.fill.color; }
    set fillColor(value: number) { this._pixiObject.fill.color = value; }

    get alpha(): number { return this._pixiObject.fill.alpha; }
    set alpha(value: number) { this._pixiObject.fill.alpha = value; }

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

    get color(): number { return this._pixiObject.fill.color; }
    set color(value: number) {this._pixiObject.fill.color = value; }

    get strokeColor(): number { return this._pixiObject.line.color; }
    set strokeColor(value: number) { this._pixiObject.line.color = value;}

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Graphics)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;   
        this._nativeSize = [pixiObject.width, pixiObject.height];
    }
}

export class DrawnSprite extends DrawnObject 
{
    private _pixiObject: PIXI.Sprite;
    get x(): number { return this._pixiObject.x; }
    set x(value: number) { this._pixiObject.x = value; }
    
    get y(): number { return this._pixiObject.y; }
    set y(value: number) { this._pixiObject.y = value; }

    get width(): number { return this._pixiObject.width; }
    set width(value: number) { this._pixiObject.width = value; }

    get height(): number { return this._pixiObject.height; }
    set height(value: number) { this._pixiObject.height = value; }

    _nativeSize = [0,0];
    get nativeWidth() {return this._nativeSize[0];}
    get nativeHeight() {return this._nativeSize[1];}

    get scale(): number[] { return [this._pixiObject.scale.x, this._pixiObject.scale.y]; }
    set scale(value: number[]) { this._pixiObject.scale = new PIXI.Point(value[0], value[1]) ; }

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

    private _textureFrame = 0;
    private _textures: Map<number,PIXI.Texture>;
    get textureFrame(): number { return this._textureFrame; }
    set textureFrame(value: number) { 
        this._textureFrame = value; 
        this._pixiObject.texture = this._textures.get(this._textureFrame) as PIXI.Texture;
    }

    get color(): number { return 0; }
    set color(value: number) { }

    get strokeColor(): number { return 0 }
    set strokeColor(value: number) { }

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Sprite, textures: Map<number,PIXI.Texture>, textureFrame: number)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;  
        this._textureFrame = textureFrame;
        this._textures = textures; 
        this._nativeSize = [pixiObject.width, pixiObject.height];
    }
}

export class DrawnImage extends DrawnObject 
{
    private _pixiObject: PIXI.Sprite;
    get x(): number { return this._pixiObject.x; }
    set x(value: number) { this._pixiObject.x = value; }
    
    get y(): number { return this._pixiObject.y; }
    set y(value: number) { this._pixiObject.y = value; }

    get width(): number { return this._pixiObject.width; }
    set width(value: number) { this._pixiObject.width = value; }

    get height(): number { return this._pixiObject.height; }
    set height(value: number) { this._pixiObject.height = value; }

    _nativeSize = [0,0];
    get nativeWidth() {return this._nativeSize[0];}
    get nativeHeight() {return this._nativeSize[1];}

    get scale(): number[] { return [this._pixiObject.scale.x, this._pixiObject.scale.y]; }
    set scale(value: number[]) { this._pixiObject.scale = new PIXI.Point(value[0], value[1]) ; }

    get rotation(): number { return this._pixiObject.rotation; }
    set rotation(value: number) { this._pixiObject.rotation = value; }

    get color(): number { return 0; }
    set color(value: number) { }

    get strokeColor(): number { return 0 }
    set strokeColor(value: number) { }

    constructor(drawHelper: DrawHelper, pixiObject : PIXI.Sprite)
    {
        super(drawHelper, pixiObject);
        this._pixiObject = pixiObject;  
        this._nativeSize = [pixiObject.width, pixiObject.height];
    }
}



export class DrawHelper {

    pixiRenderer: PIXI.Renderer;
    pixiStage: PIXI.Container;
    pixiLoader: PIXI.Loader;
    indexedSprites = new Map<string, Map<number, PIXI.Texture>>();
    indexedImages = new Map<string, PIXI.Texture>();
    onWindowResized = new EventThing<void>("DrawHelper.onWindowResized");
    onLoaded = new EventThing<void>("DrawHelper.onLoaded");

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
        this.pixiLoader = new PIXI.Loader();
        document.body.appendChild(this.pixiRenderer.view);
        window.addEventListener("resize", this.resize_handler);
    }

    //-------------------------------------------------------------------------
    // load
    //-------------------------------------------------------------------------
    load(callback: ()=>void)
    {
        this.pixiLoader.load((ldr,res) => {
            this.onLoaded.invoke();
            requestAnimationFrame(this.handleAnimationFrame);
            callback();
        }); 
    }

    //-------------------------------------------------------------------------
    // addImageTexture
    //-------------------------------------------------------------------------
    addImageTexture(name: string)
    {
        this.pixiLoader.add(name);
        this.onLoaded.subscribe(name,() => {
            let resources = this.pixiLoader.resources as PIXI.IResourceDictionary;
            let resource = resources[name];
            let texture = resource.texture;
            this.indexedImages.set(name, texture);
        });
    }

    //-------------------------------------------------------------------------
    // addIndexedSpriteTextures
    //-------------------------------------------------------------------------
    addIndexedSpriteTextures(rootName: string, suffix: string, padSize: number, count: number)
    {
        let makeShortName = (index: number) => `${rootName}${String(index).padStart(padSize, '0')}`
        for(let i = 0; i < count; i++)
        {
            let shortName = makeShortName(i);
            let name = `${shortName}${suffix}`;
            this.pixiLoader.add(shortName, name);
        }
        this.onLoaded.subscribe(rootName, ()=>{
            let textureMap = new Map<number, PIXI.Texture>();
            for(let i = 0; i < count; i++)
            {
                let shortName = makeShortName(i);
                textureMap.set(i, this.pixiLoader.resources[shortName].texture)
            }
            this.indexedSprites.set(rootName, textureMap);
        });
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
        fillColor: number = 0xFFFFFF, 
        strokeColor: number = 0x000000,
        strokeWidth: number = 1,
        wrapWidth: number = 99999,
        centering: number[] = [0,0]) 
    {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: size,
            //fontStyle: 'italic',
            //fontWeight: 'bold',
            fill: [fillColor], // gradient
            stroke: strokeColor,
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
        let sprite = new PIXI.Sprite(textures.get(index));
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
    addImageObject(name: string, x: number, y: number, alpha: number = 1, centering: number[] = [0.5, 0.5], rgb: number[] = [1,1,1])
    {
        let texture = this.indexedImages.get(name);
        if(!texture) throw new Error(`Cannot find image '${name}'`);
        
        let sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(centering[0], centering[1]);
        sprite.x = x;
        sprite.y = y;
        sprite.alpha = alpha;
        this.pixiStage.addChild(sprite);
        return new DrawnImage(this, sprite);
    }
    
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    resizeToWindow(){
        this.pixiRenderer.resize(window.innerWidth, window.innerHeight);
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.onWindowResized.invoke();
    }
}