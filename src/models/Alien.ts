import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";


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
}