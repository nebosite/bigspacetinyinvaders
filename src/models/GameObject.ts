import { IAppModel, AppModel } from "./AppModel";
import { GameObjectRenderer } from "../views/GameObjectRendering";
import { EventThing } from "../tools/EventThing";

export enum GameObjectType
{
    Unknown,
    Player,
    Bullet,
    Hive,
    Alien,
    ShieldBlock,
    Debris,
};

let GameObjectCount = 0;

export class GameObject
{
    x: number = 0;
    y: number = 0;
    width = 1;
    height = 1;
    id: number = GameObjectCount++;
    type: GameObjectType = GameObjectType.Unknown;
    appModel: IAppModel;
    isDeleted = false;
    onCleanup = new EventThing<void>("GameObject.OnCleanup");

    constructor(appModel: IAppModel)
    {
        this.appModel = appModel;
    }

    delete()
    {
        if(this.isDeleted) return;
        this.isDeleted = true;
        this.onCleanup.invoke();
        this.appModel.removeGameObject(this);
    }

    think(gameTime: number, elapsedMilliseconds: number) {};
    doDamage(sourceObject: GameObject) {};
}