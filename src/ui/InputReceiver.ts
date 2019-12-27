export interface IInputReceiver<T> {
    actionChanged: (action: T, value: number) => void;
}