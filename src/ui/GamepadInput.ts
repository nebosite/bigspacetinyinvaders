import { IInputReceiver } from "./InputReceiver";
import { accessibility } from "pixi.js";

export class GamepadState
{
    axes: Array<number> = new Array<number>();
    buttons: Array<number> = Array<number>();
    index: number = -1;
    lastTimeStamp: number = -1;
    get diagnosticsText() {
        let output = "";
        for(let i = 0; i < this.axes.length; i++)
        {
            output += `Ax${i}: ${this.axes[i].toFixed(3)}\n`;
        }
        output += '\n';
        for(let i = 0; i < this.buttons.length; i++)
        {
            let buttonText = this.buttons[i].toString();
            if(this.buttons[i] > 0 && this.buttons[i] < 1)
            {
                buttonText = this.buttons[i].toFixed(3);
            }
            output += `Bt${i}: ${buttonText}\n`;
        }
        return output;
    }
}

export interface IGamepadInputCodeTranslator {
    handleInputChange: (code: GamepadInputCode, controllerIndex: number, value: number, lastValue: number) => boolean;
    getHandledCodes: () => IterableIterator<GamepadInputCode>;
    controllerIndex: number;
}

export enum GamepadInputCode {
    None,
    Axis0 = 1,
    Axis_Stick0X = 1,
    Axis_Stick0Y,
    Axis_Stick1X,
    Axis_Stick1Y,
    Axis4,
    Axis5,
    Axis6,
    Axis7,
    Axis8,
    Axis9,
    Button00 = 20,
    Button_DiamondDown = 20,
    Button_DiamondRight,
    Button_DiamondLeft,
    Button_DiamondUp,
    Button_ShoulderLeft,
    Button_ShoulderRight,
    Button_TriggerLeft,
    Button_TriggerRight,
    Button_Back,
    Button_Forward,
    Button_Stick0,
    Button_Stick1,
    Button_DPadUp,
    Button_DPadDown,
    Button_DPadLeft,
    Button_DPadRight,
    Button_Home,
    Button_Snap,
    Button18,
    Button19,
    Button20,
    Button21,
    Button22,
    Button23,
    Button24,
    Button25,
    Button26,
    Button27,
    Button28,
    Button29,
};

// I've started building these translations for gamepad compatibility but 
// it looks like they are probably unnecessary.  Maybe 10% of controllers don't
// meet the "STANDARD GAMEPAD" pattern of input.  
// SEE: https://html5gamepad.com/controllers
const axisTranslations = new Map<string, Array<GamepadInputCode>>(
    [
        ["057e", [
            GamepadInputCode.Axis_Stick0X,
            GamepadInputCode.Axis_Stick0Y,
            GamepadInputCode.Axis_Stick1X,
            GamepadInputCode.Axis_Stick1Y,
            ]
        ],
        ["xbox 360", [
            GamepadInputCode.Axis_Stick0X,
            GamepadInputCode.Axis_Stick0Y,
            GamepadInputCode.Axis_Stick1X,
            GamepadInputCode.Axis_Stick1Y,
            ]
        ],
        ["STANDARD GAMEPAD", [
            GamepadInputCode.Axis_Stick0X,
            GamepadInputCode.Axis_Stick0Y,
            GamepadInputCode.Axis_Stick1X,
            GamepadInputCode.Axis_Stick1Y,
            ]
        ]
    ]);

