import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "../controls/GameControl";
import { GameObject, GameObjectType } from "./GameObject";
import { IAppModel } from "./AppModel";
import { Bullet } from "./Bullet";

export class Player extends GameObject implements IInputReceiver<PlayerAction>
{
    xLeft = 0;
    xRight = 0;
    maxSpeed = 6;
    onShoot = (player: Player) => {};
    appModel: IAppModel;
    shooting = false;
    lastShotTime = 0;
    lastActivityTime = Date.now();
    name: string = "dude";
    number = 0;

    constructor(appModel: IAppModel){
        super(appModel);
        this.appModel = appModel;
        this.type = GameObjectType.Player;
    }

    actionChanged = (action: PlayerAction, value: number) => {
        switch(action)
        {
            case PlayerAction.Left: this.xLeft = value == 0 ? 0 : this.xLeft + 1 * value; break;
            case PlayerAction.Right: this.xRight = value == 0 ? 0 : this.xRight + 1 * value; break;
            case PlayerAction.Fire: this.shooting = value == 1;
        }   
        this.lastActivityTime = Date.now();
    };

    think(gameTime: number, elapsedMilliseconds: number) 
    {
        let unit = elapsedMilliseconds / 16;
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
        
        this.x -= this.xLeft * unit;
        this.x += this.xRight * unit;
        if(this.x < this.width/2) this.x = this.width/2;
        if(this.x > this.appModel.worldSize.width - this.width/2) {
            this.x = this.appModel.worldSize.width - this.width/2;
        }

        if(this.shooting) this.maybeShoot();
        if(Date.now() - this.lastActivityTime > 25000 && !this.shooting)
        {
            this.delete();
        }
    }

    maybeShoot(){
        let millisecondsSinceLastShot = Date.now() - this.lastShotTime;
        if(millisecondsSinceLastShot < 300) return;
        this.lastShotTime= Date.now();
        var bullet = new Bullet(this.appModel, this);
        bullet.x = this.x;
        bullet.y = this.y - this.height;
        this.appModel.addGameObject(bullet);
    }
}