import { Player } from "./Player";
import { GameObject, GameObjectType } from "./GameObject";
import { Bullet } from "./Bullet";
import { Hive } from "./Hive";
import { Alien } from "./Alien";
import { ShieldBlock } from "./ShieldBlock";
import { GLOBALS } from "../globals";
import { EventThing } from "../tools/EventThing";
import { SplineAnimation } from "../tools/GameAnimation";
import { Vector2D } from "../tools/Vector2D";
import { defaultFilterVertex } from "pixi.js";

export enum DebugAction
{
    KillHalf
}

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
    typeCount = new Map<number, number>();

    constructor()
    {
        for(let i = 0; i < GameObjectType.COUNT_OF_TYPES; i++)
        {
            this.typeCount.set(i,0);
        }
    }

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
    debug = true;

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    constructor(){
        if(this.debug)
        {
            this.isFullScreen = false;
        }
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
    hitTest: (gameObject: GameObject, tryTarget: (target: GameObject) => boolean) => void;
    reset: () => void;
    doDebugAction: (action: DebugAction) => void;
    diagnostics: AppDiagnostics;
    gameListener: IGameListener | null;
    onGameEnded: ()=>void;
    endGame: ()=>void;
    settings: GameSettings;
    onHitObject: EventThing<{gameObject: GameObject, damage: number}>;
    shieldTop: number;

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
    onHitObject = new EventThing<{gameObject: GameObject, damage: number}>("AppModel OnHitObject");
    shieldTop = 0;
    currentLevel = 1;
    lastThinkTime = 0;
    currentHive: Hive | null = null;

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
        this.currentLevel = 1;
        this.lastThinkTime = 0;
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    doDebugAction(action: DebugAction)
    {
        if(action == DebugAction.KillHalf)
        {
            this.currentHive?.kill(100);
          
        }
 
    }

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    endGame(){
        console.log("endGame()");
        if(this._gameIsRunning) this.reset();
        if(!this._isEnding)
        {
            console.log("Ending...")
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
        player.yEntranceTarget = this.worldSize.height - 50 + 1 * player.number;
        player.y = this.worldSize.height + 50
        player.width = this.playerSize;
        player.height = this.playerSize;
        this.addGameObject(player);
    }

    collisionLookup: Array<Array<Array<GameObject>>> = new Array<Array<Array<GameObject>>>();

    //---------------------------------------------------------------------------
    // 
    //---------------------------------------------------------------------------
    think (gameTime: number, elapsedMilliseconds: number) {
        this.lastThinkTime = gameTime;
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

        for(let i = 0; i < GameObjectType.COUNT_OF_TYPES; i++)
        {
            this.diagnostics.typeCount.set(i,0);
        }

        this.gameObjects.forEach( gameObject => {
            let xCell = Math.floor(gameObject.x / this.collisionCellSize);
            if(xCell < 0) xCell = 0;
            if(xCell >= xCellCount) xCell = xCellCount - 1;

            let yCell = Math.floor(gameObject.y / this.collisionCellSize);
            if(yCell < 0) yCell = 0;
            if(yCell >= yCellCount) yCell = yCellCount - 1;

            let count = this.diagnostics.typeCount.get(gameObject.type)! + 1
            this.diagnostics.typeCount.set(gameObject.type, count)
            this.collisionLookup[xCell][yCell].push(gameObject);
        });   
       

        this.gameObjects.forEach( gameObject => {
            gameObject.think(gameTime, elapsedMilliseconds);
        });   

        if(this.shouldStartLevel && this.players.length > 0)
        {
            this.startLevel(gameTime);
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
        [0,0,1,1,1,1,1,0,0],
        [0,1,1,1,1,1,1,1,0],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,1,1,1,1,1,1],
        [1,1,1,0,0,0,1,1,1],
        [1,1,1,0,0,0,1,1,1],
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
        if(shieldCount % 2 == 0) shieldCount ++; // ensure there is a middle shield
        let xForSpace = this.worldSize.width - shieldWidth * shieldCount;
        let padding = xForSpace / 2 / shieldCount;

        let x = padding;
        let y = this.worldSize.height - GLOBALS.PLAYER_Y_AREA - GLOBALS.SHIELD_Y_AREA;
        this.shieldTop = y - 20;
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
    startLevel(gameTime: number)
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
        let hive = new Hive(this, this.currentLevel);
        hive.onCleanup.subscribe("Start new level", () => {
            this.currentLevel++;
            this.startLevel(this.lastThinkTime);
        });

        let alienYOffset = 0;
        let alienXOffset = (xForAliens - columns * alienSpacing)/2;
        if(this.currentLevel == 1)
        {
            columns = 11;
            rows = 5;
            alienYOffset = yForAliens - (rows + 5) * alienSpacing;
            alienXOffset = (xForAliens - columns * alienSpacing)/2;
        }
        let topRowCount = Math.ceil(rows * .05);
        let nextRowCount = Math.ceil(rows * .2) + topRowCount;
        this.addGameObject(hive); 
        this.currentHive = hive;

        let getJitteredPoint = (point: Vector2D, xmag: number, ymag: number) =>
        {
            var theta = Math.random() * Math.PI * 2;
            var w = Math.random() * xmag;
            var h = Math.random() * ymag;
            return new Vector2D(
                point.x + w * Math.cos(theta),
                point.y + h * Math.sin(theta)              
            )   
        }

        for(let i = 0; i < columns; i++)
        {
            for(let j = 0; j < rows; j++)
            {
                let newType = 0;
                if(j < topRowCount) newType = 2;
                else if (j < nextRowCount) newType = 1;
                let newAlien = new Alien(this, newType);
                newAlien.formationLocation.x = alienXOffset + alienSpacing * 3 + i * alienSpacing;
                newAlien.formationLocation.y = alienYOffset + ufoArea + GLOBALS.INFO_Y_AREA + j * alienSpacing;
                let points = new Array<Vector2D>();
                points.push(getJitteredPoint(newAlien.formationLocation.subtract(new Vector2D(0,this.worldSize.height)), xForAliens* .5, yForAliens * .2))
                points.push(getJitteredPoint(points[0].add(newAlien.formationLocation).scale(.5), xForAliens * .5, yForAliens * .2))
                points.push(newAlien.formationLocation);
                newAlien.addFlyinAnimation(
                    new SplineAnimation(
                        gameTime, 6000, points, 
                        (t, p) => {
                            newAlien.x = p.x;
                            newAlien.y = p.y;
                            points[2] = newAlien.formationLocation; // update to current hive location too
                }));
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
    hitTest(gameObject: GameObject, tryTarget: (target: GameObject) => boolean)
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
                    if(target.isDeleted) continue;
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
                    if(!tryTarget(target)) return;
                }
            } 
        }
    }
}