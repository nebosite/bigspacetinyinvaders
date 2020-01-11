
import { AppModel } from "./models/AppModel";
import { DrawHelper } from "./ui/DrawHelper";
import { SoundHelper } from "./ui/SoundHelper";
import { WidgetSystem } from "./WidgetLib/WidgetSystem";
import { MainMenuWidget } from "./views/MainMenuWidget";

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

var mainMenu = new MainMenuWidget(theAppModel);
var theWidgetSystem = new WidgetSystem(theDrawHelper, theSoundHelper, mainMenu);
//var theGameController = new GameController(theAppModel, theDrawHelper, theSoundHelper);

