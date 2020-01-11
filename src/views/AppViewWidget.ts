import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";
import { MainMenuWidget } from "./MainMenuWidget";

export class AppViewWidget extends Widget
{
    theAppModel: AppModel; 

    constructor(theAppModel: AppModel)
    {
        super();
        this.theAppModel = theAppModel;
        this.backgroundColor = 0x000000;
        this.alpha = 1;

        this.onParentSizeChanged.subscribe("AppView Resize", ()=>
        {
            if(!this.widgetSystem) return;
            this.width = this.widgetSystem.drawing.width;
            this.height = this.widgetSystem.drawing.height;
        })

        this.onLoaded.subscribe("AppView Loading", ()=>{
            this.AddChild(new MainMenuWidget(this.theAppModel));
        });
    }
}