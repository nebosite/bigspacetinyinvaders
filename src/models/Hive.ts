import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Alien } from "./Alien";


export class Hive extends GameObject{
    appModel: IAppModel;
    members = new Array<Alien>();
    hiveXVelocity = 4;
    hiveYVelocity = 2;
    descend = 0;
    nextTick = 0;
    tickSpan = 1000;

    constructor(appModel: IAppModel){
        super();
        this.appModel = appModel;
        this.type = GameObjectType.Hive;
        this.width = 1;
        this.height = 1;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        if(this.descend > 0)
        {
            this.descend-= this.hiveYVelocity;
            this.members.forEach( member => {
                member.y += this.hiveYVelocity;
            });
            return;
        }

        if(gameTime < this.nextTick) return;
        this.nextTick = gameTime + this.tickSpan;

        let shouldReverse = false;
        this.members.forEach( member => {
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