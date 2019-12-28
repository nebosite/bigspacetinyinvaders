import { Player } from "./Player";

export interface IAppModel
{
    addPlayer: (player: Player) => void; 
    getPlayers: () => Array<Player>; 
    think: (gameTime: number, elapsedMilliseconds: number) => void;
    worldSize: { width:number, height: number} ;
    playerSize: number;
}

export class AppModel
{
    players = new Array<Player>();
    playerSize = 16;

    private _worldSize = {width: 10, height: 10};
    get worldSize(): { width:number, height: number} {return this._worldSize;}
    set worldSize(value: { width:number, height: number}) {
        this._worldSize = value;
    }

    addPlayer = (player: Player) =>
    {
        this.players.push(player);
        player.x = this.worldSize.width/2;
    }

    getPlayers = () =>  this.players;

    think (gameTime: number, elapsedMilliseconds: number) {
        this.players.forEach( player => {
            player.think(gameTime, elapsedMilliseconds);
            if(player.x < 0) player.x = 0;
            if(player.x > this.worldSize.width - this.playerSize) {
                player.x = this.worldSize.width - this.playerSize;
            }
        });   
    }
}