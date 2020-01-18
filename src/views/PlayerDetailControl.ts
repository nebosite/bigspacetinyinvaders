import {  KeyboardManager } from "../ui/KeyboardInput";
import { DrawHelper, DrawnObject, DrawnText, DrawnVectorObject } from "../ui/DrawHelper";
import { GamepadManager, GamepadState } from "../ui/GamepadInput";
import { AppDiagnostics } from "../models/AppModel";
import { Player } from "src/models/Player";
import { WidgetSystem } from "src/WidgetLib/WidgetSystem";

class ProgressControl
{
    cancelled = false;
    x = 0;
    y = 0;
    width = 0;
    height = 0;
    max = 100;
    value = 0;
    color = 0xFF0000;
    borderSize = 0;

    frame: DrawnVectorObject;
    fill: DrawnVectorObject;

    constructor(drawing: DrawHelper, width: number, height: number, color: number, borderSize: number)   
    {
        this.color = color;
        this.width = width;
        this.height = height;
        this.borderSize = borderSize;

        this.frame = drawing.addRectangleObject(0,0,width,height,0x101010,1,[0,0],0xDDDDDD,1,borderSize);
        this.fill = drawing.addRectangleObject(0,0,width-borderSize*2,height-borderSize*2,this.color,1,[0,0]);
    }

    render(){
        this.frame.x = this.x;
        this.frame.y = this.y;

        this.fill.x = this.x + this.borderSize;
        this.fill.y = this.y + this.borderSize;
        this.fill.color = this.color;
        let ratio = Math.min( this.value / this.max, 1.0);   
        this.fill.width = (this.frame.width-this.borderSize * 2) * ratio;
    }

    delete()
    {
        this.frame.delete();
        this.fill.delete();
    }
}


export class PlayerDetailControl 
{
    drawing: DrawHelper;
    player: Player;
    cancelled = false;
    x = 0;
    y = 0;
    width = 0;
    height = 0;

    drawingObjects = new Array<DrawnObject>();
    area: DrawnVectorObject;
    playerName: DrawnText;
    playerScore: DrawnText;
    gunHeat: ProgressControl;
    gunCharge: ProgressControl;
    

    
    //-------------------------------------------------------------------------
    // ctor
    //-------------------------------------------------------------------------
    constructor(drawing: DrawHelper, player: Player, width: number, height: number)
    {
        this.drawing = drawing;
        this.player = player;
        let fontSize = 50;
        let fontScale = height * .15 /fontSize ;

        this.area = drawing.addRectangleObject(0,0, width, height,0x444444, .7, [0,0], 0xFFFF00, 1, width * .02);
        this.drawingObjects.push(this.area);
        
        this.playerName = drawing.addTextObject(player.name, 0,0, fontSize, 0xffff00, 0x0, 0, 1000, [0,0]);
        this.playerName.scale = [fontScale, fontScale];
        this.drawingObjects.push(this.playerName);
        
        this.playerScore = drawing.addTextObject(player.score.toString(), 0,0, fontSize, 0xffff00, 0x0, 0, 1000, [0,0]);
        this.playerScore.scale = [fontScale, fontScale];
        this.drawingObjects.push(this.playerScore);

        this.gunHeat = new ProgressControl(drawing,  width * .9, height * .15, 0xff0000,2);
        this.gunCharge = new ProgressControl(drawing, width * .9, height * .15,0x6060FF,2);
    }

    //-------------------------------------------------------------------------
    // update my state
    //-------------------------------------------------------------------------
    render = () =>
    {
        let pad = this.area.width * .05;
        this.area.x = this.x;
        this.area.y = this.y;

        let y = pad;

        this.playerName.x = this.area.x + pad;
        this.playerName.y = y;

        y += this.playerName.height;

        this.playerScore.x = this.area.x + pad;
        this.playerScore.y = y;
        this.playerScore.text = this.player.score.toString();

        y += this.playerScore.height;

        this.gunHeat.x = this.area.x + (this.area.width - this.gunHeat.width)/2;
        this.gunHeat.y = y;
        this.gunHeat.max = this.player.gun.overheatLevel;
        this.gunHeat.value = this.player.gun.heat;
        this.gunHeat.render();

        y += this.gunHeat.height + pad/2;

        this.gunCharge.x = this.area.x + (this.area.width - this.gunHeat.width)/2;
        this.gunCharge.y = y;
        this.gunCharge.max = this.player.gun.chargeCapacity;
        this.gunCharge.value = this.player.gun.charge;
        this.gunCharge.render();

        y += this.gunHeat.height + pad/2;

    };

    //-------------------------------------------------------------------------
    // stop rendering this control
    //-------------------------------------------------------------------------
    cancelMe(){
        if(this.cancelled) return;
        this.cancelled = false;
        this.drawingObjects.forEach(thing => thing.delete());
        this.gunCharge.delete();
        this.gunHeat.delete();
        this.drawingObjects.length = 0;
        this.cancelled = true;
    }
}