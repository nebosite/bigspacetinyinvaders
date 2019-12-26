

export class Sprite {
    _spriteWidth: number;
    _spriteHeight: number;
    _context: CanvasRenderingContext2D;
    _imageName: string;
    _spritesPerRow: number;
    _spriteBuffer: HTMLImageElement;

    constructor(context: CanvasRenderingContext2D, 
        imageName: string, 
        spriteWidth: number, 
        spriteHeight: number) {
        this._spriteWidth = spriteWidth;
        this._spriteHeight = spriteHeight;
        this._context = context;
        this._imageName = imageName;
        this._spriteBuffer = new Image();
        this._spritesPerRow = -1;
        this._spriteBuffer.src = imageName;
    }

    draw(spriteNumber: number, x: number, y: number) {
        if(this._spritesPerRow == -1)
        {
            this._spritesPerRow = Math.floor(this._spriteBuffer.width / this._spriteWidth);
        }
        var spriteX = (spriteNumber % this._spritesPerRow) * this._spriteWidth;
        var spriteY = Math.floor(spriteNumber / this._spritesPerRow) * this._spriteHeight;
        this._context.drawImage(this._spriteBuffer, spriteX, spriteY, this._spriteWidth, this._spriteHeight, x, y, this._spriteWidth, this._spriteHeight);
    } 
}