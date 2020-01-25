import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameWidget";
import { DrawHelper, DrawnObject, DrawnVectorObject } from "../ui/DrawHelper";
import { Widget } from "../WidgetLib/Widget";
import { TextWidget } from "../WidgetLib/TextWidget";

export class NewPlayerWidget extends Widget implements IInputReceiver<PlayerAction>
{
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
    playerShip: DrawnVectorObject | null = null;
    controllerId = "";
    
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    constructor(controllerId: string, onCancel: () => void)
    {
        super("New Player");
        this.controllerId = controllerId;
        this.onCancel = onCancel;
        this.backgroundColor = 0x777777;
        this.alpha = 0.5

        this.onLoaded.subscribe(`${this.name} Load`, this.loadMe);
        this.onParentLayoutChanged.subscribe(`${this.name} parentLayoutChanged`, this.updateBasedOnParent);
        this.onRender.subscribe(`${this.name} render`, this.renderMe);
        this.onDestroyed.subscribe(`${this.name} destroy`, this.destroyMe);
    }

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    loadMe = () =>
    {
        if(!this.parent || !this.widgetSystem) return;

        let size = this.width * .1;

        let x = this.playerX * this.width * .8 + this.width * .1 + this.left;
        this.playerShip = this.widgetSystem.drawing.addTriangleObject(
            x, this.top + this.height - size, size, size * 1.5 , 0x00ff00, 1, [.5, .5],  0xFFFFFF, 1,  size * .1);
        this.drawingObjects.push(this.playerShip);

        let titleText = new TextWidget("New Player", "New Player");
        titleText.relativeSize = {width: null, height: 0.15};
        titleText.foregroundColor = 0xffff00;
        titleText.relativeLocation = {x:0.5, y:0.1}
        titleText.fontSize = 50;
        titleText.alpha = 1;
        
        this.AddChild(titleText);
    }

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    updateBasedOnParent = () =>
    {

    }

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    renderMe = () =>
    {
        if(this.cancelled) return;

        let size = this.width * .1;
        let x = this.playerX * this.width * .8 + this.width * .1 + this.left;
        if(this.playerShip) this.playerShip.x = x;

        this.playerX -= this.xLeft;
        this.playerX += this.xRight;
        if(this.playerX < 0) this.playerX = 0;
        if(this.playerX > 1.0) this.playerX = 1.0;

        if(this.playerShip)
        {
            this.playerShip.width = size;
            this.playerShip.height = size * 1.6;
            this.playerShip.x = this.left + ( this.playerX * this.width * 0.8) + size;
            this.playerShip.y = this.top + this.height - this.playerShip.height;
        }

        if (this.millisecondsAgo(this.lastActionTime) > 3000)
        {
            this.Destroy();
        }
    };

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    destroyMe = () =>
    {
        this.drawingObjects.forEach(thing => thing.delete());
        this.drawingObjects.length = 0;
        this.cancelled = true;
        this.onCancel();
    }

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    millisecondsAgo(date: number)
    {
        return Date.now() - date;
    }

    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    actionChanged = (action: PlayerAction, value: number) => {
        switch(action)
        {
            case PlayerAction.Left: this.xLeft = .03 * value; break;
            case PlayerAction.Right: this.xRight = .03 * value; break;
        }   
        this.lastActionTime = Date.now();
    };
}