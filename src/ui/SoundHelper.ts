

// ----------------------------------------------------------------------------------------
// Abstracted interaction with AudioContext
// https://www.html5rocks.com/en/tutorials/webaudio/intro
// ----------------------------------------------------------------------------------------
export class SoundHelper
{
    sounds = new Map<string, AudioBuffer >();
    context: AudioContext
    
    // ----------------------------------------------------------------------------------------
    // ctor
    // ----------------------------------------------------------------------------------------
    constructor ()
    {
        this.context = new AudioContext();
    }

    // ----------------------------------------------------------------------------------------
    // pre-load a sound into memory
    // ----------------------------------------------------------------------------------------
    loadSound = (soundName: string) =>
    {
        var request = new XMLHttpRequest();
        request.open('GET', '/' + soundName, true);
        request.responseType = 'arraybuffer';
      
        // Decode asynchronously
        request.onload = () => {
          this.context.decodeAudioData(
              request.response, 
              (buffer: AudioBuffer ) => { this.sounds.set(soundName, buffer) }, 
              (error: any) => {console.error(`ERROR loading sound: ${soundName}: ${error}`)});
        }
        request.send();        
    }

    // ----------------------------------------------------------------------------------------
    // 
    // ----------------------------------------------------------------------------------------
    play(soundName: string)
    {
        if(!this.sounds.has(soundName))
        {
            return;
        }
        let sound = this.sounds.get(soundName);
        let source = this.context.createBufferSource();
        source.buffer = sound as AudioBuffer;
        source.connect(this.context.destination);
        source.start(0);
    }
}