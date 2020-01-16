import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";
import { ImageWidget } from "../WidgetLib/ImageWidget";
import { TextWidget } from "../WidgetLib/TextWidget";


export class MainMenuWidget extends Widget
{
    theAppModel: AppModel; 
    logoWidget: ImageWidget | null = null;
    choices = new Array<{widget: Widget, action: ()=>void}> ();
    currentChoice = 0;

    constructor(name: string, theAppModel: AppModel)
    {
        super(name);
        this.theAppModel = theAppModel;

        this.onParentLayoutChanged.subscribe(`${this.name} Resize`, ()=>
        {
            if(!this.widgetSystem) return;
            if(!this.parent) return;
            this.width = this.parent.width;
            this.height = this.parent.height;
        })

        this.onLoaded.subscribe(`${this.name} Load`, ()=>
        {
            if(!this.widgetSystem) return;
            if(!this.parent) return;

            this.width = this.parent.width;
            this.height = this.parent.height;

            this.logoWidget = new ImageWidget("Logo", "img/mainlogo.png");
            this.logoWidget.relativeSize = {width: null, height: 0.6};
            this.logoWidget.relativeLocation = {x:.5, y: .4};
            this.AddChild(this.logoWidget);

            let choice = {
                widget: new TextWidget("Play Choice", "PLAY!"),
                action: () => {}
            }
            choice.widget.relativeSize = {width: null, height: 0.05};
            choice.widget.relativeLocation = {x:.5, y: .75};
            choice.widget.backgroundColor = 0xFF0000;
            choice.widget.fontSize = 80;
            choice.widget.foregroundColor = 0x00FF00;
            this.AddChild(choice.widget);
            this.choices.push(choice);

            choice = {
                widget: new TextWidget("FullScreen Choice", "[X] FullScreen"),
                action: () => {}
            }
            choice.widget.relativeSize = {width: null, height: 0.03};
            choice.widget.relativeLocation = {x:.5, y: .85};
            choice.widget.backgroundColor = 0xFF0000;
            choice.widget.fontSize = 80;
            choice.widget.foregroundColor = 0x00FFFF;
            this.AddChild(choice.widget);
            this.choices.push(choice);


        });
    }
}