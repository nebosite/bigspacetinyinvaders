import { AppModel } from "./models/AppModel";
import { DrawHelper } from "./ui/DrawHelper";
import { SoundHelper } from "./ui/SoundHelper";
import { WidgetSystem } from "./WidgetLib/WidgetSystem";
import { MainMenuWidget } from "./views/MainMenuWidget";
import { AppViewWidget } from "./views/AppViewWidget";
import { Widget } from "./WidgetLib/Widget";


require(".")

var theAppModel = new AppModel();
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.background = "Green";

var appView = new AppViewWidget("The App", theAppModel);
var theWidgetSystem: WidgetSystem;

let theSoundHelper = new SoundHelper();
theSoundHelper.loadSound("sounds/alien_die.wav");
theSoundHelper.loadSound("sounds/ding.wav");
theSoundHelper.loadSound("sounds/player_death.wav");
theSoundHelper.loadSound("sounds/player_shot.wav");
theSoundHelper.loadSound("sounds/player_entrance.mp3");
theSoundHelper.loadSound("sounds/spark.wav");

let theDrawHelper = new DrawHelper();
theDrawHelper.addImageTexture("img/mainlogo.png");
theDrawHelper.addImageTexture("img/glow.png");
theDrawHelper.addImageTexture("img/photontorpedo.png");
theDrawHelper.addIndexedSpriteTextures("sprites/ship", ".png", 2, 10);
theDrawHelper.addIndexedSpriteTextures("sprites/bullet", ".png", 2, 2);
theDrawHelper.addIndexedSpriteTextures("sprites/alien", ".png", 2, 7);
theDrawHelper.addIndexedSpriteTextures("sprites/alien_damage", ".png", 2, 2);
theDrawHelper.addIndexedSpriteTextures("sprites/brick", ".png", 2, 8);
theDrawHelper.addIndexedSpriteTextures("sprites/deadship", ".png", 2, 5);
theDrawHelper.addIndexedSpriteTextures("sprites/bigdebris", ".png", 2, 5);
theDrawHelper.addIndexedSpriteTextures("sprites/smalldebris", ".png", 2, 5);
theDrawHelper.addIndexedSpriteTextures("sprites/powerup_fanshot", ".png", 2, 5);
theDrawHelper.addIndexedSpriteTextures("sprites/spark", ".png", 2, 1);
theDrawHelper.load(()=>
{
    theWidgetSystem = new WidgetSystem(theDrawHelper, theSoundHelper, appView);
});
