import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";

export class Bullet extends GameObject{
    appModel: IAppModel;
    velocity = 300;
    source: GameObject;
    power = 10;

    constructor(appModel: IAppModel, source: GameObject){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Bullet;
        this.width = 1;
        this.height = 4;
        this.source = source;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        let movement = elapsedMilliseconds  /1000.0 * this.velocity;
        let steps = Math.floor(Math.abs(movement) /2 ) + 1;
        let delta = movement / steps; 

        if(this.power < 0)
        {
            this.delete();
        }

        for(let i = 0; i < steps; i++)
        {
            this.y -= delta;
            if(this.y < 0)
            {
                this.appModel.removeGameObject(this);
            }

            let target = this.appModel.hitTest(this);
            if(target)
            {
                target.doDamage(this);
                this.appModel.removeGameObject(this);
            }
            
        }
    }
}