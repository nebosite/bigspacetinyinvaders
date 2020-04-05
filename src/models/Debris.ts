import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { BulletObjectRenderer } from "../views/GameObjectRendering";
import { Player } from "./Player";
import { EventThing } from "../tools/EventThing";
import { GLOBALS } from "../globals";

export enum DebrisType
{
    PhotonTorpedo = 0,
    Big = 1,
    Small = 2,
    Powerup_Fanshot = 3,
}

export class Debris extends GameObject{
    appModel: IAppModel;
    localFrame = 0;
    velocity: [number,number] = [0,0]
    debrisType: DebrisType;
    onDeath = new EventThing<void>("Debris.OnDeath");
    landed = false;
    hitProbability  = 0.1;

    constructor(appModel: IAppModel, debrisType: number){
        super(appModel);
        this.debrisType = debrisType;
        this.appModel = appModel;
        this.type = GameObjectType.Debris;
        this.velocity = [
            (Math.random() - 0.5) * 40,
            Math.random() * -100,
        ];

        this.width = 16;
        this.height = 16;
        switch(debrisType)
        {
            case DebrisType.PhotonTorpedo:
                this.width = 12;
                this.height = 12;
                break;
            case DebrisType.Big:
                this.width = 2;
                this.height = 2;
                break;
            case DebrisType.Small:
                this.width = 1;
                this.height = 1;
                break;
        }
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        super.think(gameTime, elapsedMilliseconds);
        if(!this.landed)
        {
            let timeFraction = elapsedMilliseconds/1000.0;
            this.velocity[1] += GLOBALS.gravity * timeFraction;
            this.velocity[0] *= 1 - (0.02 * timeFraction);
            this.x += this.velocity[0] * timeFraction;
            this.y += this.velocity[1] * timeFraction;

            if(this.x < 0 || this.x > this.appModel.worldSize.width) this.delete();
            if(this.y > this.appModel.worldSize.height - GLOBALS.DEBRIS_Y)
            {
                this.y  = this.appModel.worldSize.height - GLOBALS.DEBRIS_Y;
                this.velocity[1] *= -.2;
                if(Math.abs(this.velocity[1]) < .2) {
                    this.landed = true;
                    this.y -= this.height/4 - Math.random() * 5;
                }
            }
        }

    }

    doDamage(sourceObject: GameObject) {
        if(sourceObject.type != GameObjectType.Bullet) return;
        let bullet = sourceObject as Bullet

        // don't let aliens shoot debris
        if(bullet.source.type == GameObjectType.Alien ) return;

        // Only let debris get hit sometimes
        if(Math.random() < this.hitProbability)
        {
            bullet.power--;
            this.appModel.onHitObject?.invoke({gameObject: this, damage: 1});
            this.delete();            
        }
    }
}