import { Widget } from "./Widget";
import { DrawnImage } from "../ui/DrawHelper";

export class ImageWidget extends Widget
{
    theImage: DrawnImage | null = null;

    constructor(imageName: string)
    {
        super();

        this.onLoaded.subscribe("Load ImageWidget", ()=>
        {
            this.theImage = this.widgetSystem?.drawing.addImageObject(imageName,0,0,1) as DrawnImage;
            this.width = this.theImage.nativeWidth;
            this.height = this.theImage.nativeHeight;     
        }); 

        this.onDestroyed.subscribe("ImageWidget destroy", ()=> {
            this.theImage?.delete;
            this.theImage = null;
        });

        this.onParentSizeChanged.subscribe("ImageWidget Resize", ()=>
        {
            if(!this.widgetSystem || !this.theImage ) return;
            
            let scale = 0;
            let scaleX = this.width / this.theImage.nativeWidth;
            let scaleY = this.height / this.theImage.nativeHeight;
            scale = Math.min(scaleX, scaleY);
            this.theImage.scale = [scale, scale];
            this.theImage.x = this.left + this.width/2;
            this.theImage.y = this.top + this.height/2;
        })
    }
}