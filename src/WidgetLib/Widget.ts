import { WidgetSystem, ButtonEvent, WidgetMouseEvent } from "./WidgetSystem";
import { DrawnVectorObject } from "../ui/DrawHelper";
import { EventThing } from "../tools/EventThing";
import { TilingSprite } from "pixi.js";

var widgetId = 0;
export class Widget
{
    id = widgetId++;
    name: string;
    widgetSystem: WidgetSystem | null = null;
    backgroundRectangle: DrawnVectorObject | null = null;
    onParentLayoutChanged = new EventThing<void>("Widget.onParentLayoutChanged");
    onRender = new EventThing<void>("Widget.onRender");
    onLoaded = new EventThing<void>("Widget.onLoaded");
    onDestroyed = new EventThing<void>("Widget.onDestroyed");
    onLayoutChange = new EventThing<void>("Widget.onLonLayoutChangeoaded");
    onColorChange = new EventThing<void>("Widget.onColorChange");
    onButtonEvent = new EventThing<ButtonEvent>("Widget.onButtonEvent");
    onMouseUp = new EventThing<WidgetMouseEvent>("Widget.onMouseUp");
    onMouseDown = new EventThing<WidgetMouseEvent>("Widget.onMouseDown");
    children = new Array<Widget>();
    parent: Widget | null = null;
    destroyed = false;

    relativeLocation: {x: number | null, y: number | null} | null = null;
    relativeSize: {width: number | null, height: number | null} | null = null;

    _left = 0;
    _top = 0;
    _width = 100;
    _height = 100;
    _backgroundColor = 0xFFFFFF;
    _foregroundColor = 0x808080;
    _alpha = 0;

    _layoutChanged = true;
    _colorChanged = true;
    _maintainAspectRatio = true;

    get left() { return this._left;}
    set left(value: number) { if(this._left != value) { this._left = value; this._layoutChanged = true; }}
    
    get top()  { return this._top;}
    set top(value: number) { if(this._top != value) { this._top = value; this._layoutChanged = true;}}
    
    get width()  { return this._width;}
    set width(value: number) { if(this._width != value) { this._width = value; this._layoutChanged = true;}}
    
    get height()  { return this._height;}
    set height(value: number) { if(this._height != value) { this._height = value; this._layoutChanged = true;}}
    
    get backgroundColor()  { return this._backgroundColor;}
    set backgroundColor(value: number) { if(this._backgroundColor != value) { this._backgroundColor = value; this._colorChanged = true;}}
    
    get foregroundColor()  { return this._foregroundColor;}
    set foregroundColor(value: number) { if(this._foregroundColor != value) { this._foregroundColor = value; this._colorChanged = true;}}
    
    get alpha()  { return this._alpha;}
    set alpha(value: number) {if(this._alpha != value) { this._alpha = value;  this._colorChanged = true;}}
    
    get maintainAspectRatio()  { return this._maintainAspectRatio;}
    set maintainAspectRatio(value: boolean) {if(this.maintainAspectRatio != value) { this.maintainAspectRatio = value;  this._layoutChanged = true;}}
    
    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(name: string)
    {
        this.name = name;
    }

    //-------------------------------------------------------------------------
    // Init
    //-------------------------------------------------------------------------
    Init(widgetSystem: WidgetSystem)
    {
        this.widgetSystem = widgetSystem; 

        this.backgroundRectangle = this.widgetSystem.drawing.addRectangleObject(
            this.left, this.top, this.width, this.height,
            this.backgroundColor, this. alpha
        );

        this.onLoaded.invoke();
    }

    //-------------------------------------------------------------------------
    // HandleChangedLayout
    //-------------------------------------------------------------------------
    HandleChangedLayout()
    {
        //console.log(`HandleChangedLayout: ${this.name}`);

        this._layoutChanged = false;
        if(this.backgroundRectangle) 
        {
            this.backgroundRectangle.x = this.left;
            this.backgroundRectangle.y = this.top;
            this.backgroundRectangle.width = this.width;
            this.backgroundRectangle.height = this.height;
        }
        this.onLayoutChange.invoke();
        this.children.forEach(child => child.ParentLayoutChanged());

    }

    //-------------------------------------------------------------------------
    // HandleChangedColor
    //-------------------------------------------------------------------------
    HandleChangedColor()
    {
        //console.log(`HandleChangedColor: ${this.name}`);
        this._colorChanged = false;
        if(this.backgroundRectangle) 
        {
            this.backgroundRectangle.fillColor = this.backgroundColor;
            this.backgroundRectangle.alpha = this.alpha;
        }
        this.onColorChange.invoke();
    }

