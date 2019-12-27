
import { GameController } from "./controls/GameControl";
import { AppModel } from "./models/AppModel";

var theApp = new AppModel();
const gameCanvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
var theGameController = new GameController(theApp, gameCanvas);

