import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "../views/GameController";
import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { EventThing } from "../tools/EventThing";

export class Player extends GameObject implements IInputReceiver<PlayerAction>
{
    hitPoints = 1;
    xVelocity = 0;
    xTargetVelocity = 0;
    accelerationRate = 30;
    maxSpeed = 6;
    shootRate = 5;
    onShoot = new EventThing();
    onDeath = new EventThing();
    appModel: IAppModel;
    shooting = false;
    lastShotTime = 0;
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

        if(this.shooting) this.maybeShoot();
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

    maybeShoot(){
        let millisecondsSinceLastShot = Date.now() - this.lastShotTime;
        let timeBetweenShots = 1000/this.shootRate;
        if(millisecondsSinceLastShot < timeBetweenShots) return;
        this.lastShotTime= Date.now();
        var bullet = new Bullet(this.appModel, this);
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