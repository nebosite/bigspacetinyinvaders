
import { EventThing } from "../tools/EventThing";
import { Vector2D } from "./Vector2D";


//-----------------------------------------------------------------------------
// Animation handling base class
//-----------------------------------------------------------------------------
export abstract class GameAnimation 
{
    startTime: number;
    endTime: number;
    length_ms: number;
    looping: boolean;
    ended = false;
    OnAnimationComplete = new EventThing("GameAnimation");
    lastAnimationTime = 0;

    //-----------------------------------------------------------------------------
    // ctor
    //-----------------------------------------------------------------------------
    constructor(startTime: number, length_ms: number, looping: boolean = false)
    {
        this.looping = looping;
        this.startTime = startTime;
        this.length_ms = length_ms;
        this.endTime = startTime + (looping ? length_ms : 1000000000000);
    }

    //-----------------------------------------------------------------------------
    // restart the animation from the beginning
    //-----------------------------------------------------------------------------
    restart(startTime: number)
    {
        this.startTime = startTime;
        this.endTime = startTime + (this.looping ? this.length_ms : 1000000000000);
        this.ended = false;
    }

    //-----------------------------------------------------------------------------
    // restart the animation from the beginning
    //-----------------------------------------------------------------------------
    finish()
    {
        this.handleAnimationProgress(1);
        this.ended = true;
        this.OnAnimationComplete.invoke("ended");
    }

    //-----------------------------------------------------------------------------
    // Call this to animate
    //-----------------------------------------------------------------------------
    animate(gameTime: number) 
    {
        if(this.ended) return;
        this.lastAnimationTime = gameTime;
        let elapsed_ms = gameTime - this.startTime;
        if(this.looping) elapsed_ms %= this.length_ms;
        if(elapsed_ms >= this.length_ms) {
            this.finish();
        }
        else this.handleAnimationProgress(1.0 * elapsed_ms / this.length_ms);
    }

    //-----------------------------------------------------------------------------
    // Implement this in your special animation class
    //-----------------------------------------------------------------------------
    abstract handleAnimationProgress(cyclePoint: number): void;
}

//-----------------------------------------------------------------------------
// Run a set of animations in series
//-----------------------------------------------------------------------------
export class SeriesAnimation extends GameAnimation
{
    animations = new Array<GameAnimation>();
    animationIndex = -1;
    currentAnimation: GameAnimation | undefined = undefined;

    //-----------------------------------------------------------------------------
    // ctor
    //-----------------------------------------------------------------------------
    constructor()
    {
        super(Date.now(),1000000000000);
    }
   
    //-----------------------------------------------------------------------------
    // add an animation to the list
    //-----------------------------------------------------------------------------
    addAnimation(animation: GameAnimation)
    {
        this.animations.push(animation);
    }

    //-----------------------------------------------------------------------------
    // Override base animation behavior
    //-----------------------------------------------------------------------------
    animate(gameTime: number) 
    {
        if(!this.currentAnimation)
        {
            this.animationIndex++;
            if(this.animationIndex >= this.animations.length)
            {
                this.finish();
                return;
            }
            this.currentAnimation = this.animations[this.animationIndex];
            this.currentAnimation.restart(gameTime);
        }
        
        this.currentAnimation.handleAnimationProgress(gameTime);
    }

    //-----------------------------------------------------------------------------
    // Implement this in your special animation class
    //-----------------------------------------------------------------------------
    handleAnimationProgress(cyclePoint: number) {
        throw Error("This should never be called");
    }
}

//-----------------------------------------------------------------------------
// Spline animation
//-----------------------------------------------------------------------------
export class SplineAnimation extends GameAnimation
{
    setPoint: (t: number, location: Vector2D)=>void;
    points: Vector2D[];
    degree: number;
    dimension: number;
    baseFunc: (x: number) => number;
    rangeInt: number;
    margin:number;

    //-----------------------------------------------------------------------------
    // ctor
    //-----------------------------------------------------------------------------
    constructor(startTime: number, length_ms: number, points: Vector2D[], setPoint: (t: number, points: Vector2D)=>void , degree: number = 2)
    {
        super(startTime, length_ms);
        this.degree= degree;
        this.margin = 1;//this.degree-1;
        this.setPoint = setPoint;
        this.points = points;
        this.dimension = 2;
        if(this.points.length < 2) throw new Error("Must specify at least two points");
        switch(this.degree)
        {
            case 2: this.baseFunc = this.basisDeg2; this.rangeInt = 2; break;
            case 3: this.baseFunc = this.basisDeg3; this.rangeInt = 2; break;
            case 4: this.baseFunc = this.basisDeg4; this.rangeInt = 3; break;
            case 5: this.baseFunc = this.basisDeg5; this.rangeInt = 3; break;
            default: throw Error("Basis degree must be 2-5, but was " + this.degree);
        }
    }

