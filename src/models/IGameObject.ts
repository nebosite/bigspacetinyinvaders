
export enum GameObjectTypes
{
    Player
};

export interface IGameObject
{
    x: number;
    y: number;
    type: number;

    think: (gameTime: number, elapsedMilliseconds: number) => void;
}