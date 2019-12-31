import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "./GameControl";
import { IKeycodeTranslator, KeycodeTranslator } from "../ui/KeyboardInput";
import { DrawHelper, DrawnObject, DrawnVectorObject, DrawnSprite } from "../ui/DrawHelper";
import { GameObject } from "src/models/GameObject";
import { Player } from "src/models/Player";

export class GameObjectRenderer
{
    gameObject: GameObject;
    drawnObject: DrawnObject;

    constructor(gameObject: GameObject, drawnObject: DrawnObject){
        this.gameObject = gameObject;
        this.drawnObject = drawnObject;
    }

    render = () =>{
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
    constructor(gameObject: Player, drawing: DrawHelper)
    {
        super(gameObject,
            drawing.addSpriteObject("sprites/ship", gameObject.number % 10, gameObject.x, gameObject.y) as DrawnObject);
    }
}