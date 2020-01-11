import { Widget } from "../WidgetLib/Widget";
import { AppModel } from "../models/AppModel";
import { DrawnImage } from "src/ui/DrawHelper";

export class MainMenuWidget extends Widget
{
    theAppModel: AppModel; 
    logo: DrawnImage | null = null;

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

            let center = {x: this.width/2, y: this.height/2}

            if(this.logo)
            {
                let desiredWidth = center.x;
                let scale = (desiredWidth / this.logo.nativeWidth);
                this.logo.scale = [scale, scale];
                let realWidth = this.logo.nativeWidth * scale;
                let realHeight = this.logo.nativeHeight * scale;
                this.logo.x = center.x;
                this.logo.y = center.y - realHeight * .4;
            }
        })

        this.onDestroyed.subscribe("Main Menu destroy", ()=> {
            this.logo?.delete;
        });

        this.onLoaded.subscribe("Main Menu Load", ()=>
        {
            this.logo = this.widgetSystem?.drawing.addImageObject("img/mainlogo.png",0,0,1) as DrawnImage;     
        });
    }
}