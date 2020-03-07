import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { EventThing } from "../tools/EventThing";
import { Debris, DebrisType } from "./Debris";
import { IPlayerActionReceiver } from "../tools/ButtonEventTranslator";

export enum PlayerAction {
    None,
    Up,
    Left,
    Right,
    Down,
    Fire
}

interface GunPowerup
{
    shotHeat: number;
    shotCost: number;
    shotStageTime_ms: number;
    consumeShot: (bullet: Bullet) => void;
}

class GunPowerup_DefaultGun implements GunPowerup
{
    shotHeat = 10;
    shotCost = 10;
    shotStageTime_ms = 40;
    consumeShot = (bullet: Bullet) =>{}
}

class GunPowerup_FanShot implements GunPowerup
{
    shotHeat = 2;
    shotCost = 1;
    shotStageTime_ms = 20;
    totalShots = 400;
    playerGun: Gun;
    theta = 0;

    constructor(gun: Gun)
    {
        this.playerGun = gun;
    }

    consumeShot = (bullet: Bullet) =>
    {
        this.totalShots--;
        if(this.totalShots <= 0)
        {
            this.playerGun.powerup = new GunPowerup_DefaultGun();
        }
        this.theta += .5;
        bullet.velocity.x += (Math.cos(this.theta)) * 50;
        bullet.velocity.y *= 1.5;
    }
}

class Gun {
    heat = 0;
    coolRate = .6;
    overheatLevel = 100;
    charge = 0;
    chargeRate = 25;
    chargeCapacity = 200;
    parent: Player;
    appModel: IAppModel;
    lastShotTime = 0;
    powerup: GunPowerup = new GunPowerup_DefaultGun();
    
    constructor(appModel: IAppModel, parent: Player){
        this.appModel = appModel;
        this.parent = parent;
    }

    canShoot(gameTime: number)
    {
        return this.heat < this.overheatLevel // Gun heat limit
            && (gameTime - this.lastShotTime) > this.powerup.shotStageTime_ms   // reloading limit
            && this.charge > this.powerup.shotCost; // charge limit
    }

    getBullet(gameTime: number)
    {
        this.heat += this.powerup.shotHeat;
        this.charge -= this.powerup.shotCost;
        this.lastShotTime = gameTime;
        let bullet = new Bullet(this.appModel, this.parent);
        this.powerup.consumeShot(bullet);
        return bullet;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {

        let shortRatio = elapsedMilliseconds/1000.0;
        this.heat -= this.heat * this.coolRate * shortRatio;
        
        if(this.charge < this.chargeCapacity){
            this.charge += this.chargeRate * shortRatio;
        }
    }

}

export class Player extends GameObject implements IPlayerActionReceiver
{
    hitPoints = 1;
    xVelocity = 0;
    xTargetVelocity = 0;
    accelerationRate = 30;
    maxSpeed = 6;
    onShoot = new EventThing<void>("Player.OnShoot");
    onDeath = new EventThing<void>("Player.OnDeath");
    onBirth = new EventThing<void>("Player.OnBirth");
    appModel: IAppModel;
    shooting = false;
    gun: Gun;
    isDead = false;
    entranceTimeLeft_ms = 0;
    entranceTime_ms = 2000;
    yEntranceTarget = 0;

    lastActivityTime = Date.now();
    name: string = "dude";
    number = 0;
    score = 0;
    leftImperativeVelocity = 0;
    rightImperativeVelocity = 0;

    constructor(appModel: IAppModel){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Player;
        this.width = 16;
        this.height = 16;
        this.gun = new Gun(this.appModel, this);
        this.regenerate();
    }

    regenerate() {
        this.isDead = false;
        this.x = this.appModel.worldSize.width/2;
        this.gun.powerup = new GunPowerup_DefaultGun();
        this.score = 0;
        this.leftImperativeVelocity = 0;
        this.rightImperativeVelocity = 0;
        this.hitPoints = 1;
        this.xVelocity = 0;
        this.xTargetVelocity = 0;
        this.accelerationRate = 30;
        this.maxSpeed = 6;
        this.entranceTimeLeft_ms = this.entranceTime_ms;
        this.onBirth?.invoke();
    }

    actionChanged = (action: PlayerAction, value: number) => {
        if(this.isDead) this.regenerate();
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
        if(this.isDead) return;
        if(this.entranceTimeLeft_ms >= 0)
        {
            this.entranceTimeLeft_ms -= elapsedMilliseconds;
            if(this.entranceTime_ms < 0) this.entranceTime_ms = 0;
            this.y = this.yEntranceTarget + 60.0 * this.entranceTimeLeft_ms / this.entranceTime_ms;
            return;
        }
        let unit = elapsedMilliseconds / 16;

        let timeRatio = elapsedMilliseconds/1000;
        let localAcceleration = this.accelerationRate * timeRatio;

        if(Math.sign(this.xTargetVelocity) != Math.sign(this.xVelocity))
        {
            this.xVelocity *= (1 - 1.5 * timeRatio);
        }

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

        
        let stepSize = 2;
        let steps = Math.floor(Math.abs(this.xVelocity) / stepSize) + 1;
        let xStep = this.xVelocity / steps;
        for(let i = 0; i < steps; i++){
            this.x += xStep * unit;
            if(this.x < this.width/2) this.x = this.width/2;
            if(this.x > this.appModel.worldSize.width - this.width/2) {
                this.x = this.appModel.worldSize.width - this.width/2;
            }
            let collisionTarget = this.appModel.hitTest(this);
            if(collisionTarget)
            {
                if(collisionTarget.type == GameObjectType.Debris)
                {
                    let debris = collisionTarget as Debris;
                    switch(debris.debrisType)
                    {
                        case DebrisType.Powerup_Fanshot: this.gun.powerup = new GunPowerup_FanShot(this.gun); break;
                        case DebrisType.DeadShip: this.gun.charge += 100; break;
                        case DebrisType.Big: this.gun.charge += 20; break;
                        case DebrisType.DeadShip: this.gun.charge += 5; break;
                    }
                    debris.delete();
                }
            }

        }

        this.gun.think(gameTime, elapsedMilliseconds); 
        if(this.shooting) this.maybeShoot(gameTime);
        // if(Date.now() - this.lastActivityTime > 25000 && !this.shooting)
        // {
        //     this.delete();
        // }
    }

    maybeShoot(gameTime: number){
        if(!this.gun.canShoot(gameTime)) return;

        var bullet = this.gun.getBullet(gameTime);
        bullet.x = this.x;
        bullet.y = this.y - this.height;
        this.appModel.addGameObject(bullet);
        this.onShoot.invoke();
    }

    doDamage(sourceObject: GameObject) {
        let bullet = sourceObject as Bullet
        if(!bullet) return;

        this.hitPoints -= bullet.power;
        if(this.hitPoints <= 0) bullet.power = -this.hitPoints;  
        else bullet.power = 0;

        if(this.hitPoints <= 0)
        {
            for(let i = 0; i < 40; i++)
            {
                let type = Math.floor(Math.random() * 2) + 1
                let debris = new Debris(this.appModel, type);
                debris.x = this.x + Math.random() * this.width - this.width/2;
                debris.y = this.y-this.height/4;
                debris.velocity[0] *= 4;
                debris.velocity[1] *= 1.5;
                this.appModel.addGameObject(debris);
            }

            this.shooting = false;
            this.isDead = true;
            this.x = -10000
            this.onDeath.invoke();
        }
    };
}