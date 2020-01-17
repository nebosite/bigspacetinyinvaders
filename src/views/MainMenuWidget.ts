import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";
import { ImageWidget } from "../WidgetLib/ImageWidget";
import { TextWidget } from "../WidgetLib/TextWidget";
import { ButtonEvent } from "../WidgetLib/WidgetSystem";
import { DrawnSprite } from "../ui/DrawHelper";
import { GameWidget } from "./GameWidget";


//-------------------------------------------------------------------------
// MainMenuWidget
//-------------------------------------------------------------------------
export class MainMenuWidget extends Widget
{
    theAppModel: AppModel; 
    logoWidget: ImageWidget | null = null;
    choiceIndicator: DrawnSprite | null = null;
    choices = new Array<{widget: Widget, action: ()=>void}> ();
    currentChoice = 0;
    fullScreen = true;

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(name: string, theAppModel: AppModel)
    {
        super(name);
        this.theAppModel = theAppModel;

        this.onLoaded.subscribe(`${this.name} Load`, this.loadMe);
        this.onParentLayoutChanged.subscribe(`${this.name} Resize`, this.respondToParentLayoutChange);
        this.onLayoutChange.subscribe(`${this.name} Layout`, this.changeMyLayout);
        this.onRender.subscribe(`${this.name} Render`, this.renderMe )
        this.onButtonEvent.subscribe(`${this.name} Button Up`, this.handleButtons ); 
        this.onDestroyed.subscribe(`${this.name} Destroy`, this.destroyMe);
    }

    //-------------------------------------------------------------------------
    // destroyMe
    //-------------------------------------------------------------------------
    destroyMe = ()=>{
        this.choiceIndicator?.delete();
    }
    
    //-------------------------------------------------------------------------
    // loadMe
    //-------------------------------------------------------------------------
    loadMe= () =>
    {
        if(!this.widgetSystem) return;
        if(!this.parent) return;

        this.width = this.parent.width;
        this.height = this.parent.height;

        this.logoWidget = new ImageWidget("Logo", "img/mainlogo.png");
        this.logoWidget.relativeSize = {width: null, height: 0.6};
        this.logoWidget.relativeLocation = {x:.5, y: .4};
        this.AddChild(this.logoWidget);

        let playChoiceWidget = new TextWidget("Play Choice", "PLAY!");
        let choice = {
            widget: playChoiceWidget,
            action: () => { this.startGame() }
        }
        choice.widget.relativeSize = {width: null, height: 0.05};
        choice.widget.relativeLocation = {x:.5, y: .75};
        choice.widget.backgroundColor = 0xFF0000;
        choice.widget.fontSize = 80;
        choice.widget.foregroundColor = 0x00FF00;
        this.AddChild(choice.widget);
        this.choices.push(choice);

        let fullScreenText = ()=>{return `[${this.fullScreen ? "X" : "  "}] Fullscreen`}
        let fullScreenChoiceWidget =  new TextWidget("FullScreen Choice", fullScreenText());
        choice = {
            widget: fullScreenChoiceWidget,
            action: () => {
                this.fullScreen = !this.fullScreen;
                fullScreenChoiceWidget.text = fullScreenText();
                this._layoutChanged = true;
            }
        }
        choice.widget.relativeSize = {width: null, height: 0.03};
        choice.widget.relativeLocation = {x:.5, y: .85};
        choice.widget.backgroundColor = 0xFF0000;
        choice.widget.fontSize = 80;
        choice.widget.foregroundColor = 0x00FFFF;
        this.AddChild(choice.widget);
        this.choices.push(choice);

        this.choiceIndicator = this.widgetSystem.drawing.addSpriteObject("sprites/alien",0,0,0);
    }

    //-------------------------------------------------------------------------
    // respondToParentLayoutChange
    //-------------------------------------------------------------------------
    startGame()
    {
        this.parent?.AddChild(new GameWidget(this.theAppModel));
        this.parent?.RemoveChild(this);
    }

    //-------------------------------------------------------------------------
    // respondToParentLayoutChange
    //-------------------------------------------------------------------------
    respondToParentLayoutChange = () =>
    {
        if(!this.widgetSystem) return;
        if(!this.parent) return;
        this.width = this.parent.width;
        this.height = this.parent.height;
    }
    
    //-------------------------------------------------------------------------
    // changeMyLayout
    //-------------------------------------------------------------------------
    changeMyLayout = () =>
    {
        if(this.choiceIndicator)
        {
            //this.choiceIndicator.height = 
            let currentWidget = this.choices[this.currentChoice].widget;
            let playWidget = this.choices[0].widget;
            this.choiceIndicator.x = playWidget.left - this.choiceIndicator.width*1.5;
            this.choiceIndicator.y = currentWidget.top + currentWidget.height/2;
            let scale =  playWidget.height / this.choiceIndicator.nativeHeight;
            this.choiceIndicator.scale =  [scale,scale];
        }
    }    

    firstRender = false;
    //-------------------------------------------------------------------------
    // renderMe
    //-------------------------------------------------------------------------
    renderMe = ()=>{
        if(this.firstRender)
        {
            this.firstRender = false;
            this._layoutChanged = true;
        }
        let now = Date.now();
        if(this.choiceIndicator)
        {
            this.choiceIndicator.rotation = now/1000.0;
            this.choiceIndicator.textureFrame = 2 + Math.floor(now/1000) % 2;
        }
    }

    
    //-------------------------------------------------------------------------
    // handleButtons
    //-------------------------------------------------------------------------
    handleButtons = (event: ButtonEvent)=>
    {
        if(!event.isPressed)
        {
            switch(event.buttonId)
            {
                case 37: // left
                case 38: // up
                    this.currentChoice--;
                    if(this.currentChoice < 0) this.currentChoice = this.choices.length-1;
                    this._layoutChanged = true;
                    break;
                case 39: // right
                case 40: // down
                    this.currentChoice++;
                    if(this.currentChoice >= this.choices.length ) this.currentChoice =0;
                    this._layoutChanged = true;
                    break;
                case 13: // Enter
                case 32: // Space
                    this.choices[this.currentChoice].action();
            }
        }
    }
    
}