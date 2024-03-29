import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { BulletObjectRenderer } from "../views/GameObjectRendering";
import { Player } from "./Player";
import { EventThing } from "../tools/EventThing";
import { Debris, DebrisType } from "./Debris";
import { Vector2D } from "../tools/Vector2D";
import { ShieldBlock } from "./ShieldBlock";
import { GameAnimation } from "src/tools/GameAnimation";
import { DrawnImage } from "src/ui/DrawHelper";


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
    damage = 0;
    flyingIn = false;
    formationLocation = new Vector2D(0,0);
    killSelf = false;

    constructor(appModel: IAppModel, alienType: number){
        super(appModel);
        this.alienType = alienType;
        this.appModel = appModel;
        this.type = GameObjectType.Alien;
        this.width = 11;
        this.height = 10;
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
        super.think(gameTime, elapsedMilliseconds);
        // Shoot if we have an order to shot and it has been long enough
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

        if(!this.flyingIn) 
        {
            this.x = this.formationLocation.x;
            this.y = this.formationLocation.y;
        }

        if(this.y > this.appModel.shieldTop) 
        {
            this.appModel.hitTest(this, (target) =>
            {
                target.doDamage(this);
                return true;
            });
        }

        if(this.killSelf) this.die();
    }

    addFlyinAnimation(animation: GameAnimation)
    {
        this.flyingIn = true;
        animation.OnAnimationComplete.subscribe("AF", () => {
            this.flyingIn = false;
            this.removeAnimation(animation); 
        } );
        this.animations.push(animation);
    }

    shoot()
    {
        if(this.hitPoints <= 0) throw new Error("Dead Aliens Can't Shoot");
        this.shotOrders++;
    }

    die()
    {
        this.hitPoints = 0;
        if(Math.random() < .025) 
        {
            let debrisType = DebrisType.PhotonTorpedo;
            if(Math.random() < .1) debrisType = DebrisType.Powerup_Fanshot;
            let specialDebris = new Debris(this.appModel, debrisType);
            specialDebris.x = this.x;
            specialDebris.y = this.y;
            this.appModel.addGameObject(specialDebris);
        }            if(Math.random() < .05) 

        for(let i = 0; i < 3; i++)
        {
            if(Math.random() < .05)
            {
                let bigDebris = new Debris(this.appModel, DebrisType.Big);
                bigDebris.x = this.x;
                bigDebris.y = this.y;
                this.appModel.addGameObject(bigDebris);
            }
        }
        for(let i = 0; i < 10; i++)
        {
            if(Math.random() < .1)
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

    doDamage(sourceObject: GameObject) {
        if(this.hitPoints <= 0) return;

        if(sourceObject.type == GameObjectType.ShieldBlock)
        {
            this.appModel.onHitObject?.invoke({gameObject: this, damage: this.hitPoints});
            this.hitPoints = 0;
        }

        else if(sourceObject.type == GameObjectType.Bullet) 
        {
            let bullet = sourceObject as Bullet;
            let player = bullet.source as Player;
            this.hitPoints -= bullet.power;
            let localDamage = bullet.power;
            this.damage += bullet.power;
            if(this.hitPoints <= 0) bullet.power = -this.hitPoints;  
            else bullet.power = 0;

            this.appModel.onHitObject?.invoke({gameObject: this, damage: localDamage});

            // I'm dead, so turn me into debris
            if(this.hitPoints <= 0)
            {
                player.score+= 10; // Kill points
            }
            else{
                player.score ++; // Assist points
            }
        }

        if(this.hitPoints <= 0)
        {
            this.die();
        }    
    }



}