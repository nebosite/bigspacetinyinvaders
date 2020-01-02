import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";

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

    doDamage(damageAmount: number) {
        if(this.hitPoints == 0) return;
        this.hitPoints -= damageAmount * 2;
        if(this.hitPoints <= 0) 
        {
            this.hitPoints = 0;
            this.delete();
        }
    };

} 