import {  KeyboardManager } from "../ui/KeyboardInput";
import { DrawHelper, DrawnObject, DrawnText } from "../ui/DrawHelper";
import { GamepadManager, GamepadState } from "../ui/GamepadInput";
import { AppDiagnostics } from "../models/AppModel";
import { WidgetSystem } from "../WidgetLib/WidgetSystem";
import { GameObjectType } from "../models/GameObject";

export class DiagnosticsControl 
{
    drawing: DrawHelper;
    gamePad: GamepadManager;
    keyboard: KeyboardManager;
    appDiagnostics: AppDiagnostics;
    fontSize = 16;
    lastFrameTime = Date.now();
    cancelled = false;
    averageThinkTime = 0;

    drawingObjects = new Array<DrawnObject>();
    frameRateText: DrawnText;
    timingText: DrawnText;
    keyboardText: DrawnText;
    gamepad1Text: DrawnText;
    gamepad2Text: DrawnText;
    objectCountText: DrawnText;
    
    gameObjectAbbreviation = [
        "???",
        "Plyr",
        "Bllt",
        "Hive",
        "Alen",
        "Shld",
        "Debr"];

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(widgetSystem: WidgetSystem, appDiagnostics: AppDiagnostics)
    {
        let y = 5;
        this.gamePad = widgetSystem.gamepadManager;
        this.keyboard = widgetSystem.keyboardManager;
        this.drawing = widgetSystem.drawing;
        this.appDiagnostics = appDiagnostics;
        
        this.fontSize = this.drawing.height / 90;
        this.drawingObjects.push(this.drawing.addRectangleObject(0,0, 300,550,0x444444, .7));

        this.frameRateText = this.drawing.addTextObject("F:", 5,y,this.fontSize);
        this.drawingObjects.push(this.frameRateText);

        y += 20;
        this.objectCountText = this.drawing.addTextObject("T:", 5,y,this.fontSize);
        this.drawingObjects.push(this.objectCountText);

        y += 120;
        this.timingText = this.drawing.addTextObject("T:", 5,y,this.fontSize);
        this.drawingObjects.push(this.timingText);

        y += 15;
        this.keyboardText = this.drawing.addTextObject("Keyboard:", 5,y, this.fontSize, 0xffff00);

        y += 100;
        this.gamepad1Text = this.drawing.addTextObject("GP1:", 5,y, this.fontSize, 0xffff00);
        this.gamepad2Text = this.drawing.addTextObject("GP2:", 120,y, this.fontSize, 0xffff00);
        this.drawingObjects.push(this.keyboardText);
        this.drawingObjects.push(this.gamepad1Text);
        this.drawingObjects.push(this.gamepad2Text);

    }

    //-------------------------------------------------------------------------
    // update my state
    //-------------------------------------------------------------------------
    render = () =>
    {
        this.frameRateText.text = `FRAME: ${this.appDiagnostics.frame}  (${this.appDiagnostics.frameRate.toFixed(0)} fps)`;
        let frameTime = 1000 / this.appDiagnostics.frameRate;
        this.averageThinkTime = this.averageThinkTime * .99 + this.appDiagnostics.lastThinkTime * .01;
        let percentThinkTime = this.averageThinkTime / frameTime * 100;

        this.timingText.text = `THINKING: ${this.appDiagnostics.lastThinkTime.toFixed(1)} ms (${percentThinkTime.toFixed(1)}%)`

        this.keyboardText.text = "Keyboard:\n" + this.keyboard.keyboardStateText;
        let states = new Array<GamepadState>();
        for(let state of  this.gamePad.gamePadStates.values()) states.push(state);
        if(states.length > 0)
        {
            this.gamepad1Text.text = "Game pad 1:\n" + states[0].diagnosticsText;
        }
        if(states.length > 1)
        {
            this.gamepad2Text.text = "Game pad 2:\n" + states[1].diagnosticsText;
        }

        let countText = "";
        for(let objectType =1; objectType < GameObjectType.COUNT_OF_TYPES; objectType++)
        {
            countText += `${this.gameObjectAbbreviation[objectType]}:    ${this.appDiagnostics.typeCount.get(objectType)}\n`
        }
        this.objectCountText.text = countText;
    };

    //-------------------------------------------------------------------------
    // stop rendering this control
    //-------------------------------------------------------------------------
    cancelMe(){
        if(this.cancelled) return;
        this.cancelled = false;
        this.drawingObjects.forEach(thing => thing.delete());
        this.drawingObjects.length = 0;
        this.cancelled = true;
    }
}