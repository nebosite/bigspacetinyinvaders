import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnSprite, DrawnContainer, DrawnText, DrawnImage } from "../ui/DrawHelper";
import { GameObject, GameObjectType } from "../models/GameObject";
import { Player } from "../models/Player";
import { Bullet, BulletType } from "../models/Bullet";
import { Alien } from "../models/Alien";
import { ShieldBlock } from "../models/ShieldBlock";
import { SoundHelper } from "../ui/SoundHelper";
import { Debris } from "../models/Debris";
import { Spark } from "src/models/Spark";

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

class PhotonTorpedo{
    photonTorpedo: DrawnImage;

    constructor(drawing: DrawHelper)
    {
        this.photonTorpedo = drawing.addImageObject( "img/photontorpedo.png", 0,0, 0) ;
    }

    render(x: number, y: number, alpha: number){
        this.photonTorpedo.rotation = Math.random() * Math.PI * 2;
        const scale = .1 +  Math.random() * .05 
        this.photonTorpedo.scale = [scale, scale];
        this.photonTorpedo.x = x;
        this.photonTorpedo.y = y;
        this.photonTorpedo.alpha = alpha;       
    }

    delete() {
        this.photonTorpedo.delete();
    }
}

export class PlayerObjectRenderer extends GameObjectRenderer
{
    playerName: DrawnObject;
    gunHeat: DrawnVectorObject;
    charge: DrawnVectorObject;
    extraCharge: DrawnVectorObject;
    score: DrawnText;
    photonTorpedo: PhotonTorpedo;

    constructor(gameObject: Player, drawing: DrawHelper, sound: SoundHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/ship", gameObject.number % 10, gameObject.x, gameObject.y) as DrawnObject, sound);

        this.playerName = drawing.addTextObject(gameObject.name, gameObject.x, gameObject.y + 10, 12, 0xffffff, 0x0, 0, 300, [.5, 0]);
        this.gunHeat = drawing.addRectangleObject(0,0,20,2,0xFF4444);
        this.charge = drawing.addRectangleObject(0,0,20,2,0x4444FF);
        this.extraCharge = drawing.addRectangleObject(0,0,20,2,0x4444FF);
        this.score = drawing.addTextObject(gameObject.name, gameObject.x, gameObject.y + 10, 12, 0xaaaaaa, 0x0, 0, 300, [.5, 0]);
        this.photonTorpedo = new PhotonTorpedo(drawing);
        
        gameObject.onShoot.subscribe("playShotSound", (bullet) => sound.play("sounds/player_shot.wav"));
        gameObject.onDeath.subscribe("playPlayerDeathSound", () => sound.play("sounds/player_death.wav"));
        gameObject.onBirth.subscribe("playerEntrySound", () => sound.play("sounds/player_entrance.mp3"));
        gameObject.onBirth.invoke();
    }

    render(){
        super.render();

        const player = this.gameObject as Player;
        this.playerName.x = player.x;
        this.playerName.y = player.y + 9;
        
        this.gunHeat.x = player.x - 10;
        this.gunHeat.y = player.y + 23;
        this.gunHeat.width = 20 * player.gun.heatLevel;
        
        this.charge.x = player.x - 10;
        this.charge.y = player.y + 26;
        this.charge.width = 20 * player.gun.chargeLevel;
        
        this.extraCharge.x = player.x - 10;
        this.extraCharge.y = player.y + 29;
        this.extraCharge.width = 20 * player.gun.extraChargeLevel;
       
        this.score.x = player.x;
        this.score.y = player.y + 30;
        this.score.text = player.score.toString();

        this.photonTorpedo.render(player.x, player.y - 8, player.gun.photonArmed ? 1.0 : 0)
    };

    delete() {
        super.delete();
        this.playerName?.delete();
        this.gunHeat?.delete();
        this.charge?.delete();
        this.extraCharge?.delete();
        this.score?.delete();
        this.photonTorpedo?.delete();
    } 
}

export class BulletObjectRenderer extends GameObjectRenderer
{
    photonTorpedo: PhotonTorpedo | null = null;
    constructor(gameObject: Bullet, drawing: DrawHelper, sound: SoundHelper) 
    {
        super(gameObject,
            drawing.addContainer(gameObject.x, gameObject.y, 1, 1, 1),
            sound);
        
        switch(gameObject.bulletType){
            case BulletType.Standard:
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
                break;
            case BulletType.PhotonTorpedo:
                this.drawnObject.delete();
                this.photonTorpedo = new PhotonTorpedo(drawing);
                break;
        }

        
    }

    render(){
        super.render();

        this.photonTorpedo?.render(this.gameObject.x, this.gameObject.y, 1.0)
    };

    delete() {
        super.delete();
        this.photonTorpedo?.delete();
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

export class SparkObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: Spark, drawing: DrawHelper, sound: SoundHelper) 
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/spark", 0, gameObject.x, gameObject.y) as DrawnObject,
            sound);
    }

    render()
    {
        (this.drawnObject as DrawnSprite).alpha = (this.gameObject as Spark).power;
        super.render();
    }
}

export class AlienObjectRenderer extends GameObjectRenderer
{
    alienBody: DrawnSprite;
    damageOverlay: DrawnSprite | null = null;
    drawing: DrawHelper;

    constructor(gameObject: Alien, drawing: DrawHelper, sound: SoundHelper)
    { 
        super(gameObject,
            drawing.addContainer(gameObject.x, gameObject.y, 1, 1, 1),
            sound);

        this.drawing = drawing;
        let container = this.drawnObject as DrawnContainer;
        this.alienBody = drawing.addSpriteObject("sprites/alien", gameObject.alienType * 2, 0,0);
        container.addChild(this.alienBody);

        gameObject.onDeath.subscribe("playDeathSound", ()=> sound.play("sounds/alien_die.wav"));
    }

    render(){
        super.render();
        if(!this.drawnObject) return;
        let alien = this.gameObject as Alien;
        if(alien.damage > 0) {
            if(!this.damageOverlay)
            {
                this.damageOverlay = this.drawing.addSpriteObject("sprites/alien_damage", Math.floor(Math.random() * 2), 0,0);
                (this.drawnObject as DrawnContainer).addChild(this.damageOverlay);
            }
        }
        let textureFrame =  alien.alienType * 2 + alien.localFrame % 2;
        if (alien.hitPoints <= 0) textureFrame = 6;
        if(textureFrame !== this.alienBody.textureFrame) 
        {
            this.alienBody.textureFrame = textureFrame;
        }
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

