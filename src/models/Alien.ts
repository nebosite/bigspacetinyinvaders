import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { BulletObjectRenderer } from "../views/GameObjectRendering";
import { Player } from "./Player";
import { EventThing } from "../tools/EventThing";
import { Debris, DebrisType } from "./Debris";
import { Vector2D } from "../tools/Vector2D";


export class Alien extends GameObject{
    appModel: IAppModel;
    localFrame = 0;
    alienType: number;
    hitPoints = 1;
    explosionEnd = 0;
    shootRate = 1;
    onDeath = new EventThing<void>("Alien.OnDeath");
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

        switch(alienType)
        {
            case 0: this.hitPoints = 10; break;
            case 1: this.hitPoints = 20; break;
            case 2: this.hitPoints = 30; break;
        }
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        if(this.shotOrders > 0 && (gameTime - this.lastShotTime) > this.timeBetweenShots)
        {
            this.lastShotTime = gameTime;
            this.shotOrders--;
            var bullet = new Bullet(this.appModel, this);
            bullet.velocity = new Vector2D(0,200);
            bullet.x = this.x;
            bullet.y = this.y;
            this.appModel.addGameObject(bullet);
        }
    }

    shoot()
    {
        if(this.hitPoints <= 0) throw new Error("Dead Aliens Can't Shoot");
        this.shotOrders++;
    }

    doDamage(sourceObject: GameObject) {
        if(this.hitPoints <= 0) return;
        let bullet = sourceObject as Bullet;
        if(!bullet) return;
        let player = bullet.source as Player;
        if(!player) return;

        this.hitPoints -= bullet.power;
        if(this.hitPoints <= 0) bullet.power = -this.hitPoints;  
        else bullet.power = 0;

        if(this.hitPoints <= 0)
        {
            player.score+= 10; // Kill points
            if(Math.random() < .2) 
            {
                let debrisType = DebrisType.DeadShip;
                if(Math.random() < .2) debrisType = DebrisType.Powerup_Fanshot;
                let specialDebris = new Debris(this.appModel, debrisType);
                specialDebris.x = this.x;
                specialDebris.y = this.y;
                this.appModel.addGameObject(specialDebris);
            }            if(Math.random() < .05) 

            for(let i = 0; i < 3; i++)
            {
                if(Math.random() < .1)
                {
                    let bigDebris = new Debris(this.appModel, DebrisType.Big);
                    bigDebris.x = this.x;
                    bigDebris.y = this.y;
                    this.appModel.addGameObject(bigDebris);
                }
            }
            for(let i = 0; i < 10; i++)
            {
                if(Math.random() < .3)
                {
                    let smallDebris = new Debris(this.appModel, DebrisType.Small);
                    smallDebris.x = this.x;
                    smallDebris.y = this.y;
                    this.appModel.addGameObject(smallDebris);
                }
            }
           
            this.onDeath.invoke();
            this.delete();
        }
        else{
            player.score ++; // Assist points
        }
    }

}