
import { GameController } from "./controls/GameControl";
import { AppModel } from "./models/AppModel";
import { DrawHelper } from "./ui/DrawHelper";

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

var theGameController = new GameController(theApp, drawing);

