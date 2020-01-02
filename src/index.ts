
import { GameController } from "./controls/GameControl";
import { AppModel } from "./models/AppModel";
import { DrawHelper } from "./ui/DrawHelper";
import { SoundHelper } from "./ui/SoundHelper";

// https://github.com/kittykatattack/learningPixi

var theApp = new AppModel();
//const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.background = "Green";
//gameCanvas.style.margin = "0";
//gameCanvas.style.padding = "0";
//const drawContext = gameCanvas.getContext("2d") || (() => { throw new Error('No 2D support'); })();
let drawing = new DrawHelper();
drawing.addIndexedSpriteTextures("sprites/ship", ".png", 2, 10);
drawing.addIndexedSpriteTextures("sprites/bullet", ".png", 2, 2);
drawing.addIndexedSpriteTextures("sprites/alien", ".png", 2, 7);
drawing.addIndexedSpriteTextures("sprites/brick", ".png", 2, 8);

let sound = new SoundHelper();
var theGameController = new GameController(theApp, drawing, sound);

