import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { Alien } from "./Alien";

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
        let damage = 1;
        if(sourceObject.type == GameObjectType.Bullet) {
            let bullet = sourceObject as Bullet
            this.hitPoints -= bullet.power * .2;
            bullet.power = 0;
        }
        else if(sourceObject.type == GameObjectType.Alien) {
            damage = this.hitPoints;
            this.hitPoints = 0;
            sourceObject.doDamage(this);
        }
        else return;

        this.appModel.onHitObject?.invoke({gameObject: this, damage: damage});
        if(this.hitPoints <= 0) 
        {
            this.hitPoints = 0;
            this.delete();
        }
    };

} 