import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";
import { ImageWidget } from "../WidgetLib/ImageWidget";


export class MainMenuWidget extends Widget
{
    theAppModel: AppModel; 
    logoWidget: ImageWidget | null = null;

    constructor(theAppModel: AppModel)
    {
        super();
        this.theAppModel = theAppModel;


        this.onParentSizeChanged.subscribe("Main Menu Resize", ()=>
        {
            if(!this.widgetSystem) return;
            if(!this.parent) return;
            this.width = this.parent.width;
            this.height = this.parent.height;
        })


        this.onLoaded.subscribe("Main Menu Load", ()=>
        {
            this.logoWidget = new ImageWidget("img/mainlogo.png");
            this.logoWidget.relativeSize = {width: null, height: 0.6};
            this.logoWidget.relativeLocation = {x:.5, y: .4};
            this.AddChild(this.logoWidget);
        });
    }
}