import { DrawnObject, DrawnVectorObject } from "../ui/DrawHelper";
import { Widget } from "../WidgetLib/Widget";
import { TextWidget } from "../WidgetLib/TextWidget";
import { WidgetButtonCode, ButtonEvent } from "../WidgetLib/WidgetSystem";
import { ButtonEventTranslator, IPlayerActionReceiver } from "../tools/ButtonEventTranslator";
import { PlayerAction } from "../models/Player";
import { keyboardEventLookup } from "../ui/KeyboardInput";

const InputCluster = {
    IJKL:[
        keyboardEventLookup("KeyI"),
        keyboardEventLookup("KeyJ"),
        keyboardEventLookup("KeyK"),
        keyboardEventLookup("KeyL"),
    ],
    WASD:[
        keyboardEventLookup("KeyW"),
        keyboardEventLookup("KeyA"),
        keyboardEventLookup("KeyS"),
        keyboardEventLookup("KeyD"),
    ],
    Arrows:[
        keyboardEventLookup("ArrowUp"),
        keyboardEventLookup("ArrowLeft"),
        keyboardEventLookup("ArrowDown"),
        keyboardEventLookup("ArrowRight"),
    ],
    Numpad8456:[
        keyboardEventLookup("Numpad8"),
        keyboardEventLookup("Numpad4"),
        keyboardEventLookup("Numpad5"),
        keyboardEventLookup("Numpad6"),
    ],

    LeftCtrlSp:[
        keyboardEventLookup("ControlLeft"),
        keyboardEventLookup("Space"),
    ],
    LeftAltShiftZ:[
        keyboardEventLookup("AltLeft"),
        keyboardEventLookup("ShiftLeft"),
        keyboardEventLookup("KeyZ"),
    ],
    RightCtrlDel:[
        keyboardEventLookup("ControlRight"),
        keyboardEventLookup("Delete"),
    ],
    RightAltShiftSlash: [
        keyboardEventLookup("ControlRight"),
        keyboardEventLookup("ShiftRight"),
        keyboardEventLookup("Slash"),
    ],
    Numpad0dot:[
        keyboardEventLookup("Numpad0"),
        keyboardEventLookup("NumpadDecimal"),
    ],
    NumpadEnterPlus:[
        keyboardEventLookup("NumpadEnter"),
        keyboardEventLookup("NumpadAdd"),
    ],  
    
    LeftStick:[
        WidgetButtonCode.Stick0Up, 
        WidgetButtonCode.Stick0Left, 
        WidgetButtonCode.Stick0Down, 
        WidgetButtonCode.Stick0Right
    ],
    RightStick: [
        WidgetButtonCode.Stick1Up, 
        WidgetButtonCode.Stick1Left, 
        WidgetButtonCode.Stick1Down, 
        WidgetButtonCode.Stick1Right
    ],
    DPad:[
        WidgetButtonCode.Button_DPadDown,
        WidgetButtonCode.Button_DPadLeft,
        WidgetButtonCode.Button_DPadRight,
        WidgetButtonCode.Button_DPadUp
    ],
    Triggers:[
        WidgetButtonCode.Button_TriggerRight,
        WidgetButtonCode.Button_TriggerLeft
    ],
    Shoulders:[
        WidgetButtonCode.Button_ShoulderRight,
        WidgetButtonCode.Button_ShoulderLeft
    ],
    DiamondAB:[
        WidgetButtonCode.Button_DiamondDown,
        WidgetButtonCode.Button_DiamondRight
    ],
    DiamondXY:[
        WidgetButtonCode.Button_DiamondLeft,
        WidgetButtonCode.Button_DiamondUp
    ]
}

interface ButtonCluster {
    movement: number[][]
    fire: number[][]
    rotate: number[][]
}
export class NewPlayerWidget extends Widget implements IPlayerActionReceiver
{
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
    buttonLayout = "";

    static ButtonLayouts = new Map<string, ButtonCluster>([
        ["Keyboard Single", { 
            movement: [InputCluster.IJKL, InputCluster.WASD, InputCluster.Arrows, InputCluster.Numpad8456],
            fire: [InputCluster.LeftCtrlSp, InputCluster.RightCtrlDel, InputCluster.Numpad0dot],
            rotate: [InputCluster.LeftAltShiftZ, InputCluster.RightAltShiftSlash, InputCluster.NumpadEnterPlus]
        }],
        ["Gamepad Single", { 
            movement: [InputCluster.LeftStick, InputCluster.RightStick, InputCluster.DPad],
            fire: [InputCluster.Triggers, InputCluster.DiamondAB],
            rotate: [InputCluster.Shoulders, InputCluster.DiamondXY]
        }]
    ])
  
    //-------------------------------------------------------------------------
    // 
    //-------------------------------------------------------------------------
    constructor(controllerId: string, onCancel: () => void, onComplete: () => void)
    {
        super("New Player");
        this.width = 50;
        this.height = 25;
        this.top = 100;
        this.left = 50;
    
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
        if(this.buttonLayout != "") return;

        const assignLayout = (clusterName: string, cluster: ButtonCluster) => {
            for(let keySet of cluster.movement) {
                this.buttonTranslator.mapButton(keySet[0], PlayerAction.Up);  
                this.buttonTranslator.mapButton(keySet[1], PlayerAction.Left);  
                this.buttonTranslator.mapButton(keySet[2], PlayerAction.Down);  
                this.buttonTranslator.mapButton(keySet[3], PlayerAction.Right);  
            }
            for(let keySet of cluster.fire) {
                for(let code of keySet) {
                    this.buttonTranslator.mapButton(code, PlayerAction.Fire);                   
                }
            }
            for(let keySet of cluster.rotate) {
                for(let code of keySet) {
                    this.buttonTranslator.mapButton(code, PlayerAction.Rotate);                   
                }
            }

            this.buttonLayout = clusterName;
            this.onComplete();
        }

        if(this.buttonLayout == "")
        {
            for(let clusterName of NewPlayerWidget.ButtonLayouts.keys())
            {
                const cluster = NewPlayerWidget.ButtonLayouts.get(clusterName)!;
                for(let buttonType in cluster) {
                    for(let keySet of (cluster as any)[buttonType] as number[][]) {
                        for(let code of keySet) {
                            if(code === event.buttonCode) {
                                assignLayout(clusterName, cluster)
                            }
                        }
                    }                   
                }
            }
        }
    }

    //-------------------------------------------------------------------------
    // Return true if the buttons is part of our controller map
    //-------------------------------------------------------------------------
    static isContollerButton(buttonId: number): boolean
    {
        for(let property in InputCluster) {
            for(let code of (InputCluster as any)[property] as number[]) {
                if(buttonId === code) return true;
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