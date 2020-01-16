export class EventThing
{
    private subscribers = new Map<string, ()=>void>();
    name: string;

    constructor(name: string)
    {
        this.name = name;
    }

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
        for(let callMe of this.subscribers)
        {
            //console.log(`Invoke: ${this.name}: ${callMe[0]}`)
            callMe[1]();
        }
    }
}