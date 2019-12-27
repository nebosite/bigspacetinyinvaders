import { Player } from "./Player";

export interface IAppModel
{
    addPlayer: (player: Player) => void; 
    getPlayers: () => Array<Player>; 
}

export class AppModel
{
    players = new Array<Player>();

    addPlayer = (player: Player) =>
    {
        this.players.push(player);
    }

    getPlayers = () =>  this.players;
}