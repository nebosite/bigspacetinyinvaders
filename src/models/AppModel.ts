import { Player } from "./Player";
import { IGamepadInputCodeTranslator } from "../ui/GamepadInput";
import { GameObject, GameObjectType } from "./GameObject";
import { Bullet } from "./Bullet";
import { Hive } from "./Hive";
import { Alien } from "./Alien";
import { ShieldBlock } from "./ShieldBlock";
import { GLOBALS } from "../globals";


//---------------------------------------------------------------------------
// 
//---------------------------------------------------------------------------
export interface IGameListener
{
    onPlayerRemoved: (player: Player) => void;
    onAddedGameObject: (gameObject: GameObject) => void;
    onRemovedGameObject: (gameObject: GameObject) => void;
}

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

export class GameSettings
{
    isFullScreen = true;
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
    hitTest: (gameObject: GameObject) => GameObject | null;
    reset: () => void;
    diagnostics: AppDiagnostics;
    gameListener: IGameListener | null;
    onGameEnded: ()=>void;
    endGame: ()=>void;
    settings: GameSettings;

    worldSize: { width:number, height: number} ;
    playerSize: number;
    maxScore: number;
    totalScore : number;

}

//---------------------------------------------------------------------------
// 
//---------------------------------------------------------------------------
export class AppModel implements IAppModel
{
    players = new Array<Player>();
    gameObjects = new Map<number,GameObject>();
    playerSize = 16;
    shouldStartLevel = true;
    diagnostics = new AppDiagnostics();
    collisionCellSize = 50;
    hasShields = false;
    maxScore = 0;
    totalScore = 0;
    gameListener: IGameListener | null = null;
    onGameEnded = ()=>{};
    private _gameIsRunning = false;
    private _isEnding = false;
    settings = new GameSettings();

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
    reset(){
        this.players.length = 0;
        this.gameObjects.clear();
        this.shouldStartLevel = true;
        this.maxScore = 0;
        this.totalScore = 0;
        this.hasShields = false;
        this._gameIsRunning = false;
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    endGame(){
        console.log("endGame()");
        if(this._gameIsRunning) this.reset();
        if(!this._isEnding)
        {
            this._isEnding = true;
            this.onGameEnded();
            this._isEnding = false;
        }
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    addPlayer = (player: Player) =>
    {
        if(!this.hasShields)
        {
            this.hasShields = true;
            this.createShields();
        }

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

        this.totalScore = 0;
        this.players.forEach(player =>
            {
                this.totalScore += player.score;
            });
        
        if(this.totalScore > this.maxScore) this.maxScore = this.totalScore;

        this.diagnostics.lastThinkTime = Date.now() - startTime;
    }

    readonly shieldMap = [
        [0,0,1,1,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1,1,1],
        [1,1,1,1,0,0,0,1,1,1,1],
        [1,1,1,1,0,0,0,1,1,1,1],
    ]

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    createShields()
    {
        let xForShields = this.worldSize.width;
        let shieldWidth = 44;
        let shieldSpacing = 220;
        let shieldCount = Math.floor(xForShields / shieldSpacing);
        if(shieldCount < 3) shieldCount = 3;
        let xForSpace = this.worldSize.width - shieldWidth * shieldCount;
        let padding = xForSpace / 2 / shieldCount;

        let x = padding;
        let y = this.worldSize.height - GLOBALS.PLAYER_Y_AREA - GLOBALS.SHIELD_Y_AREA;
        for(let q = 0; q < shieldCount; q++)
        {
            for(let i = 0; i < this.shieldMap[0].length; i++)
            {
                for(let j = 0; j < this.shieldMap.length; j++)
                {
                    if(this.shieldMap[j][i] == 0) continue;
                    let newBlock = new ShieldBlock(this);
                    newBlock.x = x + i * 4;
                    newBlock.y = y + j * 4;
                    this.addGameObject(newBlock);
                }
            }
            x += shieldWidth + padding * 2;
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
        let ufoArea = alienSize * 5;
        let yForAliens = this.worldSize.height - ufoArea 
            - GLOBALS.INFO_Y_AREA - GLOBALS.PLAYER_Y_AREA - GLOBALS.SHIELD_Y_AREA;
        let xForAliens = this.worldSize.width - alienSpacing * 4;
        let columns = Math.ceil((xForAliens * .9) / alienSpacing);
        let rows = Math.ceil((yForAliens * .8) / alienSpacing);
        let hive = new Hive(this, columns * rows);
        let topRowCount = Math.ceil(rows * .05);
        let nextRowCount = Math.ceil(rows * .2) + topRowCount;
        this.addGameObject(hive);

        for(let i = 0; i < columns; i++)
        {
            for(let j = 0; j < rows; j++)
            {
                let newType = 0;
                if(j < topRowCount) newType = 2;
                else if (j < nextRowCount) newType = 1;
                let newAlien = new Alien(this, newType);
                newAlien.x = alienSpacing * 3 + i * alienSpacing;
                newAlien.y = ufoArea + GLOBALS.INFO_Y_AREA + j * alienSpacing;
                this.addGameObject(newAlien);
                hive.addMember(newAlien);
            }
        }
        this._gameIsRunning = true;
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    removeGameObject(gameObject: GameObject){
        this.gameObjects.delete(gameObject.id);  
        if(gameObject.type == GameObjectType.Player)
        {
            this.players.splice(this.players.indexOf(gameObject as Player), 1);
            this.gameListener?.onPlayerRemoved(gameObject as Player);
        }
        this.gameListener?.onRemovedGameObject(gameObject);
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    addGameObject(gameObject: GameObject){
        this.gameObjects.set(gameObject.id, gameObject); 
        this.gameListener?.onAddedGameObject(gameObject); 
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
                    if(gameObject.type == GameObjectType.Bullet)
                    {
                        let bullet = gameObject as Bullet;
                        if(bullet.source.type == GameObjectType.Player)
                        {
                            if(target.type != GameObjectType.Alien
                                && target.type != GameObjectType.Debris
                                && target.type != GameObjectType.ShieldBlock) continue;
                        }
                        if(bullet.source.type == GameObjectType.Alien)
                        {
                            if(target.type != GameObjectType.Player
                                && target.type != GameObjectType.ShieldBlock) continue;
                        }
                    }

                    if(gameObject.type == GameObjectType.Player)
                    {
                        if(target.type != GameObjectType.Debris) continue;
                    }

                    let dx = Math.abs(gameObject.x - target.x);
                    if(dx > (gameObject.width + target.width)/2) continue;
                    let dy = Math.abs(gameObject.y - target.y);
                    if(dy > (gameObject.height + target.height)/2) continue;
                    return target;                    
                }
            } 
        }
        return null;
    }
}