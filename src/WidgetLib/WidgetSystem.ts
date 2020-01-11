import { DrawHelper } from "../ui/DrawHelper";
import { SoundHelper } from "../ui/SoundHelper";
import { Widget } from "./Widget";

//-------------------------------------------------------------------------
// The WidgetSystem - a very simple windowing and control system
//-------------------------------------------------------------------------
export class WidgetSystem
{
    drawing: DrawHelper;
    sound: SoundHelper;
    private _root: Widget;

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(drawing: DrawHelper, sound: SoundHelper, rootWidget: Widget)
    {
        this.drawing = drawing; 
        this.sound = sound;
        this._root = rootWidget;
        this._root.Init(this);
        requestAnimationFrame(this.animation_loop);

        this.drawing.onWindowResized.subscribe("Widget System Resize",
            () => this._root.ParentResized());
        
        this._root.ParentResized();
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    animation_loop = (event: unknown) => {
        this._root?.Render();
    }
}