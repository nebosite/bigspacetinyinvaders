import { IInputReceiver } from "./InputReceiver";

// Javascript keycodes: https://keycode.info/


export interface IKeycodeTranslator {
    handleKeyDown: (key: number) => boolean;
    handleKeyUp: (key: number) => boolean;
    getHandledCodes: () => IterableIterator<number>;
}

export class KeycodeTranslator<T> implements IKeycodeTranslator {
    keyActions: Map<number, T> = new Map();
    private subscribers = new Array<IInputReceiver<T>>();
    name: string;
    
    // ------------------------------------------------------------------------
    // ctor
    // ------------------------------------------------------------------------
    constructor(name: string)
    {
        this.name = name;
    }

    // ------------------------------------------------------------------------
    // getHandledCodes
    // ------------------------------------------------------------------------
    getHandledCodes = () =>
    {
        return this.keyActions.keys();
    };

    // ------------------------------------------------------------------------
    // handleKeyDown
    // ------------------------------------------------------------------------
    handleKeyDown = (keyCode: number): boolean => {
        if(this.keyActions.has(keyCode))
        {
            this.subscribers.forEach(subscriber => {
                subscriber.actionChanged(this.keyActions.get(keyCode) as T, 1);
            });
            return true;
        }   
        return false;
    }

    // ------------------------------------------------------------------------
    // handleKeyUp
    // ------------------------------------------------------------------------
    handleKeyUp = (keyCode: number): boolean => {
        if(this.keyActions.has(keyCode))
        {
            this.subscribers.forEach(subscriber => {
                subscriber.actionChanged(this.keyActions.get(keyCode) as T, 0 );
            });
            return true;
        }   
        return false;
    }

    // ------------------------------------------------------------------------
    // handleKeyUp
    // ------------------------------------------------------------------------
    mapKey(keyCode: number, action: T) {
        this.keyActions.set(keyCode, action);
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
}

// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
//
// KeyboardManager - A class to manage all the key translations
//
// ------------------------------------------------------------------------
// ------------------------------------------------------------------------
export class KeyboardManager {
    keyHandlerLookup = new Map<number, IKeycodeTranslator>();
    onUnhandledKeyCode = (keyCode: number) => {};

    // ------------------------------------------------------------------------
    // ctor
    // ------------------------------------------------------------------------
    constructor()
    {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    // ------------------------------------------------------------------------
    // handleKeyDown
    // ------------------------------------------------------------------------
    handleKeyDown = (e: KeyboardEvent) => {
        if(this.keyHandlerLookup.has(e.keyCode))
        {
            this.keyHandlerLookup.get(e.keyCode)?.handleKeyDown(e.keyCode);
        }   
        else
        {
            this.onUnhandledKeyCode(e.keyCode);
        }
    }

    // ------------------------------------------------------------------------
    // handleKeyUp
    // ------------------------------------------------------------------------
    handleKeyUp = (e: KeyboardEvent) => {
        if(this.keyHandlerLookup.has(e.keyCode))
        {
            this.keyHandlerLookup.get(e.keyCode)?.handleKeyUp(e.keyCode);
        }   
    }

    // ------------------------------------------------------------------------
    // addTranslator
    // ------------------------------------------------------------------------
    addTranslator = (translator: IKeycodeTranslator) =>
    {
        for(let code of translator.getHandledCodes())
        {
            this.keyHandlerLookup.set(code, translator);
        }
    }

    // ------------------------------------------------------------------------
    // removeTranslator
    // ------------------------------------------------------------------------
    removeTranslator = (translator: IKeycodeTranslator) =>
    {
        for(let key of Array.from( this.keyHandlerLookup.keys()) ) {
            if(this.keyHandlerLookup.get(key) === translator)
            {
                this.keyHandlerLookup.delete(key);
            }
         }            
    }
}

