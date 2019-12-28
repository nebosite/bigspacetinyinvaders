
export enum GameObjectType
{
    Unknown,
    Player,
    Bullet
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

    think(gameTime: number, elapsedMilliseconds: number) {};

}