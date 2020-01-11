import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";

export class MainMenuWidget extends Widget
{
    theAppModel: AppModel; 

    constructor(theAppModel: AppModel)
    {
        super();
        this.theAppModel = theAppModel;
        this.backgroundColor = 0xffff00;
        this.alpha = .1;

        this.onParentSizeChanged.subscribe("MainScreen Resize", ()=>
        {
            if(!this.parent) return;
            this.width = this.parent.width;
            this.height = this.parent.height;
        })
    }
}