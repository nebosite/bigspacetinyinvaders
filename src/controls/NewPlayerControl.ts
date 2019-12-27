import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameControl";
import { IKeycodeTranslator, KeycodeTranslator } from "../ui/KeyboardInput";
import { DrawHelper } from "../ui/DrawHelper";

export class NewPlayerControl implements IInputReceiver<PlayerAction>
{
    drawing: DrawHelper;
    width = 500;
    height = 500;
    top = 100;
    left = 50;
    playerX = .5;
    isMovingLeft = false;
    isMovingRight = false;
    onCancel: () => void;
    lastActionTime: number = Date.now();
    cancelled = false;
    translator: KeycodeTranslator<PlayerAction> | null = null;
    
    constructor(drawing: DrawHelper, onCancel: () => void)
    {
        this.drawing = drawing;
        this.width = drawing.width * .25;
        this.height = this.width * .6;
        this.top = this.height * .5;
        this.left = this.width * .05;
        this.onCancel = onCancel;
    }

    render = () =>
    {
        if(this.cancelled) return;
        this.drawing.drawRect(this.left, this.top, this.width, this.height, "#777777", "", 0, .5);

        let size = this.width * .1;
        let x = this.playerX * this.width * .8 + this.width * .1 + this.left;
        this.drawing.drawTriangle(x - size/2, this.top + this.height - size/2, size, size * 1.6, "#00ff00", "#FFFFFF", size * .2);

        if(this.isMovingLeft) this.playerX -= 0.03;
        if(this.isMovingRight) this.playerX += 0.03;
        if(this.playerX < 0) this.playerX = 0;
        if(this.playerX > 1.0) this.playerX = 1.0;

        this.drawing.print("New Player", 
            this.left + size/2, this.top + size,     this.height * .15, "#FFFF00");
        this.drawing.print("press an action button to start", 
            this.left + size/2, this.top + size * 2, this.height * .10, "#aaaa00");
        
        if (this.millisecondsAgo(this.lastActionTime) > 3000)
        {
            this.cancelled = true;
            this.onCancel();
        }
    };

    millisecondsAgo(date: number)
    {
        return Date.now() - date;
    }

    startAction = (action: PlayerAction) => {
        switch(action)
        {
            case PlayerAction.Left: 
                this.isMovingLeft = true;
                break;
            case PlayerAction.Right:
                this.isMovingRight = true;
                break;                
        }  
        this.lastActionTime = Date.now();
    };

    stopAction = (action: PlayerAction) => {
        switch(action)
        {
            case PlayerAction.Left: 
                this.isMovingLeft = false;
                break;
            case PlayerAction.Right:
                this.isMovingRight = false;
                break;                
        }  
    };
}