import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameControl";
import { IKeycodeTranslator, KeycodeTranslator } from "../ui/KeyboardInput";

export class NewPlayerControl implements IInputReceiver<PlayerAction>
{
    drawContext: CanvasRenderingContext2D;
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
    
    constructor(drawContext: CanvasRenderingContext2D, onCancel: () => void)
    {
        this.drawContext = drawContext;
        this.width = drawContext.canvas.clientWidth * .25;
        this.height = this.width * .6;
        this.top = this.height * .5;
        this.left = this.width * .05;
        this.onCancel = onCancel;
    }

    render = () =>
    {
        if(this.cancelled) return;
        this.drawContext.fillStyle = "#000000"
        this.drawContext.globalAlpha = .5;
        this.drawContext.fillRect(this.left, this.top, this.width, this.height);  
        this.drawContext.globalAlpha = 1;

        let x = this.playerX * this.width * .8 + this.width * .1;
        let size = this.width * .1;
        this.drawContext.fillStyle = "#00ff00"
        this.drawContext.strokeStyle = "#008800"
        this.drawContext.lineWidth = size * .2;
        this.drawContext.beginPath();
        this.drawContext.moveTo(this.left + x - size, this.top + this.height - size);
        this.drawContext.lineTo(this.left + x, this.top + this.height - size * 3);
        this.drawContext.lineTo(this.left + x + size, this.top + this.height - size);
        this.drawContext.lineTo(this.left + x - size, this.top + this.height - size);
        this.drawContext.fill();

        if(this.isMovingLeft) this.playerX -= 0.03;
        if(this.isMovingRight) this.playerX += 0.03;
        if(this.playerX < 0) this.playerX = 0;
        if(this.playerX > 1.0) this.playerX = 1.0;

        this.drawContext.fillStyle = "#ffff00"
        let fontSize = this.height * .15;
        this.drawContext.font = `${fontSize}px sans-serif`;
        this.drawContext.fillText("New Player", this.left + size/2, this.top + size);

        this.drawContext.fillStyle = "#aaaa00"
        fontSize = this.height * .1;
        this.drawContext.font = `${fontSize}px sans-serif`;
        this.drawContext.fillText("press an action button to start", this.left + size/2, this.top + size * 2);

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