import { Player } from "./Player";
import { IGamepadInputCodeTranslator } from "../ui/GamepadInput";
import { GameObject, GameObjectType } from "./GameObject";
import { Bullet } from "./Bullet";
import { Hive } from "./Hive";
import { Alien } from "./Alien";

//---------------------------------------------------------------------------
// 
//---------------------------------------------------------------------------
export class AppDiagnostics
{
    frame = 0;
    lastThinkTime = 0;
    frameRate = 60;

    addFrame(elapsedTime: number)
    {
        this.frame++;
        let newRate = 1000/elapsedTime;
        this.frameRate = this.frameRate * .99 + newRate * .01;
    }
}

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
    hitTest: (gameObject: GameObject) => GameObject | null;
    diagnostics: AppDiagnostics;

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
    diagnostics = new AppDiagnostics();
    collisionCellSize = 50;


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

    collisionLookup: Array<Array<Array<GameObject>>> = new Array<Array<Array<GameObject>>>();

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    think (gameTime: number, elapsedMilliseconds: number) {
        this.diagnostics.addFrame(elapsedMilliseconds);
        let startTime = Date.now();

        // Create a lookup Table to speed up collision tests
        let xCellCount = Math.ceil(this.worldSize.width / this.collisionCellSize);
        let yCellCount = Math.ceil(this.worldSize.height / this.collisionCellSize);
        
        for(let x = 0; x < xCellCount; x++)
        {
            this.collisionLookup[x] = new Array<Array<GameObject>>();
            for(let y = 0; y < yCellCount; y++)
            {
                this.collisionLookup[x][y] = new Array<GameObject>();
            }
        }

        this.gameObjects.forEach( gameObject => {
            let xCell = Math.floor(gameObject.x / this.collisionCellSize);
            if(xCell < 0) xCell = 0;
            if(xCell >= xCellCount) xCell = xCellCount - 1;

            let yCell = Math.floor(gameObject.y / this.collisionCellSize);
            if(yCell < 0) yCell = 0;
            if(yCell >= yCellCount) yCell = yCellCount - 1;

            this.collisionLookup[xCell][yCell].push(gameObject);
        });   
       

        this.gameObjects.forEach( gameObject => {
            gameObject.think(gameTime, elapsedMilliseconds);
        });   

        if(this.shouldStartLevel && this.players.length > 0)
        {
            this.startLevel();
        }
        this.diagnostics.lastThinkTime = Date.now() - startTime;
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    startLevel()
    {
        this.shouldStartLevel = false;
        let alienSize = 11;
        let alienSpacing = alienSize + 4;
        let ufoArea = alienSize * 5;
        let playerArea = 50;
        let shieldArea = 60;
        let yForAliens = this.worldSize.height - ufoArea - playerArea - shieldArea;
        let xForAliens = this.worldSize.width - alienSpacing * 4;
        let columns = Math.ceil((xForAliens * .7) / alienSpacing);
        let rows = Math.ceil((yForAliens * .7) / alienSpacing);
        let hive = new Hive(this, columns * rows);
        this.addGameObject(hive);

        for(let i = 0; i < columns; i++)
        {
            for(let j = 0; j < rows; j++)
            {
                let newType = 0;
                if(j < 2) newType = 2;
                else if (j < 8) newType = 1;
                let newAlien = new Alien(this, newType);
                newAlien.x = alienSpacing * 3 + i * alienSpacing;
                newAlien.y = alienSpacing * 3 + j * alienSpacing;
                this.addGameObject(newAlien);
                hive.addMember(newAlien);
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
        let gridXSize = this.collisionLookup.length;
        let gridYSize = this.collisionLookup[0].length;
        let xCell = Math.floor(gameObject.x / this.collisionCellSize);
        if(xCell < 0) xCell = 0;
        if(xCell >= gridXSize) xCell = gridXSize - 1;

        let yCell = Math.floor(gameObject.y / this.collisionCellSize);
        if(yCell < 0) yCell = 0;
        if(yCell >= gridYSize) yCell = gridYSize - 1;
    
        if(gameObject.type == GameObjectType.Bullet)
        {
            let bullet = gameObject as Bullet;
            if(bullet.source.type == GameObjectType.Player)
            {
                for(let x = -1; x < 2; x++) 
                {
                    let xRead = xCell + x;
                    if(xRead < 0 || xRead >= gridXSize) continue;
                    for(let y = -1; y < 2; y++)
                    {
                        let yRead = yCell + y;
                        if(yRead < 0 || yRead >= gridYSize) continue;

                        for(let i = 0; i < this.collisionLookup[xRead][yRead].length; i++)
                        {
                            let target = this.collisionLookup[xRead][yRead][i];
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
        return null;
    }
}