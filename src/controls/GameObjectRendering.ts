import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnSprite } from "../ui/DrawHelper";
import { GameObject, GameObjectType } from "../models/GameObject";
import { Player } from "../models/Player";
import { Bullet } from "../models/Bullet";
import { Alien } from "../models/Alien";
import { ShieldBlock } from "../models/ShieldBlock";

export class GameObjectRenderer
{
    gameObject: GameObject;
    drawnObject: DrawnObject;

    constructor(gameObject: GameObject, drawnObject: DrawnObject){
        this.gameObject = gameObject;
        this.drawnObject = drawnObject;
    }

    render(){
        if(!this.drawnObject) return;
        this.drawnObject.x = this.gameObject.x;
        this.drawnObject.y = this.gameObject.y;
    };

    delete() {
        this.drawnObject?.delete();
    }
}

export class PlayerObjectRenderer extends GameObjectRenderer
{
    playerName: DrawnObject;

    constructor(gameObject: Player, drawing: DrawHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/ship", gameObject.number % 10, gameObject.x, gameObject.y) as DrawnObject);

        this.playerName = drawing.addTextObject(gameObject.name, gameObject.x, gameObject.y + 10, 12, "#ffffff", "", 0, 300, [.5, 0]);
    }

    render(){
        super.render();
        if(!this.playerName) return;
        this.playerName.x = this.gameObject.x;
        this.playerName.y = this.gameObject.y + 10;
    };

    delete() {
        super.delete();
        this.playerName?.delete();
    } 
}

export class BulletObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: Bullet, drawing: DrawHelper) 
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/bullet", BulletObjectRenderer.getBullentTextureIndex(gameObject), gameObject.x, gameObject.y) as DrawnObject);
    }

    static getBullentTextureIndex(bullet: Bullet)
    {   
        var type = bullet.source.type;
        switch(type)
        {
            case GameObjectType.Player : return 0;
            default: return 1;
        }
    }
}

export class AlienObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: Alien, drawing: DrawHelper)
    { 
        super(gameObject,
            drawing.addSpriteObject("sprites/alien", gameObject.alienType * 2, gameObject.x, gameObject.y) as DrawnObject);
    }

    render(){
        super.render();
        if(!this.drawnObject) return;
        let alien = this.gameObject as Alien;
        let textureFrame =  alien.alienType * 2 + alien.localFrame % 2;
        if (alien.hitPoints <= 0) textureFrame = 6;
        (this.drawnObject as DrawnSprite).textureFrame = textureFrame;
    };

}

export class ShieldBlockObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: ShieldBlock, drawing: DrawHelper) 
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/brick", Math.max(7 - gameObject.hitPoints, 0), gameObject.x-2, gameObject.y-2, 1, [0,0]) as DrawnObject);
    }

    render(){
        super.render();
        if(!this.drawnObject) return;
        let block = this.gameObject as ShieldBlock;
        let textureFrame = Math.max(7 - block.hitPoints, 0);
        (this.drawnObject as DrawnSprite).textureFrame = textureFrame;
    };

}

