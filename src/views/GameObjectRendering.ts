import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnSprite } from "../ui/DrawHelper";
import { GameObject, GameObjectType } from "../models/GameObject";
import { Player } from "../models/Player";
import { Bullet } from "../models/Bullet";
import { Alien } from "../models/Alien";
import { ShieldBlock } from "../models/ShieldBlock";
import { SoundHelper } from "../ui/SoundHelper";

export class GameObjectRenderer
{
    gameObject: GameObject;
    drawnObject: DrawnObject;
    sound: SoundHelper;

    constructor(gameObject: GameObject, drawnObject: DrawnObject, sound: SoundHelper){
        this.gameObject = gameObject;
        this.drawnObject = drawnObject;
        this.sound = sound;
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

    constructor(gameObject: Player, drawing: DrawHelper, sound: SoundHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/ship", gameObject.number % 10, gameObject.x, gameObject.y) as DrawnObject, sound);

        this.playerName = drawing.addTextObject(gameObject.name, gameObject.x, gameObject.y + 10, 10, 0xffffff, 0x0, 0, 300, [.5, 0]);

        gameObject.onShoot.subscribe("playShotSound", () => sound.play("sounds/player_shot.wav"));
        gameObject.onDeath.subscribe("playPlayerDeathSound", () => sound.play("sounds/player_death.wav"));
    }

    render(){
        super.render();
        if(!this.playerName) return;
        this.playerName.x = this.gameObject.x;
        this.playerName.y = this.gameObject.y + 10;
        let player = this.gameObject as Player;
        if(player)
        {
            if(player.dyingTime > 0)
            {
                this.drawnObject.rotation += .4;
            }
        }
    };

    delete() {
        super.delete();
        this.playerName?.delete();
    } 
}

export class BulletObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: Bullet, drawing: DrawHelper, sound: SoundHelper) 
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/bullet", BulletObjectRenderer.getBullentTextureIndex(gameObject), gameObject.x, gameObject.y) as DrawnObject, 
            sound);
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
    constructor(gameObject: Alien, drawing: DrawHelper, sound: SoundHelper)
    { 
        super(gameObject,
            drawing.addSpriteObject("sprites/alien", gameObject.alienType * 2, gameObject.x, gameObject.y) as DrawnObject, 
            sound);

        gameObject.onDeath.subscribe("playDeathSound", ()=> sound.play("sounds/alien_die.wav"));
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
    constructor(gameObject: ShieldBlock, drawing: DrawHelper, sound: SoundHelper) 
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/brick", Math.max(7 - gameObject.hitPoints, 0), gameObject.x-2, gameObject.y-2, 1, [0,0]) as DrawnObject, 
            sound);
    }

    render(){
        super.render();
        if(!this.drawnObject) return;
        let block = this.gameObject as ShieldBlock;
        let textureFrame = Math.max(7 - block.hitPoints, 0);
        (this.drawnObject as DrawnSprite).textureFrame = textureFrame;
    };

}

