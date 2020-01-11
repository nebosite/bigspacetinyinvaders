import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";

export class MainMenuWidget extends Widget
{
    theAppModel: AppModel; 

    constructor(theAppModel: AppModel)
    {
        super();
        this.theAppModel = theAppModel;
        this.backgroundColor = 0x00ff00;
        this.alpha = 0.3;

        this.onParentSizeChanged.subscribe("MainScreen Resize", ()=>
        {
            if(!this.widgetSystem) return;
            this.width = this.widgetSystem.drawing.width;
            this.height = this.widgetSystem.drawing.height;
        })
    }
}