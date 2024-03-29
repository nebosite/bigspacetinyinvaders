import { Widget } from "../WidgetLib/Widget";
import { IAppModel } from "../models/AppModel";
import { ImageWidget } from "../WidgetLib/ImageWidget";
import { TextWidget } from "../WidgetLib/TextWidget";
import { ButtonEvent, WidgetButtonCode } from "../WidgetLib/WidgetSystem";
import { DrawnSprite } from "../ui/DrawHelper";
import { GameWidget } from "./GameWidget";
import { GLOBALS } from "../globals";
import { keyboardEventLookup } from "../ui/KeyboardInput";


//-------------------------------------------------------------------------
// MainMenuWidget
//-------------------------------------------------------------------------
export class MainMenuWidget extends Widget
{
    theAppModel: IAppModel; 
    logoWidget: ImageWidget | null = null;
    choiceIndicator: DrawnSprite | null = null;
    theGame: GameWidget | null = null;
    invaders = new Array<DrawnSprite>();
    choices = new Array<{widget: Widget, action: ()=>void}> ();
    currentChoice = 0;
    invaderCount = 10;
    startingGame = false;

    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(name: string, theAppModel: IAppModel)
    {
        super(name);
        this.theAppModel = theAppModel;

        this.onLoaded.subscribe(`${this.name} Load`, this.loadMe);
        this.onParentLayoutChanged.subscribe(`${this.name} Resize`, this.respondToParentLayoutChange);
        this.onLayoutChange.subscribe(`${this.name} Layout`, this.changeMyLayout);
        this.onRender.subscribe(`${this.name} Render`, this.renderMe )
        this.onButtonEvent.subscribe(`${this.name} Button`, this.handleButtons ); 
        this.onDestroyed.subscribe(`${this.name} Destroy`, this.destroyMe);
    }

    //-------------------------------------------------------------------------
    // destroyMe
    //-------------------------------------------------------------------------
    destroyMe = ()=>{
        this.choiceIndicator?.delete();
        for(let x = 0; x < this.invaderCount; x++)
        {
            this.invaders[x].delete();
        }
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
        this.logoWidget.relativeSize = {width: null, height: 0.5};
        this.logoWidget.relativeLocation = {x:.5, y: .3};
        this.AddChild(this.logoWidget);

        let playChoiceWidget = new TextWidget("Play Choice", "PLAY!");
        let choice = {
            widget: playChoiceWidget,
            action: () => { this.startGame() }
        }
        playChoiceWidget.onMouseUp.subscribe("Main Menu Play Choice", e => { this.currentChoice = 0; this.choices[this.currentChoice].action(); })
        choice.widget.relativeSize = {width: null, height: 0.05};
        choice.widget.relativeLocation = {x:.5, y: .75};
        choice.widget.backgroundColor = 0xFF0000;
        choice.widget.fontSize = 80;
        choice.widget.foregroundColor = 0x009DFF;
        this.AddChild(choice.widget);
        this.choices.push(choice);

        let fullScreenText = ()=>{return `[${this.theAppModel.settings.isFullScreen ? "X" : "  "}] Fullscreen`}
        let fullScreenChoiceWidget =  new TextWidget("FullScreen Choice", fullScreenText());
        choice = {
            widget: fullScreenChoiceWidget,
            action: () => {
                this.theAppModel.settings.isFullScreen = !this.theAppModel.settings.isFullScreen;
                fullScreenChoiceWidget.text = fullScreenText();
                this._layoutChanged = true;
            }
        }
        fullScreenChoiceWidget.onMouseUp.subscribe("Main Menu FullScreen Choice", e => { this.currentChoice = 1; this.choices[this.currentChoice].action(); })
        choice.widget.relativeSize = {width: null, height: 0.03};
        choice.widget.relativeLocation = {x:.5, y: .85};
        choice.widget.backgroundColor = 0xFF0000;
        choice.widget.fontSize = 80;
        choice.widget.foregroundColor = 0x009DFF;
        this.AddChild(choice.widget);
        this.choices.push(choice);


        let versionText = new TextWidget("Version", "v" + GLOBALS.version);
        versionText.relativeLocation = {x:0, y:0};
        versionText.fontSize = 15;
        versionText.foregroundColor = 0x009DFF;
        versionText.relativeSize = {width: null, height: .03}
        this.AddChild(versionText);

        this.choiceIndicator = this.widgetSystem.drawing.addSpriteObject("sprites/alien",0,0,0);
        for(let x = 0; x < this.invaderCount; x++)
        {
            this.invaders.push(this.widgetSystem.drawing.addSpriteObject("sprites/alien",2,0,0));
        }
   
    }

