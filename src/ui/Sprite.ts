

export class Sprite {
    spriteWidth: number;
    spriteHeight: number;
    context: CanvasRenderingContext2D;
    imageName: string;
    spritesPerRow: number;
    spriteBuffer: HTMLImageElement;

    constructor(context: CanvasRenderingContext2D, 
        imageName: string, 
        spriteWidth: number, 
        spriteHeight: number) {
        this.spriteWidth = spriteWidth;
        this.spriteHeight = spriteHeight;
        this.context = context;
        this.imageName = imageName;
        this.spriteBuffer = new Image();
        this.spritesPerRow = -1;
        this.spriteBuffer.src = imageName;
    }

    draw(spriteNumber: number, x: number, y: number) {
        if(this.spritesPerRow == -1)
        {
            this.spritesPerRow = Math.floor(this.spriteBuffer.width / this.spriteWidth);
        }
        var spriteX = (spriteNumber % this.spritesPerRow) * this.spriteWidth;
        var spriteY = Math.floor(spriteNumber / this.spritesPerRow) * this.spriteHeight;
        this.context.drawImage(
            this.spriteBuffer, 
            spriteX, spriteY, this.spriteWidth, this.spriteHeight, 
            x, y, this.spriteWidth, this.spriteHeight);
    } 
}