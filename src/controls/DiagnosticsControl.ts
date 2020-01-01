import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameControl";
import { IKeycodeTranslator, KeycodeTranslator, KeyboardManager } from "../ui/KeyboardInput";
import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnText } from "../ui/DrawHelper";
import { GamepadManager } from "src/ui/GamepadInput";
import { AppModel, AppDiagnostics } from "src/models/AppModel";

export class DiagnosticsControl 
{
    drawing: DrawHelper;
    gamePad: GamepadManager;
    keyboard: KeyboardManager;
    appDiagnostics: AppDiagnostics;
    fontSize = 12;
    lastFrameTime = Date.now();
    cancelled = false;
    averageThinkTime = 0;

    drawingObjects = new Array<DrawnObject>();
    frameRateText: DrawnText;
    timingText: DrawnText;
    
    constructor(drawing: DrawHelper, gamePad: GamepadManager, keyboard: KeyboardManager, appDiagnostics: AppDiagnostics)
    {
        this.gamePad = gamePad;
        this.keyboard = keyboard;
        this.drawing = drawing;
        this.appDiagnostics = appDiagnostics;
        
        this.drawingObjects.push(drawing.addRectangleObject(0,0, 500,500,0x000000, .7));

        this.frameRateText = drawing.addTextObject("F:", 5,5,this.fontSize);
        this.drawingObjects.push(this.frameRateText);

        this.timingText = drawing.addTextObject("T:", 5,25,this.fontSize);
        this.drawingObjects.push(this.timingText);
    }

    render = () =>
    {
        this.frameRateText.text = `FRAME: ${this.appDiagnostics.frame}  (${this.appDiagnostics.frameRate.toFixed(0)} fps)`;
        let frameTime = 1000 / this.appDiagnostics.frameRate;
        this.averageThinkTime = this.averageThinkTime * .99 + this.appDiagnostics.lastThinkTime * .01;
        let percentThinkTime = this.averageThinkTime / frameTime * 100;

        this.timingText.text = `THINKING: ${this.appDiagnostics.lastThinkTime.toFixed(1)} ms (${percentThinkTime.toFixed(1)}%)`
    };

    cancelMe(){
        if(this.cancelled) return;
        this.cancelled = false;
        this.drawingObjects.forEach(thing => thing.delete());
        this.drawingObjects.length = 0;
        this.cancelled = true;
    }
}