import { DrawnObject, DrawnVectorObject } from "../ui/DrawHelper";
import { Widget } from "../WidgetLib/Widget";
import { TextWidget } from "../WidgetLib/TextWidget";
import { WidgetButtonCode, ButtonEvent } from "../WidgetLib/WidgetSystem";
import { ButtonEventTranslator, IPlayerActionReceiver } from "../tools/ButtonEventTranslator";
import { PlayerAction } from "../models/Player";

export class NewPlayerWidget extends Widget implements IPlayerActionReceiver
{
    width = 500;
    height = 250;
    top = 100;
    left = 50;
    playerX = .5;
    xLeft = 0;
    xRight = 0;
    onCancel: () => void;
    onComplete: () => void;
    lastActionTime: number = Date.now();
    translator: any = null;
    drawingObjects = new Array<DrawnObject>();
    playerShip: DrawnVectorObject | null = null;
    controllerId = "";
    buttonTranslator: ButtonEventTranslator;
    actionButtonCluster = "";
    movementButtonCluster = "";

    static  CommonDirectionButtonLayouts = new Map([
        ["IJKL", [73,74,75,76,86]],
        ["WASD", [87,65,83,68]],
        ["Arrows", [38,37,40,39]],
        ["Numpad 8456", [104,100,101,102]],
        ["Left Stick", [WidgetButtonCode.Stick0Up, WidgetButtonCode.Stick0Left, WidgetButtonCode.Stick0Down, WidgetButtonCode.Stick0Right]],
        ["Right Stick",  [WidgetButtonCode.Stick1Up, WidgetButtonCode.Stick1Left, WidgetButtonCode.Stick1Down, WidgetButtonCode.Stick1Right]],
    ]);

    static CommonActionButtonLayouts = new Map([
        ["ZXCV", [90,88,67]],
        ["SpcBNM", [32,66,78,77]],
        ["0.Enter+", [96,110,13,107]],
        ["DelEndPgdwnPgup", [46,35,24,33]],
        ["DPad", [WidgetButtonCode.Button_DPadDown,WidgetButtonCode.Button_DPadLeft,WidgetButtonCode.Button_DPadRight,WidgetButtonCode.Button_DPadUp]],
        ["Diamond", [WidgetButtonCode.Button_DiamondDown,WidgetButtonCode.Button_DiamondLeft,WidgetButtonCode.Button_DiamondRight,WidgetButtonCode.Button_DiamondUp]],
        ["Right Trigger", [WidgetButtonCode.Button_ShoulderRight,WidgetButtonCode.Button_TriggerRight]],
        ["Left Trigger", [WidgetButtonCode.Button_ShoulderLeft,WidgetButtonCode.Button_TriggerLeft]],
    ]);
  
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    constructor(controllerId: string, onCancel: () => void, onComplete: () => void)
    {
        super("New Player");
        this.controllerId = controllerId;
        this.onCancel = onCancel;
        this.onComplete = onComplete;
        this.controllerId = controllerId;

        this.buttonTranslator = new ButtonEventTranslator(controllerId);
        this.buttonTranslator.addSubscriber(this)

        this.backgroundColor = 0x777777;
        this.alpha = 0.5

        this.onLoaded.subscribe(`${this.name} Load`, this.loadMe);
        this.onParentLayoutChanged.subscribe(`${this.name} parentLayoutChanged`, this.updateBasedOnParent);
        this.onRender.subscribe(`${this.name} render`, this.renderMe);
        this.onDestroyed.subscribe(`${this.name} destroy`, this.destroyMe);
        this.onButtonEvent.subscribe(`${this.name} button`, this.handleButtonEvent);
    }

    //-------------------------------------------------------------------------
    // Try to set up buttons.  When both movement and fire buttons are 
    // picked, then we are done.
    //-------------------------------------------------------------------------
    handleButtonEvent = (event: ButtonEvent) => {
        if(event.controllerId != this.controllerId) return;
        this.buttonTranslator.handleButtonEvent(event);
        if(this.actionButtonCluster == "")
        {
            for(let clusterName of NewPlayerWidget.CommonActionButtonLayouts.keys())
            {
                let codes = NewPlayerWidget.CommonActionButtonLayouts.get(clusterName) as number[];
                for(let i = 0; i < codes.length; i++)
                {
                    if(codes[i] == event.buttonCode)
                    {
                        this.buttonTranslator.controllerId = event.controllerId;
                        this.buttonTranslator.mapButton(codes[0], PlayerAction.Fire);  
                        this.buttonTranslator.mapButton(codes[1], PlayerAction.Fire);  
                        this.buttonTranslator.mapButton(codes[2], PlayerAction.Fire);  
                        this.buttonTranslator.mapButton(codes[3], PlayerAction.Fire);  
                        this.actionButtonCluster = clusterName;
                    }
                }   
            }
        }

        if(this.movementButtonCluster == "")
        {
            for(let clusterName of NewPlayerWidget.CommonDirectionButtonLayouts.keys())
            {
                let codes = NewPlayerWidget.CommonDirectionButtonLayouts.get(clusterName) as number[];
                for(let i = 0; i < codes.length; i++)
                {
                    if(codes[i] == event.buttonCode)
                    {
                        this.buttonTranslator.controllerId = event.controllerId;
                        this.buttonTranslator.mapButton(codes[0], PlayerAction.Up);  
                        this.buttonTranslator.mapButton(codes[1], PlayerAction.Left);  
                        this.buttonTranslator.mapButton(codes[2], PlayerAction.Down);  
                        this.buttonTranslator.mapButton(codes[3], PlayerAction.Right);  
                        this.movementButtonCluster = clusterName;
                    }
                }   
            }
        }

        if(this.actionButtonCluster != "" && this.movementButtonCluster != "")
        {
            this.onComplete();
        }
    }

    //-------------------------------------------------------------------------
    // Return true if the buttons is part of our controller map
    //-------------------------------------------------------------------------
    static isContollerButton(buttonId: number): boolean
    {
        for(let codes of this.CommonDirectionButtonLayouts.values())
        {
            for(let i = 0; i < codes.length; i++)
            {
                if(codes[i] == buttonId) return true;
            }   
        }

        for(let codes of this.CommonActionButtonLayouts.values())
        {
            for(let i = 0; i < codes.length; i++)
            {
                if(codes[i] == buttonId) return true;
            }   
        }

        return false;
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
        titleText.relativeSize = {width: null, height: 0.25};
        titleText.foregroundColor = 0xffff00;
        titleText.relativeLocation = {x:0.5, y:0.1}
        titleText.fontSize = 50;
        
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