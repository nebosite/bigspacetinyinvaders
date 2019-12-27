
export class NewPlayerControl 
{
    drawContext: CanvasRenderingContext2D;
    width = 500;
    height = 500;
    
    constructor(drawContext: CanvasRenderingContext2D)
    {
        this.drawContext = drawContext;
    }

    render = () =>
    {
        this.drawContext.fillStyle = "#99000000"
        this.drawContext.fillRect(0, 0, this.width, this.height);       
    };
}