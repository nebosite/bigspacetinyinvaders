import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "../views/GameWidget";
import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { EventThing } from "../tools/EventThing";

class Gun {
    heat = 0;
    coolRate = .6;
    overheatLevel = 100;
    shotHeat = 10;
    shotCost = 10;
    shotStageTime_ms = 40;
    charge = 0;
    chargeRate = 25;
    chargeCapacity = 200;
    parent: Player;
    appModel: IAppModel;
    lastShotTime = 0;
    
    constructor(appModel: IAppModel, parent: Player){
        this.appModel = appModel;
        this.parent = parent;
    }

    canShoot(gameTime: number)
    {
        return this.heat < this.overheatLevel // Gun heat limit
            && (gameTime - this.lastShotTime) > this.shotStageTime_ms   // reloading limit
            && this.charge > this.shotCost; // charge limit
    }

    getBullet(gameTime: number)
    {
        this.heat += this.shotHeat;
        this.charge -= this.shotCost;
        this.lastShotTime = gameTime;
        return new Bullet(this.appModel, this.parent);
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {

        let shortRatio = elapsedMilliseconds/1000.0;
        this.heat -= this.heat * this.coolRate * shortRatio;
        
        this.charge += this.chargeRate * shortRatio;
        if(this.charge > this.chargeCapacity) this.charge = this.chargeCapacity;
    }

}

export class Player extends GameObject implements IInputReceiver<PlayerAction>
{
    hitPoints = 1;
    xVelocity = 0;
    xTargetVelocity = 0;
    accelerationRate = 30;
    maxSpeed = 6;
    onShoot = new EventThing<void>("Player.OnShoot");
    onDeath = new EventThing<void>("Player.OnDeath");
    appModel: IAppModel;
    shooting = false;
    gun: Gun;

    lastActivityTime = Date.now();
    name: string = "dude";
    number = 0;
    dyingTime = 0;
    score = 0;
    leftImperativeVelocity = 0;
    rightImperativeVelocity = 0;

    constructor(appModel: IAppModel){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Player;
        this.gun = new Gun(appModel, this);
    }

    actionChanged = (action: PlayerAction, value: number) => {
        if(this.dyingTime > 0) return;
        switch(action)
        {
            case PlayerAction.Left: this.leftImperativeVelocity = value;   break;
            case PlayerAction.Right:  this.rightImperativeVelocity = value;  break;
            case PlayerAction.Fire: this.shooting = value == 1;
        }   
        this.xTargetVelocity = (this.rightImperativeVelocity - this.leftImperativeVelocity) * this.maxSpeed;

        this.lastActivityTime = Date.now();
    };

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        let unit = elapsedMilliseconds / 16;

        let localAcceleration = this.accelerationRate * elapsedMilliseconds/1000;
        if(this.xVelocity < this.xTargetVelocity) 
        {
            this.xVelocity += localAcceleration;
            if(this.xVelocity > this.xTargetVelocity) this.xVelocity = this.xTargetVelocity;
        }

        if(this.xVelocity > this.xTargetVelocity) 
        {
            this.xVelocity -= localAcceleration;
            if(this.xVelocity < this.xTargetVelocity) this.xVelocity = this.xTargetVelocity;
        }
        
        this.x += this.xVelocity * unit;
        if(this.x < this.width/2) this.x = this.width/2;
        if(this.x > this.appModel.worldSize.width - this.width/2) {
            this.x = this.appModel.worldSize.width - this.width/2;
        }

        this.gun.think(gameTime, elapsedMilliseconds); 
        if(this.shooting) this.maybeShoot(gameTime);
        if(Date.now() - this.lastActivityTime > 25000 && !this.shooting)
        {
            this.delete();
        }

        if(this.dyingTime > 0) 
        {
            this.dyingTime -= elapsedMilliseconds;
            if(this.dyingTime <= 0) this.delete();
        }
    }

    maybeShoot(gameTime: number){
        if(!this.gun.canShoot(gameTime)) return;

        var bullet = this.gun.getBullet(gameTime);
        bullet.x = this.x;
        bullet.y = this.y - this.height;
        this.appModel.addGameObject(bullet);
        this.onShoot.invoke();
    }

    doDamage(damageAmount: number, sourceObject: GameObject) {
        this.hitPoints -= damageAmount;
        if(this.hitPoints <= 0)
        {
            this.dyingTime = 1000;
            this.shooting = false;
            this.onDeath.invoke();
        }
    };
}