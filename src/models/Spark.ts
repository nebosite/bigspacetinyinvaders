import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { DrawnVectorObject } from "src/ui/DrawHelper";
import { Vector2D } from "../tools/Vector2D";

export class Spark extends GameObject{
    velocity:Vector2D;
    power = 1.0;

    constructor(appModel: IAppModel){
        super(appModel);

        let magnitude = Math.random() * 300 + 400;
        let theta = Math.random() * .5 - .25;
        if(Math.random() > .5) theta += Math.PI;
        this.velocity = new Vector2D( 
            magnitude * Math.cos(theta),
            magnitude * Math.sin(theta));
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        let timeRatio = elapsedMilliseconds  /1000.0;
        let delta = this.velocity.scale(timeRatio);

        this.x += delta.x;
        this.y += delta.y;
        if(this.y < 0 || this.y > this.appModel.worldSize.height || this.power < 0)
        {
            this.appModel.removeGameObject(this);
        }
        this.power -= timeRatio * 10;
        if(this.power < 0) this.power == 0;
    }
}