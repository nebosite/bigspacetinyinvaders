import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";

export class ShieldBlock extends GameObject{
    appModel: IAppModel;
    hitPoints = 7;

    constructor(appModel: IAppModel){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.ShieldBlock;
        this.width = 4;
        this.height = 4;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
    }

    doDamage(sourceObject: GameObject) {
        if(this.hitPoints == 0) return;
        let bullet = sourceObject as Bullet
        if(!bullet) return;
        this.hitPoints -= bullet.power * .2;
        bullet.power = 0;
        if(this.hitPoints <= 0) 
        {
            this.hitPoints = 0;
            this.delete();
        }
    };

} 