    basisDeg2 = (x: number) => {
        if(-0.5 <= x && x < 0.5)        return 0.75 - x*x;
        else if(0.5 <= x && x <= 1.5)   return 1.125 + (-1.5 + x/2.0)*x;
        else if(-1.5 <= x && x < -0.5)  return 1.125 + (1.5 + x/2.0)*x;
        else                            return 0;
    };
    
    basisDeg3 = (x: number) => {
        if(-1 <= x && x < 0)            return 2.0/3.0 + (-1.0 - x/2.0)*x*x;
        else if(1 <= x && x <= 2)       return 4.0/3.0 + x*(-2.0 + (1.0 - x/6.0)*x);
        else if(-2 <= x && x < -1)      return 4.0/3.0 + x*(2.0 + (1.0 + x/6.0)*x);
        else if(0 <= x && x < 1)        return 2.0/3.0 + (-1.0 + x/2.0)*x*x;
        else                            return 0;
    };
    
    basisDeg4 = (x: number) => {
        if(-1.5 <= x && x < -0.5)       return 55.0/96.0 + x*(-(5.0/24.0) + x*(-(5.0/4.0) + (-(5.0/6.0) - x/6.0)*x));
        else if(0.5 <= x && x < 1.5)    return 55.0/96.0 + x*(5.0/24.0 + x*(-(5.0/4.0) + (5.0/6.0 - x/6.0)*x));
        else if(1.5 <= x && x <= 2.5)   return 625.0/384.0 + x*(-(125.0/48.0) + x*(25.0/16.0 + (-(5.0/12.0) + x/24.0)*x));
        else if(-2.5 <= x && x <= -1.5) return 625.0/384.0 + x*(125.0/48.0 + x*(25.0/16.0 + (5.0/12.0 + x/24.0)*x));
        else if(-1.5 <= x && x < 1.5)   return 115.0/192.0 + x*x*(-(5.0/8.0) + x*x/4.0);
        else                            return 0;
    };
    
    basisDeg5 = (x: number) => {
        if(-2 <= x && x < -1)           return 17.0/40.0 + x*(-(5.0/8.0) + x*(-(7.0/4.0) + x*(-(5.0/4.0) + (-(3.0/8.0) - x/24.0)*x)));
        else if(0 <= x && x < 1)        return 11.0/20.0 + x*x*(-(1.0/2.0) + (1.0/4.0 - x/12.0)*x*x);
        else if(2 <= x && x <= 3)       return 81.0/40.0 + x*(-(27.0/8.0) + x*(9.0/4.0 + x*(-(3.0/4.0) + (1.0/8.0 - x/120.0)*x)));
        else if(-3 <= x && x < -2)      return 81.0/40.0 + x*(27.0/8.0 + x*(9.0/4.0 + x*(3.0/4.0 + (1.0/8.0 + x/120.0)*x)));
        else if(1 <= x && x < 2)        return 17.0/40.0 + x*(5.0/8.0 + x*(-(7.0/4.0) + x*(5.0/4.0 + (-(3.0/8.0) + x/24.0)*x)));
        else if(-1 <= x && x < 0)       return 11.0/20.0 + x*x*(-(1.0/2.0) + (1.0/4.0 + x/12.0)*x*x);
        else                            return 0;
        
    };

    getRangePoint = (n: number) => {
        var index = Math.floor( n - this.margin);
        if(index < 0) index = 0;
        if(index > this.points.length - 1) index = this.points.length-1;
        return this.points[index];
    };

    getInterpolatedPoint = (fuzzyT: number) => {
        var tInt = Math.ceil(fuzzyT);
        var result = new Vector2D(0,0);
        //let output = "OUT: "
        let totalFactor = 0;
        for(var i = tInt - this.rangeInt; i < tInt + this.rangeInt; i++){
            let scaleFactor = this.baseFunc(fuzzyT - i);
            totalFactor += scaleFactor;
            let rp = this.getRangePoint(i);
            let pointValue = rp.scale(scaleFactor);
            result.x += pointValue.x;
            result.y += pointValue.y;
            //output += `[i${rp.x/100} ${Math.floor(scaleFactor * 100)/100.0}] `
        }
        //console.log(output + " (" + Math.floor(totalFactor * 100 + .001)/100.0 + ")");
        return result;
    };

    //-----------------------------------------------------------------------------
    // Implement this in your special animation class
    //-----------------------------------------------------------------------------
    handleAnimationProgress(cyclePoint: number) {
        if(cyclePoint < 0 || cyclePoint > 1) throw new Error("cyclePoint is out of bounds [0,1]: " + cyclePoint)
        let t = cyclePoint * (((this.margin)*2+this.points.length)-1);
        this.setPoint(cyclePoint, this.getInterpolatedPoint(t));
    }
}



