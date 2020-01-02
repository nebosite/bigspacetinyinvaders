
class AudioChannel
{
    lastPlayedTime: number;
    soundData: HTMLAudioElement;

    get timeLeft() : number {
        let secondsSincePlay = (Date.now() - this.lastPlayedTime) / 1000;
        let secondsLeft = Math.max(0, this.soundData.duration - secondsSincePlay);
        return  secondsLeft;
    }

    constructor(name: string)
    {
        this.soundData = new Audio(name);
        if(!this.soundData)  throw new Error(`Sound name '${name}' does not exist`);
        this.lastPlayedTime = 0;
    }

    play()
    {
        this.soundData.play();
        this.lastPlayedTime = Date.now();
    }

}

// ----------------------------------------------------------------------------------------
// HTMLAudio can't layer very easily.  This class creates audio channels to help with that.
// ----------------------------------------------------------------------------------------
export class SoundHelper
{
    channels = new Map<string, Array<AudioChannel>>();

    play(soundName: string)
    {
        let channelList = this.channels.get(soundName);
        if(!channelList)
        {
            channelList = new Array<AudioChannel>();
            this.channels.set(soundName, channelList);
        }

        // Find a channel we can use for audio
        let bestChannel: AudioChannel | null = null;
        let leastTime = Number.MAX_SAFE_INTEGER;
        for(let i = 0; i < channelList.length; i++)
        {
            let channel = channelList[i];

            // If the channel is idle, just play it
            if(channel.timeLeft == 0)
            {
                channel.play();
                return;
            }
            
            // Keep track of the channel that is mostly complete
            if(channel.timeLeft < leastTime) 
            {
                leastTime = channel.timeLeft;
                bestChannel = channel;
            }
        }

        // At this point, there are no available channelsl.  If we haven't created 
        // too many channels, make a new one here. 
        if(channelList.length < 32)
        {
            bestChannel = new AudioChannel(soundName);
            channelList.push(bestChannel);
        }
        bestChannel?.play();
    }
}