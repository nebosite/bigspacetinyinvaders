import { Player } from "./Player";
import { IGamepadInputCodeTranslator } from "../ui/GamepadInput";
import { GameObject, GameObjectType } from "./GameObject";
import { Bullet } from "./Bullet";
import { Hive } from "./Hive";
import { Alien } from "./Alien";

//---------------------------------------------------------------------------
// 
//---------------------------------------------------------------------------
export interface IAppModel
{
    addPlayer: (player: Player) => void; 
    getPlayers: () => Array<Player>; 
    getGameObjects: () => IterableIterator<GameObject>; 
    think: (gameTime: number, elapsedMilliseconds: number) => void;
    removeGameObject: (gameObject: GameObject) => void; 
    addGameObject: (gameObject: GameObject) => void; 
    onPlayerRemoved: (player: Player) => void;

    worldSize: { width:number, height: number} ;
    playerSize: number;
}

//---------------------------------------------------------------------------
// 
//---------------------------------------------------------------------------
export class AppModel implements IAppModel
{
    players = new Array<Player>();
    gameObjects = new Map<number,GameObject>();
    playerSize = 16;
    onPlayerRemoved = (player: Player) => {};
    shouldStartLevel = true;

    private _worldSize = {width: 10, height: 10};
    get worldSize(): { width:number, height: number} {return this._worldSize;}
    set worldSize(value: { width:number, height: number}) {
        this._worldSize = value;
    }

    getPlayers = () =>  this.players;

    getGameObjects = () => this.gameObjects.values();

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    addPlayer = (player: Player) =>
    {
        this.players.push(player);
        this.gameObjects.set(player.id, player);
        player.x = this.worldSize.width/2;
        player.y = this.worldSize.height - 20;
        player.width = this.playerSize;
        player.height = this.playerSize;
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    think (gameTime: number, elapsedMilliseconds: number) {
        this.gameObjects.forEach( gameObject => {
            gameObject.think(gameTime, elapsedMilliseconds);
        });   

        if(this.shouldStartLevel && this.players.length > 0)
        {
            this.startLevel();
        }
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    startLevel()
    {
        this.shouldStartLevel = false;
        let columns = Math.floor((this.worldSize.width * .8) / 20);
        let rows = Math.floor((this.worldSize.height * .6) / 20);
        let hive = new Hive(this);
        this.addGameObject(hive);

        for(let i = 0; i < columns; i++)
        {
            for(let j = 0; j < rows; j++)
            {
                let newAlien = new Alien(this);
                newAlien.x = 20 + i * 20;
                newAlien.y = 100 + j * 20;
                if(j < 2) newAlien.alienType = 2;
                else if (j < 8) newAlien.alienType = 1;
                this.addGameObject(newAlien);
                hive.members.push(newAlien);
            }
        }

    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    removeGameObject(gameObject: GameObject){
        this.gameObjects.delete(gameObject.id);  
        if(gameObject.type == GameObjectType.Player)
        {
            this.players.splice(this.players.indexOf(gameObject as Player), 1);
            this.onPlayerRemoved(gameObject as Player);
        }
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    addGameObject(gameObject: GameObject){
        this.gameObjects.set(gameObject.id, gameObject);  
    }
}