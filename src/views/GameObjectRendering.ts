import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnSprite, DrawnContainer } from "../ui/DrawHelper";
import { GameObject, GameObjectType } from "../models/GameObject";
import { Player } from "../models/Player";
import { Bullet } from "../models/Bullet";
import { Alien } from "../models/Alien";
import { ShieldBlock } from "../models/ShieldBlock";
import { SoundHelper } from "../ui/SoundHelper";
import { Debris } from "../models/Debris";

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
        gameObject.onBirth.subscribe("playerEntrySound", () => sound.play("sounds/player_entrance.mp3"));
        gameObject.onBirth.invoke();
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
    constructor(gameObject: Bullet, drawing: DrawHelper, sound: SoundHelper) 
    {
        super(gameObject,
            drawing.addContainer(gameObject.x, gameObject.y, 1, 1, 1),
            sound);
        
        let container = this.drawnObject as DrawnContainer;
        let glow = drawing.addImageObject(
            "img/glow.png", 
            0,0, .2) ;
        let scale = 256/drawing.height * .4;
        glow.scale = [scale,scale];
        container.addChild(glow);

        container.addChild(drawing.addSpriteObject(
            "sprites/bullet", 
            BulletObjectRenderer.getBullentTextureIndex(gameObject), 
            0,0));
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

export class DebrisObjectRenderer extends GameObjectRenderer
{
    flashRate = Math.random()/100 + 1;

    static spriteNames = [
        "sprites/deadship",
        "sprites/bigdebris",
        "sprites/smalldebris",
        "sprites/powerup_fanshot",
    ]
    constructor(gameObject: Debris, drawing: DrawHelper, sound: SoundHelper)
    { 
        super(
            gameObject,
            drawing.addSpriteObject(
                DebrisObjectRenderer.spriteNames[gameObject.debrisType],0, gameObject.x, gameObject.y) as DrawnObject, 
            sound);

        //gameObject.onDeath.subscribe("playDeathSound", ()=> sound.play("sounds/alien_die.wav"));
    }

    render(){
        super.render();
        if(!this.drawnObject) return;
        let debris = this.gameObject as Debris;
        let textureFrame =  Math.floor((Date.now() / 100 / this.flashRate) % 5);
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