const buttonTranslations = new Map<string, Array<GamepadInputCode>>(
    [
        ["057e", [
            GamepadInputCode.Button_DiamondDown,
            GamepadInputCode.Button_DiamondRight,
            GamepadInputCode.Button_DiamondLeft,
            GamepadInputCode.Button_DiamondUp,
            GamepadInputCode.Button_ShoulderLeft,
            GamepadInputCode.Button_ShoulderRight,
            GamepadInputCode.Button_TriggerLeft,
            GamepadInputCode.Button_TriggerRight,
            GamepadInputCode.Button_Back,
            GamepadInputCode.Button_Forward,
            GamepadInputCode.Button_Stick0,
            GamepadInputCode.Button_Stick1,
            GamepadInputCode.Button_DPadUp,
            GamepadInputCode.Button_DPadDown,
            GamepadInputCode.Button_DPadLeft,
            GamepadInputCode.Button_DPadRight,
            GamepadInputCode.Button_Home,
            GamepadInputCode.Button_Snap,
            ]
        ],
        ["xbox 360", [
            GamepadInputCode.Button_DiamondDown,
            GamepadInputCode.Button_DiamondRight,
            GamepadInputCode.Button_DiamondLeft,
            GamepadInputCode.Button_DiamondUp,
            GamepadInputCode.Button_ShoulderLeft,
            GamepadInputCode.Button_ShoulderRight,
            GamepadInputCode.Button_TriggerLeft,
            GamepadInputCode.Button_TriggerRight,
            GamepadInputCode.Button_Back,
            GamepadInputCode.Button_Forward,
            GamepadInputCode.Button_Stick0,
            GamepadInputCode.Button_Stick1,
            GamepadInputCode.Button_DPadUp,
            GamepadInputCode.Button_DPadDown,
            GamepadInputCode.Button_DPadLeft,
            GamepadInputCode.Button_DPadRight,
            ]
        ],
        ["STANDARD GAMEPAD", [
            GamepadInputCode.Button_DiamondDown,
            GamepadInputCode.Button_DiamondRight,
            GamepadInputCode.Button_DiamondLeft,
            GamepadInputCode.Button_DiamondUp,
            GamepadInputCode.Button_ShoulderLeft,
            GamepadInputCode.Button_ShoulderRight,
            GamepadInputCode.Button_TriggerLeft,
            GamepadInputCode.Button_TriggerRight,
            GamepadInputCode.Button_Back,
            GamepadInputCode.Button_Forward,
            GamepadInputCode.Button_Stick0,
            GamepadInputCode.Button_Stick1,
            GamepadInputCode.Button_DPadUp,
            GamepadInputCode.Button_DPadDown,
            GamepadInputCode.Button_DPadLeft,
            GamepadInputCode.Button_DPadRight,
            ]
        ]
    ]);

    
// ------------------------------------------------------------------------
//
// GamepadTranslator
//
// ------------------------------------------------------------------------
export class GamepadTranslator<T> implements IGamepadInputCodeTranslator {
    private subscribers = new Array<IInputReceiver<T>>();
    private inputActions = new Map<GamepadInputCode, T[]>();
    name: string;
    controllerIndex : number;

    // ------------------------------------------------------------------------
    // ctor
    // ------------------------------------------------------------------------
    constructor(name: string, controllerIndex: number)
    {
        this.name = name;
        this.controllerIndex = controllerIndex;
    }

    // ------------------------------------------------------------------------
    // getHandledCodes
    // ------------------------------------------------------------------------
    getHandledCodes = () =>
    {
        return this.inputActions.keys();
    };

    // ------------------------------------------------------------------------
    // handleKeyDown
    // ------------------------------------------------------------------------
    handleInputChange = (code: GamepadInputCode, controllerIndex: number, value: number, lastValue: number): boolean => {
        if(this.inputActions.has(code))
        {
            var outputs = this.inputActions.get(code) as T[];
            var outTranslation = outputs[0];
            var outValue = value;
            if(outputs.length > 1)
            {
                if(value < 0)
                {
                    outValue = -value;
                    if(lastValue > 0)
                    {
                        this.subscribers.forEach(subscriber => {
                            subscriber.actionChanged(outputs[1] as T, 0);
                        });
                    }
                }
                else if(value > 0)
                {
                    outTranslation = outputs[1];
                    if(lastValue < 0)
                    {
                        this.subscribers.forEach(subscriber => {
                            subscriber.actionChanged(outputs[0] as T, 0);
                        });
                    }
                }
                else
                {
                    this.subscribers.forEach(subscriber => {
                        subscriber.actionChanged(outputs[0] as T, value);
                        subscriber.actionChanged(outputs[1] as T, value);
                    });
                }
            }

            this.subscribers.forEach(subscriber => {
                subscriber.actionChanged(outTranslation, outValue);
            });
            return true;
        }   
        return false;
    }

    // ------------------------------------------------------------------------
    // Add a subscriber to the key events from this translator
    // ------------------------------------------------------------------------
    addSubscriber = (subscriber: IInputReceiver<T>) => {
        this.subscribers.push(subscriber);
    }

    // ------------------------------------------------------------------------
    // Add a subscriber to the key events from this translator
    // ------------------------------------------------------------------------
    removeSubscriber = (subscriber: IInputReceiver<T>) => {
        this.subscribers.splice(this.subscribers.indexOf(subscriber),1);
    }

    // ------------------------------------------------------------------------
    // Decide on a game input axis to translate
    // ------------------------------------------------------------------------
    mapAxis(code: GamepadInputCode, lowMapping: T, highMapping: T)
    {
        this.inputActions.set(code, [lowMapping, highMapping]);
    }

    // ------------------------------------------------------------------------
    // Decide on a game input axis to translate
    // ------------------------------------------------------------------------
    mapButton(code: GamepadInputCode, mapping: T)
    {
        this.inputActions.set(code, [mapping]);
    }
}


export class GamepadManager {
    handlerLookup = new Map<number, IGamepadInputCodeTranslator>();
    onUnhandledInputCode = (controllerIndex: number, code: GamepadInputCode, value: number) => {};
    gamePadStates = new Map<number, GamepadState>();
    deadZone = 0.02;

