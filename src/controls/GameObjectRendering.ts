import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameControl";
import { IKeycodeTranslator, KeycodeTranslator } from "../ui/KeyboardInput";
import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnSprite } from "../ui/DrawHelper";
import { GameObject } from "src/models/GameObject";
import { Player } from "src/models/Player";
import { Bullet } from "src/models/Bullet";
import { Alien } from "src/models/Alien";

export class GameObjectRenderer
{
    gameObject: GameObject;
    drawnObject: DrawnObject;

    constructor(gameObject: GameObject, drawnObject: DrawnObject){
        this.gameObject = gameObject;
        this.drawnObject = drawnObject;
    }

    render(){
        if(!this.drawnObject) return;
        this.drawnObject.x = this.gameObject.x;
        this.drawnObject.y = this.gameObject.y;
    };

    delete() {
        this.drawnObject?.delete();
    }
}

export class PlayerObjectRenderer extends GameObjectRenderer
{
    playerName: DrawnObject;

    constructor(gameObject: Player, drawing: DrawHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/ship", gameObject.number % 10, gameObject.x, gameObject.y) as DrawnObject);

        this.playerName = drawing.addTextObject(gameObject.name, gameObject.x, gameObject.y + 10, 12, "#ffffff", "", 0, 300, [.5, 0]);
    }

    render(){
        super.render();
        if(!this.playerName) return;
        this.playerName.x = this.gameObject.x;
        this.playerName.y = this.gameObject.y + 10;
    };

    delete() {
        super.delete();
        this.playerName?.delete();
    } 
}

export class BulletObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: Bullet, drawing: DrawHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/bullet", 0, gameObject.x, gameObject.y) as DrawnObject);
    }
}

export class AlienObjectRenderer extends GameObjectRenderer
{
    constructor(gameObject: Alien, drawing: DrawHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/alien", gameObject.alienType * 2, gameObject.x, gameObject.y) as DrawnObject);
    }

    render(){
        super.render();
        if(!this.drawnObject) return;
        let alien = this.gameObject as Alien;
        (this.drawnObject as DrawnSprite).textureFrame = alien.alienType * 2 + alien.localFrame % 2
    };

}