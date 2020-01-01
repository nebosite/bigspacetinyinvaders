import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";
import { BulletObjectRenderer } from "src/controls/GameObjectRendering";


export class Alien extends GameObject{
    appModel: IAppModel;
    localFrame = 0;
    alienType = 0;
    hitPoints = 1;
    explosionEnd = 0;

    constructor(appModel: IAppModel){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Alien;
        this.width = 16;
        this.height = 16;
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        if(this.hitPoints <= 0 && this.explosionEnd == 0)
        {
            this.explosionEnd = gameTime + 200;
        }

        if(this.explosionEnd > 0 && this.explosionEnd < gameTime)
        {
            this.delete();
        }
    }

    shoot()
    {
        var bullet = new Bullet(this.appModel, this);
        bullet.velocity = -200;
        bullet.x = this.x;
        bullet.y = this.y;
        this.appModel.addGameObject(bullet);
    }

    doDamage(damageAmount: number) {
        this.hitPoints -= damageAmount;  
    }

}