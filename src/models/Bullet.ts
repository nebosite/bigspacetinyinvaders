import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";

export class Bullet extends GameObject{
    appModel: IAppModel;
    velocity: number;

    constructor(appModel: IAppModel){
        super();
        this.appModel = appModel;
        this.type = GameObjectType.Bullet;
        this.width = 1;
        this.height = 4;
        this.velocity = 300;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        let movement = elapsedMilliseconds  /1000.0 * this.velocity;
        let steps = Math.floor(movement /2 ) + 1;
        let delta = movement / steps;
        for(let i = 0; i < steps; i++)
        {
            this.y -= delta;
            if(this.y < 0)
            {
                this.appModel.removeGameObject(this);
            }
        }
    }
}