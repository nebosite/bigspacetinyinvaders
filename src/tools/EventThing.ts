export class EventThing
{
    private subscribers = new Map<string, ()=>void>();

    subscribe(name: string, callMe: ()=> void)
    {
        this.subscribers.set(name, callMe);
    }

    unSubscribe(name: string)
    {
        this.subscribers.delete(name);
    }

    invoke()
    {
        for(let callMe of this.subscribers.values())
        {
            callMe();
        }
    }
}