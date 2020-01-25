import { IInputReceiver } from "../ui/InputReceiver";
import { PlayerAction } from "../views/GameWidget";
import { ButtonEvent } from "../WidgetLib/WidgetSystem";

export interface IPlayerActionReceiver {
    actionChanged: (action: PlayerAction, value: number)=> void;
}

// ------------------------------------------------------------------------
//
// ButtonEventTranslator - translates button events to player controls
//
// ------------------------------------------------------------------------
export class ButtonEventTranslator {
    private subscribers = new Array<IPlayerActionReceiver>();
    private inputActions = new Map<number, PlayerAction>();
    controllerId : string;

    // ------------------------------------------------------------------------
    // ctor
    // ------------------------------------------------------------------------
    constructor(controllerId: string)
    {
        this.controllerId = controllerId;
    }

    // ------------------------------------------------------------------------
    // getHandledCodes - convert internal code to array of controllerId:code
    // ------------------------------------------------------------------------
    getHandledCodes = () =>
    {
        return Array.from( this.inputActions.keys() ).map(k => `${this.controllerId}:${k}`);
    };

    // ------------------------------------------------------------------------
    // map a button to player action
    // ------------------------------------------------------------------------
    mapButton(buttonId: number, action: PlayerAction)
    {
        this.inputActions.set(buttonId, action);
    }

    // ------------------------------------------------------------------------
    // Add a subscriber to this translater
    // ------------------------------------------------------------------------
    addSubscriber(subscribeMe: IPlayerActionReceiver)
    {
        this.subscribers.push(subscribeMe);
    }

    // ------------------------------------------------------------------------
    // Remove a subscriber to this translater
    // ------------------------------------------------------------------------
    removeSubscribe(unsubscribeMe: IPlayerActionReceiver)
    {
        let index = this.subscribers.indexOf(unsubscribeMe);
        if(index >= 0) this.subscribers.splice(index, 1);
    }

    // ------------------------------------------------------------------------
    // handleButtonEvent - convert button events to translated codes
    // ------------------------------------------------------------------------
    handleButtonEvent = (event: ButtonEvent) => 
    {
        let key = `${this.controllerId}:${event.buttonId}`
        if(this.inputActions.has(event.buttonId))
        {
            var output = this.inputActions.get(event.buttonId);
            this.subscribers.forEach(subscriber => {
                subscriber.actionChanged(output as PlayerAction, event.buttonValue);
            });
        }   
    }
}