    //-------------------------------------------------------------------------
    // ParentLayoutChanged
    //-------------------------------------------------------------------------
    ParentLayoutChanged(){
        //console.log(`ParentLayoutChanged: ${this.name}`);
        // manage relative sizes and locations
        if(!this.widgetSystem) return;
            
        let workingX = 0;
        let workingY = 0;
        let workingWidth = this.widgetSystem.drawing.width;
        let workingHeight = this.widgetSystem.drawing.height;
        if(this.parent) {
            workingX = this.parent.left;
            workingY = this.parent.top;
            workingWidth = this.parent.width;
            workingHeight = this.parent.height;
        }

        if(this.relativeSize) {
            var widthHeightRatio = this.width/this.height;
            if(this.relativeSize.width)
            {
                this.width = workingWidth * this.relativeSize.width;
                if(this.maintainAspectRatio)
                {
                    this.height = this.width / widthHeightRatio;
                }
            }
            if(this.relativeSize.height)
            {
                this.height = workingHeight * this.relativeSize.height;
                if(this.maintainAspectRatio)
                {
                    this.width = this.height * widthHeightRatio;
                }
           }
        }
        else {
            this.width = workingWidth;
            this.height = workingHeight;
        }

        if(this.relativeLocation)
        {
            if(this.relativeLocation.x)
            {
                let centerX = workingX + workingWidth * this.relativeLocation.x;
                this.left = centerX - this.width/2;
            }
            else this.left = workingX;

            if(this.relativeLocation.y)
            {
                let centerY = workingY + workingHeight * this.relativeLocation.y;
                this.top = centerY - this.height/2;
            }
            else this.top = workingY;
        }

        this.onParentLayoutChanged.invoke();
        this.children.forEach(child => child.ParentLayoutChanged());
    } 

    //-------------------------------------------------------------------------
    // Render
    //-------------------------------------------------------------------------
    Render(){
        if(this.destroyed) return;
        if(this._layoutChanged) 
        {
            this.HandleChangedLayout();
        }
        if(this._colorChanged) 
        {
            this.HandleChangedColor();
        }
        this.onRender.invoke();
        this.children.forEach(child => child.Render());
    } 

    //-------------------------------------------------------------------------
    // AddChild
    //-------------------------------------------------------------------------
    AddChild(child: Widget)
    {
        if(this.destroyed) throw new Error("Tried to add a child to a destroyed widget");
        if(!this.widgetSystem) throw new Error("Children cannot be added until after the widget is loaded (initialized)");
        if(this.children.lastIndexOf(child) >= 0) throw new Error(`Child ${child.name} is already added!`);
        this.children.push(child);
        child.parent = this;
        child.Init(this.widgetSystem);
        child.ParentLayoutChanged();
    }

    //-------------------------------------------------------------------------
    // RemoveChild
    //-------------------------------------------------------------------------
    RemoveChild(child: Widget)
    {
        let index = this.children.indexOf(child);
        if(index >= 0)
        {
            let destroyMe = this.children[index];
            this.children.splice(index, 1);
            destroyMe.Destroy();
        }
    }

    //-------------------------------------------------------------------------
    // Destroy
    //-------------------------------------------------------------------------
    Destroy()
    {
        if(!this.destroyed){
            this.destroyed = true;
            this.backgroundRectangle?.delete();
            this.backgroundRectangle = null;
            this.onDestroyed.invoke();
            this.children.forEach(child => child.Destroy())
        }
    }
   
    //-------------------------------------------------------------------------
    // containsPoint
    //-------------------------------------------------------------------------
    containsPoint(x: number, y: number): Boolean {
        return !(x < this.left || x > (this.left + this.width) 
            || y < this.top || y > (this.top + this.height));
    }

    //-------------------------------------------------------------------------
    // DoMouseUp
    //-------------------------------------------------------------------------
    DoMouseUp(event: WidgetMouseEvent) {  
        let reversedChildren = Array.from(this.children);
        reversedChildren.reverse();
        for(let child of reversedChildren)
        {
            if(child.containsPoint(event.x, event.y)) 
            {
                child.DoMouseUp(event);
                if(event.handled) return;
            }
        }
        
        this.onMouseUp?.invoke(event);
    }

    //-------------------------------------------------------------------------
    // DoMouseDown
    //-------------------------------------------------------------------------
    DoMouseDown(event: WidgetMouseEvent) {
        let reversedChildren = Array.from(this.children);
        reversedChildren.reverse();
        for(let child of reversedChildren)
        {
            if(child.containsPoint(event.x, event.y)) 
            {
                child.DoMouseDown(event);
                if(event.handled) return;
            }
        }
        
        this.onMouseDown?.invoke(event);
    }

    //-------------------------------------------------------------------------
    // DoButtonEvent
    //-------------------------------------------------------------------------
    DoButtonEvent(event: ButtonEvent) {
        this.onButtonEvent.invoke(event);   
        if(event.handled) return;
        this.children.forEach(child => {
            if(!event.handled) child.DoButtonEvent(event);
        })
    }
}