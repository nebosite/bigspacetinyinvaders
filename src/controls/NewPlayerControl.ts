import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameControl";
import { IKeycodeTranslator, KeycodeTranslator } from "../ui/KeyboardInput";
import { DrawHelper, DrawnObject, DrawnVectorObject } from "../ui/DrawHelper";

export class NewPlayerControl implements IInputReceiver<PlayerAction>
{
    drawing: DrawHelper;
    width = 500;
    height = 500;
    top = 100;
    left = 50;
    playerX = .5;
    xLeft = 0;
    xRight = 0;
    onCancel: () => void;
    lastActionTime: number = Date.now();
    cancelled = false;
    translator: any = null;
    drawingObjects = new Array<DrawnObject>();
    playerShip: DrawnVectorObject;
    
    constructor(drawing: DrawHelper, onCancel: () => void)
    {
        this.drawing = drawing;
        this.width = drawing.width * .25;
        this.height = this.width * .6;
        this.top = this.height * .5;
        this.left = this.width * .05;
        this.onCancel = onCancel;

        this.drawingObjects.push(
            drawing.addRectangleObject(
                this.left, this.top, this.width, this.height, 0x777777, 0.5
            )
        );
        let size = this.width * .1;
        this.drawingObjects.push(
            this.drawing.addTextObject(
                "New Player", 
                this.left + size/2, this.top + size/2, this.height * .15, "#FFFF00"
            )
        );
        this.drawingObjects.push(
            this.drawing.addTextObject(
                "press an action button to start", 
                this.left + size/2, this.top + size * 1.5, this.height * .10, "#aaaa00"
            )
        );

        let x = this.playerX * this.width * .8 + this.width * .1 + this.left;
        this.playerShip = this.drawing.addTriangleObject(
            x, this.top + this.height - size, size, size * 1.6, 0x00ff00, 1, [.5, .5],  0xFFFFFF, 1,  size * .1);
        this.drawingObjects.push(this.playerShip);
    }

    render = () =>
    {
        if(this.cancelled) return;

        let size = this.width * .1;
        let x = this.playerX * this.width * .8 + this.width * .1 + this.left;
        this.playerShip.x = x;

        this.playerX -= this.xLeft;
        this.playerX += this.xRight;
        if(this.playerX < 0) this.playerX = 0;
        if(this.playerX > 1.0) this.playerX = 1.0;

        if (this.millisecondsAgo(this.lastActionTime) > 3000)
        {
            this.cancelMe();
        }
    };

    cancelMe(){
        this.drawingObjects.forEach(thing => thing.delete());
        this.drawingObjects.length = 0;
        this.cancelled = true;
        this.onCancel();
    }

    millisecondsAgo(date: number)
    {
        return Date.now() - date;
    }

    actionChanged = (action: PlayerAction, value: number) => {
        switch(action)
        {
            case PlayerAction.Left: this.xLeft = .03 * value; break;
            case PlayerAction.Right: this.xRight = .03 * value; break;
        }   
        this.lastActionTime = Date.now();
    };
}