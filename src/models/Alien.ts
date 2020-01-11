import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { BulletObjectRenderer } from "../views/GameObjectRendering";
import { Player } from "./Player";
import { EventThing } from "../tools/EventThing";


export class Alien extends GameObject{
    appModel: IAppModel;
    localFrame = 0;
    alienType: number;
    hitPoints = 1;
    explosionEnd = 0;
    shootRate = 1;
    onDeath = new EventThing();
    lastShotTime = 0;
    timeBetweenShots = 0;
    shotOrders = 0;

    constructor(appModel: IAppModel, alienType: number){
        super(appModel);
        this.alienType = alienType;
        this.appModel = appModel;
        this.type = GameObjectType.Alien;
        this.width = 16;
        this.height = 16;
        this.shootRate = 1 + alienType * alienType; 
        this.timeBetweenShots = 1000/ this.shootRate;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        if(this.shotOrders > 0 && (gameTime - this.lastShotTime) > this.timeBetweenShots)
        {
            this.lastShotTime = gameTime;
            this.shotOrders--;
            var bullet = new Bullet(this.appModel, this);
            bullet.velocity = -200;
            bullet.x = this.x;
            bullet.y = this.y;
            this.appModel.addGameObject(bullet);
        }

        if(this.hitPoints <= 0 && this.explosionEnd == 0)
        {
            this.explosionEnd = gameTime + 200;
            this.onDeath.invoke();
        }

        if(this.explosionEnd > 0 && this.explosionEnd < gameTime)
        {
            this.delete();
        }
    }

    shoot()
    {
        if(this.hitPoints <= 0) throw new Error("Dead Aliens Can't Shoot");
        this.shotOrders++;
    }

    doDamage(damageAmount: number, sourceObject: GameObject) {
        if(this.hitPoints <= 0) return;
        this.hitPoints -= damageAmount;  
        let bullet = sourceObject as Bullet;
        if(!bullet) return;
        let player = bullet.source as Player;
        if(!player) return;

        if(this.hitPoints <= 0)
        {
            player.score+= 10; // Kill points
        }
        else{
            player.score ++; // Assist points
        }
    }

}