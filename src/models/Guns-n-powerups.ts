import { Bullet } from "./Bullet";
import { IAppModel } from "./AppModel";
import { Player } from "./Player";

export enum GunPowerupType {
    Normal,
    FanShot
}

export interface GunPowerup
{
    type: GunPowerupType;
    shotHeat: number;
    shotCost: number;
    shotStageTime_ms: number;
    consumeShot: (bullet: Bullet) => void;
}

export class GunPowerup_DefaultGun implements GunPowerup
{
    type = GunPowerupType.Normal; 
    shotHeat = 10;
    shotCost = 10;
    shotStageTime_ms = 40;
    consumeShot = (bullet: Bullet) =>{}
}

export class GunPowerup_FanShot implements GunPowerup
{
    type = GunPowerupType.FanShot; 
    shotHeat = 4;
    shotCost = 5;
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

export class Gun {
    heat = 0;
    coolRate = .6;
    overheatLevel = 100;
    charge = 0;
    chargeRate = 25;
    chargeCapacity = 200;
    extraChargeCapacity = 1000;
    parent: Player;
    appModel: IAppModel;
    lastShotTime = 0;
    powerup: GunPowerup = new GunPowerup_DefaultGun();
    photonArmed = false;

    get heatLevel() {
        let returnMe = (this.overheatLevel - this.heat)/this.overheatLevel;
        return 1 - Math.max(0, Math.min(1, returnMe));
    }
    
    get chargeLevel() {
        let returnMe = (this.chargeCapacity - this.charge)/this.chargeCapacity;
        return 1 - Math.max(0, Math.min(1, returnMe));
    }
    
    get extraChargeLevel() {
        if(this.charge <= this.chargeCapacity) return 0;

        let returnMe = (this.extraChargeCapacity - (this.charge - this.chargeCapacity))/this.extraChargeCapacity;
        return 1 -  Math.max(0, Math.min(1, returnMe));
    }
    
    constructor(appModel: IAppModel, parent: Player){
        this.appModel = appModel;
        this.parent = parent;
    }

    addCharge(ammount: number)
    {
        const totalCapacity = this.extraChargeCapacity + this.chargeCapacity
        if(this.charge >= totalCapacity) return false;
        this.charge += ammount;
        if(this.charge > totalCapacity) this.charge = totalCapacity;
        return true;
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
