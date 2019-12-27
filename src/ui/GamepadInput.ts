import { IInputReceiver } from "./InputReceiver";

class GamepadState
{
    axes: Array<number> = new Array<number>();
    buttons: Array<number> = Array<number>();
    index: number = -1;
    lastTimeStamp: number = -1;
}

export interface IGamepadInputCodeTranslator {
    handleInputChange: (code: GamepadInputCode, controllerIndex: number, value: number) => boolean;
    getHandledCodes: () => IterableIterator<GamepadInputCode>;
}

export enum GamepadInputCode {
    None,
    Axis0 = 1,
    Axis_Stick0X = 1,
    Axis_Stick0Y,
    Axis_Stick1X,
    Axis_Stick1Y,
    Axis_LeftShoulder,
    Axis_RightShoulder,
    Axis_LeftTrigger,
    Axis_RightTrigger,
    Axis8,
    Axis9,
    Button00 = 20,
    Button_DiamondDown = 20,
    Button_DiamondRight,
    Button_DiamondLeft,
    Button_DiamondUp,
    Button04,
    Button05,
    Button06,
    Button07,
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

// Translations for [Pro Controller (STANDARD GAMEPAD Vendor: 057e Product: 2009)
const axisTranslations = new Map<string, Array<GamepadInputCode>>(
    [["057e", [
        GamepadInputCode.Axis_Stick0X,
        GamepadInputCode.Axis_Stick0Y,
        GamepadInputCode.Axis_Stick1X,
        GamepadInputCode.Axis_Stick1Y,
    ]]]);

const buttonTranslations = new Map<string, Array<GamepadInputCode>>(
    [["057e", [
        GamepadInputCode.Button_DiamondDown,
        GamepadInputCode.Button_DiamondRight,
        GamepadInputCode.Button_DiamondLeft,
        GamepadInputCode.Button_DiamondUp,
        GamepadInputCode.Button04,
        GamepadInputCode.Button05,
        GamepadInputCode.Button06,
        GamepadInputCode.Button07,
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
    ]]]);

    
export class GamepadTranslator<T> implements IGamepadInputCodeTranslator {
    private subscribers = new Array<IInputReceiver<T>>();
    private inputActions = new Map<GamepadInputCode, T[]>();

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
    handleInputChange = (code: GamepadInputCode, controllerIndex: number, value: number): boolean => {
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
                }
                else if(value > 0)
                {
                    outTranslation = outputs[1];
                }
                else
                {
                    console.log(`Z: ${code}`)
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

    constructor()
    {
        window.addEventListener('gamepadconnected', e => this.handleGamepadConnect(e, true));
        window.addEventListener('gamepaddisconnected',  e => this.handleGamepadConnect(e, false));
        setInterval(this.pollInput, 16);
    }  

    //-------------------------------------------------------------------------
    // Look at connected controllers and see if there is anything happening
    //-------------------------------------------------------------------------
    pollInput = ()=>{
        const gamePads = navigator.getGamepads();
        if(gamePads)
        {
            for (var i = 0, len = gamePads.length; i < len; i++) {
                const gp =  gamePads[i] as Gamepad;
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
                    if(state.axes[i] != gp.axes[i]) {
                        if(this.handlerLookup.has(key)) {
                            this.handlerLookup.get(code)?.handleInputChange(code, gp.index, gp.axes[i]);
                        }
                        else {
                            this.onUnhandledInputCode(gp.index, code, gp.axes[i]);
                        }
                    }
                    state.axes[i] = gp.axes[i];
                }

                for(var i = 0; i < gp.buttons.length; i++)
                {
                    const code = GamepadInputCode.Button00 + i;
                    let key = gp.index * 1000 + code;
                    var newValue = gp.buttons[i].value;
                    if(newValue == 0 && gp.buttons[i].pressed) newValue = 1;
                    if(newValue == 1 && !gp.buttons[i].pressed) newValue = 0;
                    if(state.buttons[i] != newValue) {
                        if(this.handlerLookup.has(key)) {
                            this.handlerLookup.get(code)?.handleInputChange(code, gp.index, newValue);
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
            console.log(`Connect detected: Axes:${gp.axes.length} Buttons:${gp.buttons.length} Id:${gp.id}`);
            
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
    addTranslator = (translator: IGamepadInputCodeTranslator, controllerIndex: number) =>
    {
        for(let code of translator.getHandledCodes())
        {
            this.handlerLookup.set(code + controllerIndex * 1000, translator);
        }
    }

    // ------------------------------------------------------------------------
    // removeTranslator
    // ------------------------------------------------------------------------
    removeTranslator = (translator: IGamepadInputCodeTranslator) =>
    {
        for(let key of Array.from( this.handlerLookup.keys()) ) {
            if(this.handlerLookup.get(key) === translator)
            {
                this.handlerLookup.delete(key);
            }
         }            
    }

}