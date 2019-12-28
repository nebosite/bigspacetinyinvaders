import { Player } from "./Player";
import { IGamepadInputCodeTranslator } from "../ui/GamepadInput";
import { GameObject } from "./GameObject";
import { Bullet } from "./Bullet";

export interface IAppModel
{
    addPlayer: (player: Player) => void; 
    getPlayers: () => Array<Player>; 
    getGameObjects: () => IterableIterator<GameObject>; 
    think: (gameTime: number, elapsedMilliseconds: number) => void;
    removeGameObject: (gameObject: GameObject) => void; 
    addGameObject: (gameObject: GameObject) => void; 

    worldSize: { width:number, height: number} ;
    playerSize: number;
}

export class AppModel implements IAppModel
{
    players = new Array<Player>();
    gameObjects = new Map<number,GameObject>();
    playerSize = 16;

    private _worldSize = {width: 10, height: 10};
    get worldSize(): { width:number, height: number} {return this._worldSize;}
    set worldSize(value: { width:number, height: number}) {
        this._worldSize = value;
    }

    addPlayer = (player: Player) =>
    {
        this.players.push(player);
        this.gameObjects.set(player.id, player);
        player.x = this.worldSize.width/2;
        player.y = this.worldSize.height - 20;
        player.width = this.playerSize;
        player.height = this.playerSize;
    }

    getPlayers = () =>  this.players;

    getGameObjects = () => this.gameObjects.values();

    think (gameTime: number, elapsedMilliseconds: number) {
        this.gameObjects.forEach( gameObject => {
            gameObject.think(gameTime, elapsedMilliseconds);
        });   
    }

    removeGameObject(gameObject: GameObject){
        this.gameObjects.delete(gameObject.id);  
    }

    addGameObject(gameObject: GameObject){
        this.gameObjects.set(gameObject.id, gameObject);  
    }
}