import { WidgetSystem } from "./WidgetSystem";
import { DrawnVectorObject } from "../ui/DrawHelper";
import { EventThing } from "../tools/EventThing";

export class Widget
{
    widgetSystem: WidgetSystem | null = null;
    backgroundRectangle: DrawnVectorObject | null = null;
    onParentSizeChanged = new EventThing();
    onRender = new EventThing();
    children = new Array<Widget>();

    _left = 0;
    _top = 0;
    _width = 100;
    _height = 100;
    _backgroundColor = 0xFFFFFF;
    _alpha = 0;

    get left() { return this._left;}
    set left(value: number) { this._left = value; if(this.backgroundRectangle) this.backgroundRectangle.x = value;}
    
    get top()  { return this._top;}
    set top(value: number) { this._top = value; if(this.backgroundRectangle) this.backgroundRectangle.y = value;}
    
    get width()  { return this._width;}
    set width(value: number) { this._width = value; if(this.backgroundRectangle) this.backgroundRectangle.width = value;}
    
    get height()  { return this._height;}
    set height(value: number) { this._height = value; if(this.backgroundRectangle) this.backgroundRectangle.height = value;}
    
    get backgroundColor()  { return this._backgroundColor;}
    set backgroundColor(value: number) { this._backgroundColor = value; if(this.backgroundRectangle) this.backgroundRectangle.fillColor = value;}
    
    get alpha()  { return this._alpha;}
    set alpha(value: number) {this._alpha = value;  if(this.backgroundRectangle) this.backgroundRectangle.alpha = value;}
    


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
    }

    //-------------------------------------------------------------------------
    // ParentResized
    //-------------------------------------------------------------------------
    ParentResized(){
        this.onParentSizeChanged.invoke();
        this.children.forEach(child => child.ParentResized);
    } 

    //-------------------------------------------------------------------------
    // Render
    //-------------------------------------------------------------------------
    Render(){
        this.onRender.invoke();
        this.children.forEach(child => child.Render);
    } 
}