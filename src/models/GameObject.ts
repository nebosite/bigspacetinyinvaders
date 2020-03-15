import { IAppModel, AppModel } from "./AppModel";
import { GameObjectRenderer } from "../views/GameObjectRendering";
import { EventThing } from "../tools/EventThing";
import { GameAnimation } from "src/tools/GameAnimation";

export enum GameObjectType
{
    Unknown,
    Player,
    Bullet,
    Hive,
    Alien,
    ShieldBlock,
    Debris,
    COUNT_OF_TYPES
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
    animations = new Array<GameAnimation>();

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

    removeAnimation(animation: GameAnimation)
    {
        let index = this.animations.indexOf(animation);
        if(index >= 0) this.animations.splice(index, 1);
    }

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        for(let animation of this.animations) animation.animate(gameTime);
    };
    
    doDamage(sourceObject: GameObject) {};
}