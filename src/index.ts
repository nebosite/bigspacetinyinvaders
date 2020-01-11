
import { GameController } from "./controls/GameController";
import { AppModel } from "./models/AppModel";
import { DrawHelper } from "./ui/DrawHelper";
import { SoundHelper } from "./ui/SoundHelper";

var theAppModel = new AppModel();
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.background = "Green";

let theDrawHelper = new DrawHelper();
theDrawHelper.addIndexedSpriteTextures("sprites/ship", ".png", 2, 10);
theDrawHelper.addIndexedSpriteTextures("sprites/bullet", ".png", 2, 2);
theDrawHelper.addIndexedSpriteTextures("sprites/alien", ".png", 2, 7);
theDrawHelper.addIndexedSpriteTextures("sprites/brick", ".png", 2, 8);

let theSoundHelper = new SoundHelper();
var theGameController = new GameController(theAppModel, theDrawHelper, theSoundHelper);

