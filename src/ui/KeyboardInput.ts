// Javascript keycodes: https://keycode.info/


export interface IKeycodeTranslator {
    handleKeyDown: (key: number) => boolean;
    handleKeyUp: (key: number) => boolean;
    getHandledCodes: () => IterableIterator<number>;
}

export class KeycodeTranslator<T> implements IKeycodeTranslator {
    keyActions: Map<number, T> = new Map();

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
}

// ------------------------------------------------------------------------
// KeyboardManager - A class to manage all the key translations
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
            this.keyHandlerLookup.get(e.keyCode)?.handleKeyDown(e.keyCode);
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
}

