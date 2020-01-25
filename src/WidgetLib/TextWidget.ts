import { Widget } from "./Widget";
import { DrawnText } from "../ui/DrawHelper";

export class TextWidget extends Widget
{
    private _theText: DrawnText | null = null;
    get text(){return this._theText ? this._theText.text: ""}
    set text(value: string){ if(this._theText) this._theText.text = value}

    fontSize = 20;
    private _widthHeightRatio = 1;

    constructor(name: string, text: string)
    {
        super(name);

        this.onLoaded.subscribe(`${this.name} Load`, ()=>
        {
            this._theText = this.widgetSystem?.drawing.addTextObject(
                text,
                0,0,
                this.fontSize,
                this.foregroundColor, 0x0, 0, 10000, [0,0]) as DrawnText;
            this.width = this._theText.width;
            this.height = this._theText.height;
            this._widthHeightRatio = this.width / this.height;
        }); 

        this.onDestroyed.subscribe(`${this.name} destroy`, ()=> {
            this._theText?.delete();
            this._theText = null;
        });

        this.onLayoutChange.subscribe(`${this.name} layout`, ()=>
        {
            if(!this.widgetSystem || !this._theText ) return;
            if(this.relativeSize?.width)
            {
                this._theText.width = this.width;
                this._theText.height = this.width / this._widthHeightRatio;
            }
            if(this.relativeSize?.height)
            {
                this._theText.height = this.height;
                this._theText.width = this.height * this._widthHeightRatio;
            }
            this.width = this._theText.width;
            this.height = this._theText.height;


            this._theText.x = this.left;
            this._theText.y = this.top;
        });

        this.onColorChange.subscribe(`${this.name} coloring`, ()=>{
            if(!this.widgetSystem || !this._theText ) return;
            this._theText.color = this.foregroundColor;
        });

    }
}