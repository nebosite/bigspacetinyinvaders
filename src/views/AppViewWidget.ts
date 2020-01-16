import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";
import { MainMenuWidget } from "./MainMenuWidget";

export class AppViewWidget extends Widget
{
    theAppModel: AppModel; 

    constructor(name: string, theAppModel: AppModel)
    {
        super(name);
        this.theAppModel = theAppModel;
        this.backgroundColor = 0x000000;
        this.alpha = 1;

        this.onLoaded.subscribe(`${this.name} Load`, ()=>{
            if(!this.widgetSystem) return;
            this.ShowMainMenu();
            this.width = this.widgetSystem.drawing.width;
            this.height = this.widgetSystem.drawing.height;
        });
    }

    ShowMainMenu(){
        let mainMenu = new MainMenuWidget("Main Menu", this.theAppModel);
        this.AddChild(mainMenu);
    }
}