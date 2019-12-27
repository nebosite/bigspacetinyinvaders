import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "../controls/GameControl";
import { IGameObject, GameObjectTypes } from "./IGameObject";

export class Player implements IInputReceiver<PlayerAction>, IGameObject
{
    x = 0;
    y = 0;
    type = GameObjectTypes.Player as number;
    xLeft = 0;
    xRight = 0;
    maxSpeed = 6;

    actionChanged = (action: PlayerAction, value: number) => {
        switch(action)
        {
            case PlayerAction.Left: this.xLeft = value == 0 ? 0 : this.xLeft + 1 * value; break;
            case PlayerAction.Right: this.xRight = value == 0 ? 0 : this.xRight + 1 * value; break;
        }   
        console.log(`M: ${action.toString()}:${value}- ${this.xLeft},${this.xRight}`)

    };

    think = (gameTime: number, elapsedMilliseconds: number) =>
    {
        if(this.xLeft > 0) 
        {
            this.xLeft += 1;
            if(this.xLeft > this.maxSpeed) this.xLeft = this.maxSpeed;
        }
        
        if(this.xRight > 0) 
        {
            this.xRight += 1;
            if(this.xRight > this.maxSpeed) this.xRight = this.maxSpeed;
        }
        
        this.x -= this.xLeft;
        this.x += this.xRight;
    }
}