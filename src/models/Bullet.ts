import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { DrawnVectorObject } from "src/ui/DrawHelper";
import { Vector2D } from "../tools/Vector2D";

export enum BulletType
{
    Standard,
    PhotonTorpedo
}
export class Bullet extends GameObject{
    appModel: IAppModel;
    velocity = new Vector2D(0, -300);
    source: GameObject;
    power = 10;
    bulletType = BulletType.Standard;

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
        super.think(gameTime, elapsedMilliseconds);
        let timeRatio = elapsedMilliseconds  /1000.0;
        let movement = timeRatio * this.velocity.length();
        let steps = Math.floor(Math.abs(movement) /2 ) + 1;
        let delta = this.velocity.scale(timeRatio * 1.0 / steps); 

        if(this.power < 0)
        {
            this.delete();
        }

        for(let i = 0; i < steps; i++)
        {
            this.x += delta.x;
            this.y += delta.y;
            if(this.y < 0 || this.y > this.appModel.worldSize.height)
            {
                this.appModel.removeGameObject(this);
            }

            this.appModel.hitTest(this, (target) =>
            {
                target.doDamage(this);
                if(this.power <= 0)
                {
                    this.appModel.removeGameObject(this);
                    return false;
                }
                return true;
            });
        }
    }
}