    //-------------------------------------------------------------------------
    // respondToParentLayoutChange
    //-------------------------------------------------------------------------
    startGame()
    {
        var documentElement = document.documentElement;
        if(this.theAppModel.settings.isFullScreen)
        {
            documentElement.requestFullscreen();
        }

        this.theGame = new GameWidget(this.theAppModel);
        this.parent?.AddChild(this.theGame);
        this.startingGame = true;
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
            let playWidget = this.choices[0].widget;
            let currentWidget = this.choices[this.currentChoice].widget;
            let scale =  playWidget.height / this.choiceIndicator.nativeHeight / this.widgetSystem!.drawing.spriteScaling;
            this.choiceIndicator.scale =  [scale,scale];
            this.choiceIndicator.x = playWidget.left - this.choiceIndicator.width * 4;
            this.choiceIndicator.y = currentWidget.top + currentWidget.height/2;
        }

        if(this.logoWidget)
        {
            let invaderSkip = (this.logoWidget.width * .5)/(this.invaderCount -1);
            let invaderX = this.logoWidget.left + this.logoWidget.width/4;
            for(let x = 0; x < this.invaderCount; x++)
            {
                this.invaders[x].x = invaderX + x * invaderSkip;
                this.invaders[x].y = this.logoWidget.top + this.logoWidget.height * 1.1;
            }

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

        if(this.startingGame && this.theGame)
        {
            this.left -= this.width/30;
            this.theGame.left = this.left + this.width;
            if(this.theGame.left < 0)
            {
                this.theGame.left = 0;
                this.parent?.RemoveChild(this);
                this.theGame.Start();
                this.startingGame = false;
            }
        }
    }

    
    //-------------------------------------------------------------------------
    // handleButtons
    //-------------------------------------------------------------------------
    handleButtons = (event: ButtonEvent)=>
    {
        if(!event.isPressed)
        {
            let code = event.buttonCode;
            if(code === keyboardEventLookup("ArrowLeft") || code === keyboardEventLookup("ArrowUp")) {
                code = WidgetButtonCode.Stick0Left
            }
            else if(code === keyboardEventLookup("ArrowRight") || code === keyboardEventLookup("ArrowDown")) {
                code = WidgetButtonCode.Stick0Right
            }
            else if(code === keyboardEventLookup("Enter") || code === keyboardEventLookup("Space")
                || code === keyboardEventLookup("ControlLeft") || code === keyboardEventLookup("ControlRight")) {
                code = WidgetButtonCode.Button_TriggerRight
            }
            switch(code)
            {
                case WidgetButtonCode.Button_DPadUp:
                case WidgetButtonCode.Button_ShoulderLeft:
                case WidgetButtonCode.Stick0Left:
                case WidgetButtonCode.Stick0Up:
                case WidgetButtonCode.Stick1Left:
                case WidgetButtonCode.Stick1Up:
                    this.currentChoice--;
                    if(this.currentChoice < 0) this.currentChoice = this.choices.length-1;
                    this._layoutChanged = true;
                    break;
                case WidgetButtonCode.Button_DPadDown:
                case WidgetButtonCode.Button_ShoulderRight:
                case WidgetButtonCode.Stick0Right:
                case WidgetButtonCode.Stick0Down:
                case WidgetButtonCode.Stick1Right:
                case WidgetButtonCode.Stick1Down:
                    this.currentChoice++;
                    if(this.currentChoice >= this.choices.length ) this.currentChoice =0;
                    this._layoutChanged = true;
                    break;
                case WidgetButtonCode.Button_TriggerLeft:
                case WidgetButtonCode.Button_TriggerRight:
                case WidgetButtonCode.Button_DiamondDown:
                case WidgetButtonCode.Button_DiamondRight:
                    this.choices[this.currentChoice].action();
            }
        }
    }
    
}