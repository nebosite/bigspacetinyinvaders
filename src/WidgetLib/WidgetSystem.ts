import { DrawHelper } from "../ui/DrawHelper";
import { SoundHelper } from "../ui/SoundHelper";
import { Widget } from "./Widget";
import { KeyboardManager } from "../ui/KeyboardInput";
import { GamepadManager, GamepadInputCode } from "../ui/GamepadInput";

export enum WidgetButtonCode {
    None = 1000,
    Stick0 = 1001,
    Stick0Left = 1001,
    Stick0Right,
    Stick0Up,
    Stick0Down,
    Stick1Left,
    Stick1Right,
    Stick1Up,
    Stick1Down,
    Button00 = 1100,
    Button_DiamondDown = 1100,
    Button_DiamondRight,
    Button_DiamondLeft,
    Button_DiamondUp,
    Button_ShoulderLeft,
    Button_ShoulderRight,
    Button_TriggerLeft,
    Button_TriggerRight,
    Button_Back,
    Button_Forward,
    Button_Stick0,
    Button_Stick1,
    Button_DPadUp,
    Button_DPadDown,
    Button_DPadLeft,
    Button_DPadRight,
    Button_Home,
    Button_Snap,
    Button18,
    Button19,
    Button20,
    Button21,
    Button22,
    Button23,
    Button24,
    Button25,
    Button26,
    Button27,
    Button28,
    Button29,
};


export class ButtonEvent {
    buttonCode : number;
    buttonValue: number;
    get isPressed() {return this.buttonValue == 1}
    controllerId: string;
    handled = false;

    constructor(controllerId: string, buttonId: number, buttonValue: number)
    {
        this.controllerId = controllerId;
        this.buttonCode = buttonId;
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
        this.gamepadManager.onInputChange.subscribe("Widget System", this.handleGamePadInput);

        this._root = rootWidget;
        this._root.Init(this);

        this.drawing.onWindowResized.subscribe("Widget System Resize",
            () => this._root.ParentLayoutChanged());
        
        this._root.ParentLayoutChanged();
        requestAnimationFrame(this.animation_loop);
    }

    //-------------------------------------------------------------------------
    // handleInputChange
    //-------------------------------------------------------------------------
    handleGamePadInput = (input: {gamePadIndex: number, code: number, value: number}) => {
        if(Math.abs(input.value) < .05) input.value = 0;
        let controllerId = `GP${input.gamePadIndex}`
        if(input.code < GamepadInputCode.Button00)
        {
            let axisCode = (input.code - GamepadInputCode.Axis0) * 2 + WidgetButtonCode.Stick0;
            let low = 0;
            let high = 0;
            if(input.value < 0) low = -input.value;
            if(input.value > 0) high = input.value;
            this._root?.DoButtonEvent(new  ButtonEvent(controllerId, axisCode, low));
            this._root?.DoButtonEvent(new  ButtonEvent(controllerId, axisCode + 1, high));            
        }
        else
        {
            let buttonCode = input.code - GamepadInputCode.Button00 + WidgetButtonCode.Button00;
            this._root?.DoButtonEvent(new  ButtonEvent(controllerId, buttonCode, input.value));      
        }
    }


    //-------------------------------------------------------------------------
    // handleKeyDown
    //-------------------------------------------------------------------------
    handleKeyDown = (keyCode: number) => {
        this._root?.DoButtonEvent(new  ButtonEvent("KB", keyCode, 1));      
    }

    //-------------------------------------------------------------------------
    // handleKeyUp
    //-------------------------------------------------------------------------
    handleKeyUp = (keyCode: number) => {
        this._root?.DoButtonEvent(new  ButtonEvent("KB", keyCode, 0));      
    }

    //-------------------------------------------------------------------------
    // Animation Loop
    //-------------------------------------------------------------------------
    animation_loop = (event: unknown) => {
        this._root?.Render();
        requestAnimationFrame(this.animation_loop);
    }
}