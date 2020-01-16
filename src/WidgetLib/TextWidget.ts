import { Widget } from "./Widget";
import { DrawnText } from "../ui/DrawHelper";

export class TextWidget extends Widget
{
    theText: DrawnText | null = null;
    fontSize = 20;
    private _widthHeightRatio = 1;

    constructor(name: string, text: string)
    {
        super(name);

        this.onLoaded.subscribe(`${this.name} Load`, ()=>
        {
            this.theText = this.widgetSystem?.drawing.addTextObject(
                text,
                0,0,
                this.fontSize,
                this.foregroundColor) as DrawnText;
            this.width = this.theText.width;
            this.height = this.theText.height;
            this._widthHeightRatio = this.width / this.height;
        }); 

        this.onDestroyed.subscribe(`${this.name} destroy`, ()=> {
            this.theText?.delete;
            this.theText = null;
        });

        this.onLayoutChange.subscribe(`${this.name} layout`, ()=>
        {
            if(!this.widgetSystem || !this.theText ) return;
            if(this.relativeSize?.width)
            {
                this.theText.width = this.width;
                this.theText.height = this.width / this._widthHeightRatio;
            }
            if(this.relativeSize?.height)
            {
                this.theText.height = this.height;
                this.theText.width = this.height * this._widthHeightRatio;
            }
            this.width = this.theText.width;
            this.height = this.theText.height;

            this.theText.x = this.left;
            this.theText.y = this.top;
        });

        this.onColorChange.subscribe(`${this.name} coloring`, ()=>{
            if(!this.widgetSystem || !this.theText ) return;
            this.theText.color = this.foregroundColor;
        });

    }
}