    constructor()
    {
        window.addEventListener('gamepadconnected', e => this.handleGamepadConnect(e, true));
        window.addEventListener('gamepaddisconnected',  e => this.handleGamepadConnect(e, false));
        setInterval(this.pollInput, 16);
    }  

    // ------------------------------------------------------------------------
    // reset
    // ------------------------------------------------------------------------
    reset()
    {
        this.handlerLookup.clear();
    }

    //-------------------------------------------------------------------------
    // Look at connected controllers and see if there is anything happening
    //-------------------------------------------------------------------------
    pollInput = ()=>{
        const gamePads = navigator.getGamepads();
        if(gamePads)
        {
            for (var gamePadIndex = 0, len = gamePads.length; gamePadIndex < len; gamePadIndex++) {
                const gp =  gamePads[gamePadIndex] as Gamepad;
                if(!gp) continue;

                if(!this.gamePadStates.has(gp.index))
                {
                    console.error(`ERROR: index ${gp.index} not found in gamepad states`);
                    return;
                }

                let state = this.gamePadStates.get(gp.index);
                if(!state) return;
                if(state.lastTimeStamp == gp.timestamp)
                {
                    return;
                }
                state.lastTimeStamp = gp.timestamp;

                for(var i = 0; i < gp.axes.length; i++)
                {
                    const code = GamepadInputCode.Axis0 + i;
                    let key = gp.index * 1000 + code;
                    let axisState = gp.axes[i];
                    if(Math.abs(axisState) < this.deadZone) axisState = 0;
                    if(state.axes[i] != axisState) {
                        if(this.handlerLookup.has(key)) {
                            this.handlerLookup.get(key)?.handleInputChange(code, gp.index, axisState, state.axes[i]);
                        }
                        else {
                            this.onUnhandledInputCode(gp.index, code, axisState);
                        }
                    }
                    state.axes[i] = axisState;
                }

                for(var i = 0; i < gp.buttons.length; i++)
                {
                    const code = GamepadInputCode.Button00 + i;
                    let key = gp.index * 1000 + code;
                    var newValue = gp.buttons[i].value;
                    if(newValue == 0 && gp.buttons[i].pressed) newValue = 1;
                    if(newValue == 1 && !gp.buttons[i].pressed) newValue = 0;
                    if(newValue < this.deadZone) newValue = 0;
                    if(state.buttons[i] != newValue) {
                        if(this.handlerLookup.has(key)) {
                            this.handlerLookup.get(key)?.handleInputChange(code, gp.index, newValue, state.buttons[i]);
                        }
                        else {
                            this.onUnhandledInputCode(gp.index, code, newValue);
                        }
                    }
                    state.buttons[i] = newValue;
                }
                state.lastTimeStamp = gp.timestamp;
            }
        }
    };
    
    //-------------------------------------------------------------------------
    // handle gamepad connection
    //-------------------------------------------------------------------------
    handleGamepadConnect = (e: Event, connecting: boolean) => {
        const gamepadEvent = e as GamepadEvent;
        if(connecting) {
            // access like this: gam
            const gp = gamepadEvent.gamepad;    
            console.log(`Connect detected: Index:${gp.index} Axes:${gp.axes.length} Buttons:${gp.buttons.length} Id:${gp.id}`);
            
            let newState = new GamepadState();
            gp.buttons.forEach(b => newState.buttons.push(b.value));
            gp.axes.forEach(a => newState.axes.push(a));
            newState.index = gp.index;
            newState.lastTimeStamp = gp.timestamp;
            this.gamePadStates.set(gp.index, newState);
        }

        // XBox layout
        // buttons: [
        //     'DPad-Up','DPad-Down','DPad-Left','DPad-Right',
        //     'Start','Back','Axis-Left','Axis-Right',
        //     'LB','RB','Power','A','B','X','Y',
        //   ],
    }

    
    // ------------------------------------------------------------------------
    // addTranslator
    // ------------------------------------------------------------------------
    addTranslator = (translator: IGamepadInputCodeTranslator) =>
    {
        for(let code of translator.getHandledCodes())
        {
            this.handlerLookup.set(code + translator.controllerIndex * 1000, translator);
        }
    }

    // ------------------------------------------------------------------------
    // removeTranslator
    // ------------------------------------------------------------------------
    removeTranslator = (translator: IGamepadInputCodeTranslator) =>
    {
        for(let partialKey of Array.from( this.handlerLookup.keys()) ) {
            let key = partialKey + translator.controllerIndex * 1000;
            if(this.handlerLookup.get(key) === translator)
            {
                this.handlerLookup.delete(key);
            }
         }            
    }

}