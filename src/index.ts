
import { GameController } from "./controls/GameControl";
import { AppModel } from "./models/AppModel";

var theApp = new AppModel();
const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.background = "Black";
gameCanvas.style.margin = "0";
gameCanvas.style.padding = "0";
var theGameController = new GameController(theApp, gameCanvas);

