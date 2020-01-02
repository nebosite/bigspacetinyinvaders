import { IAppModel, AppModel } from "./AppModel";

export enum GameObjectType
{
    Unknown,
    Player,
    Bullet,
    Hive,
    Alien,
    ShieldBlock
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
    onCleanup = () => {};

    constructor(appModel: IAppModel)
    {
        this.appModel = appModel;
    }

    delete()
    {
        if(this.isDeleted) return;
        this.isDeleted = true;
        this.onCleanup();
        this.appModel.removeGameObject(this);
    }

    think(gameTime: number, elapsedMilliseconds: number) {};
    doDamage(damageAmount: number) {};
}