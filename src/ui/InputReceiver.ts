export interface IInputReceiver<T> {
    startAction: (action: T) => void;
    stopAction: (action: T) => void;
}