import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Alien } from "./Alien";


export class Hive extends GameObject{
    appModel: IAppModel;
    private _members = new Array<Alien>();
    hiveXVelocity = 4;
    hiveYVelocity = 2;
    descend = 0;
    nextTick = 0;
    tickSpan = 1000;
    bulletCache = 0;
    hiveLevel = 1;
    hiveSize: number;

    constructor(appModel: IAppModel, hiveSize: number){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Hive;
        this.width = 1;
        this.height = 1;
        this.hiveSize = hiveSize;
    }

    addMember(alien: Alien)
    {
        this._members.push(alien);
        alien.onDeath.subscribe("removeFromHive", () => this._members.splice(this._members.indexOf(alien),1));
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        if(this.descend > 0)
        {
            this.descend-= this.hiveYVelocity;
            this._members.forEach( member => {
                member.y += this.hiveYVelocity;
            });
            return;
        }

        if(this.bulletCache > 0)
        {
            this.bulletCache--;
            let alien = this._members[Math.floor(Math.random() * this._members.length)] as Alien;
            if(alien.hitPoints > 0)  alien.shoot();
        }

        if(gameTime < this.nextTick) return;
        this.bulletCache += Math.ceil(((this.hiveLevel + 2) * this._members.length) / this.hiveSize);
        this.nextTick = gameTime + (this.tickSpan * this._members.length) / this.hiveSize;

        let shouldReverse = false;
        this._members.forEach( member => {
            member.x += this.hiveXVelocity;
            member.localFrame++;
            if(member.x > this.appModel.worldSize.width - member.width 
                || member.x < member.width)
            {
                shouldReverse = true;
            }
        });

        if(shouldReverse)
        {
             this.hiveXVelocity *= -1;
             this.descend = 20;
        }

    }
}