import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";

export class Bullet extends GameObject{
    appModel: IAppModel;

    constructor(appModel: IAppModel){
        super();
        this.appModel = appModel;
        this.type = GameObjectType.Bullet;
        this.width = 1;
        this.height = 4;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        for(let i = 0; i < 3; i++)
        {
            this.y -= 2;
            if(this.y < 0)
            {
                this.appModel.removeGameObject(this);
            }
        }
    }
}