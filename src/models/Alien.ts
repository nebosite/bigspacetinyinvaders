import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { BulletObjectRenderer } from "src/controls/GameObjectRendering";


export class Alien extends GameObject{
    appModel: IAppModel;
    localFrame = 0;
    alienType = 0;

    constructor(appModel: IAppModel){
        super();
        this.appModel = appModel;
        this.type = GameObjectType.Alien;
        this.width = 16;
        this.height = 16;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {

    }

    shoot()
    {
        var bullet = new Bullet(this.appModel, this);
        bullet.velocity = -200;
        bullet.x = this.x;
        bullet.y = this.y;
        this.appModel.addGameObject(bullet);
    }
}