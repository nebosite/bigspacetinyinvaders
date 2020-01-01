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
    onAddedGameObject: (gameObject: GameObject) => void;
    onRemovedGameObject: (gameObject: GameObject) => void;
    hitTest: (gameObject: GameObject) => GameObject | undefined;

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
    onAddedGameObject = (gameObject: GameObject) => {};
    onRemovedGameObject = (gameObject: GameObject) => {};
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
        player.x = this.worldSize.width/2;
        player.y = this.worldSize.height - 50 + 1 * player.number;
        player.width = this.playerSize;
        player.height = this.playerSize;
        this.addGameObject(player);
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
        let alienSize = 11;
        let alienSpacing = alienSize + 4;
        let columns = Math.floor((this.worldSize.width * .8) / alienSpacing);
        let rows = Math.floor((this.worldSize.height * .6) / alienSpacing);
        let hive = new Hive(this);
        this.addGameObject(hive);

        for(let i = 0; i < columns; i++)
        {
            for(let j = 0; j < rows; j++)
            {
                let newAlien = new Alien(this);
                newAlien.x = 50 + i * alienSpacing;
                newAlien.y = 100 + j * alienSpacing;
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
        this.onRemovedGameObject(gameObject);
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    addGameObject(gameObject: GameObject){
        this.gameObjects.set(gameObject.id, gameObject); 
        this.onAddedGameObject(gameObject); 
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    hitTest(gameObject: GameObject)
    {
        if(gameObject.type == GameObjectType.Bullet)
        {
            let bullet = gameObject as Bullet;
            if(bullet.source.type == GameObjectType.Player)
            {
                for(let target of this.getGameObjects())
                {
                    if(target.type != GameObjectType.Alien) continue;
                    let dx = Math.abs(bullet.x - target.x);
                    if(dx > 10) continue;
                    let dy = Math.abs(bullet.y - target.y);
                    if(dy > 10) continue;
                    return target;
                }
            }
        }
    }
}