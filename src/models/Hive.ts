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
    memberCount: number = 0;
    speed = 1.0;


    constructor(appModel: IAppModel, level: number){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Hive;
        this.width = 1;
        this.height = 1;
        this.hiveLevel = level;
    }

    addMember(alien: Alien)
    {
        this.memberCount++;
        this._members.push(alien);
        alien.onDeath.subscribe("removeFromHive", () => {
            this._members.splice(this._members.indexOf(alien),1);
            if(this._members.length === 0)
            {
                this.delete();
            }
        });
    }

    kill(count: number)
    {
        const stuff = this._members;

        for(let i = 0; i < count; i++)
        {
            const index = Math.floor(Math.random() * stuff.length)
            if(stuff[index].type == GameObjectType.Alien)
            {
                (stuff[index] as Alien).killSelf = true;
            }
        }      
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        super.think(gameTime, elapsedMilliseconds);
        if(this.descend > 0)
        {
            this.descend-= this.hiveYVelocity;
            this._members.forEach( member => {
                member.formationLocation.y += this.hiveYVelocity;
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
        let timeRatio = elapsedMilliseconds/ 1000.0;
        let bulletCacheNumber = (this.hiveLevel * 30 + 80);
        if(this.hiveLevel == 1) bulletCacheNumber = 40;
        this.bulletCache += timeRatio * (bulletCacheNumber * (this._members.length + this.memberCount * .1)) / this.memberCount;
        this.nextTick = gameTime + ((1.0 / this.speed) * this.tickSpan * this._members.length) / this.memberCount;

        let shouldReverse = false;
        this._members.forEach( member => {
            member.formationLocation.x += this.hiveXVelocity;
            member.localFrame++;
            if(member.formationLocation.x > this.appModel.worldSize.width - member.width 
                || member.formationLocation.x < member.width)
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