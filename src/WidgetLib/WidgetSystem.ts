import { DrawHelper } from "../ui/DrawHelper";
import { SoundHelper } from "../ui/SoundHelper";
import { Widget } from "./Widget";
import { KeyboardManager } from "../ui/KeyboardInput";
import { GamepadManager } from "../ui/GamepadInput";


export class ButtonEvent {
    buttonId : number;
    buttonValue: number;
    get isPressed() {return this.buttonValue > 0}
    controllerId: string;
    handled = false;

    constructor(controllerId: string, buttonId: number, buttonValue: number)
    {
        this.controllerId = controllerId;
        this.buttonId = buttonId;
        this.buttonValue = buttonValue;
    }
}

//-------------------------------------------------------------------------
// The WidgetSystem - a very simple windowing and control system
//-------------------------------------------------------------------------
export class WidgetSystem
{
    drawing: DrawHelper;
    sound: SoundHelper;    
    keyboardManager: KeyboardManager;
    gamepadManager: GamepadManager;

    private _root: Widget;

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(drawing: DrawHelper, sound: SoundHelper, rootWidget: Widget)
    {
        this.drawing = drawing; 
        this.sound = sound;
        this.keyboardManager = new KeyboardManager();
        this.keyboardManager.onKeyUp.subscribe("Widget System", this.handleKeyUp);
        this.keyboardManager.onKeyDown.subscribe("Widget System", this.handleKeyDown)
        this.gamepadManager = new GamepadManager();
        //this.gamepadManager.onUnhandledInputCode = this.handleUnhandledGamepadCode;

        this._root = rootWidget;
        this._root.Init(this);

        // TODO: Construct input helpers here
        // TODO: monitor input and send to the widget tree

        this.drawing.onWindowResized.subscribe("Widget System Resize",
            () => this._root.ParentLayoutChanged());
        
        this._root.ParentLayoutChanged();
        requestAnimationFrame(this.animation_loop);
    }

    //-------------------------------------------------------------------------
    // handleKeyDown
    //-------------------------------------------------------------------------
    handleKeyDown = (keyCode: number) => {
        this._root?.handleButtonEvent(new  ButtonEvent("KB", keyCode, 1));      
    }

    //-------------------------------------------------------------------------
    // handleKeyUp
    //-------------------------------------------------------------------------
    handleKeyUp = (keyCode: number) => {
        this._root?.handleButtonEvent(new  ButtonEvent("KB", keyCode, 0));      
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    animation_loop = (event: unknown) => {
        this._root?.Render();
        requestAnimationFrame(this.animation_loop);
    }
}