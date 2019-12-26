
import { GameController } from "./controllers/GameController";
import { AppModel } from "./models/AppModel";

var theApp = new AppModel();
var theGameController = new GameController(theApp);

