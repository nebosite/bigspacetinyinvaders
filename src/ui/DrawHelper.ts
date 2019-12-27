// https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D

import { Sprite } from "./Sprite";

export class DrawHelper {
    drawContext: CanvasRenderingContext2D;
    gameSprites: Sprite;

    width = 0;
    height = 0;

    constructor(drawContext: CanvasRenderingContext2D) {
        this.drawContext = drawContext;
        this.width = drawContext.canvas.width;
        this.height = drawContext.canvas.height;
        this.gameSprites = new Sprite(this.drawContext, "sprites.png", 16,16);
    }

    clear(fillStyle: string = "#0000000") {
        this.drawContext.fillStyle = fillStyle;
        this.drawContext.globalAlpha = 1.0;
        this.drawContext.fillRect(0, 0, this.width, this.height);
    }

    drawRect(x: number, y: number, width: number, height: number, 
        fillStyle: string = "#FFFFFF", 
        strokeStyle: string = "", 
        lineWidth: number = 1, alpha: number = 1.0)
    {
        this.drawContext.fillStyle = fillStyle
        this.drawContext.strokeStyle = strokeStyle;
        this.drawContext.globalAlpha = alpha;
        this.drawContext.lineWidth = lineWidth;

        if(fillStyle && fillStyle != "")
        {
            this.drawContext.fillRect(x, y, width, height);
        }
        if(strokeStyle && strokeStyle != "")
        {
            this.drawContext.strokeRect(x, y, width, height);
        }    
    }

    drawTriangle(x: number, y: number, width: number, height: number, 
        fillStyle: string = "#FFFFFF", 
        strokeStyle: string = "", 
        lineWidth: number = 1, alpha: number = 1.0)
    {
        // https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes    

        this.drawContext.fillStyle = fillStyle
        this.drawContext.strokeStyle = strokeStyle;
        this.drawContext.globalAlpha = alpha;
        this.drawContext.lineWidth = lineWidth;
        this.drawContext.lineCap = "round";

        this.drawContext.beginPath();
        this.drawContext.moveTo(x, y);
        this.drawContext.lineTo(x + width/2, y - height);
        this.drawContext.lineTo(x + width, y);
        this.drawContext.lineTo(x,y);

        this.drawContext.fill();
        if(fillStyle && fillStyle != "")
        {
            this.drawContext.beginPath();
            this.drawContext.moveTo(x, y);
            this.drawContext.lineTo(x + width/2, y - height);
            this.drawContext.lineTo(x + width, y);
            this.drawContext.lineTo(x,y);
            this.drawContext.fill();
        }
        if(strokeStyle && strokeStyle != "")
        {
            this.drawContext.beginPath();
            this.drawContext.moveTo(x, y);
            this.drawContext.lineTo(x + width/2, y - height);
            this.drawContext.moveTo(x + width/2, y - height);
            this.drawContext.lineTo(x + width, y);
            this.drawContext.moveTo(x + width, y);
            this.drawContext.lineTo(x,y);    
            this.drawContext.stroke();
        }    

    }

    print(text: string, x: number, y:number, size: number = 16, 
        fillStyle: string = "#FFFFFF", 
        strokeStyle: string = "",
        strokeWidth: number = 1,
        alpha: number = 1.0)
    {
        this.drawContext.fillStyle = fillStyle
        this.drawContext.strokeStyle = strokeStyle;
        this.drawContext.font = `${size}px sans-serif`;
        this.drawContext.globalAlpha = alpha;
        this.drawContext.lineWidth = strokeWidth;

        if(fillStyle && fillStyle != "")
        {
            this.drawContext.fillText(text, x,y);
        }
        if(strokeStyle && strokeStyle != "")
        {
            this.drawContext.strokeText(text, x, y);
        }    
    }

    drawSprite(index: number, x: number, y: number, alpha: number = 1)
    {
        this.drawContext.globalAlpha = alpha;
        this.gameSprites.draw(index, x, y);
    }
}