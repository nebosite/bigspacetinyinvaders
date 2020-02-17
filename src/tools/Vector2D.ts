/* Simple 2D JavaScript Vector Class Hacked from evanw's lightgl.js
https://github.com/evanw/lightgl.js/blob/master/src/vector.js
*/

export class Vector2D
{
    x: number;
    y: number;

    constructor(x: number, y: number) 
    {
        this.x = x || 0;
        this.y = y || 0;
    }

    negative =  () => new Vector2D(-this.x, -this.y)
    length =    () => Math.sqrt(this.dot(this))
    normal =    () => this.scale(1/this.length())
    toAngle =   () => -Math.atan2(-this.y, this.x)
    angleTo =   (v: Vector2D) =>Math.acos(this.dot(v) / (this.length() * v.length()))
    add =       (v: Vector2D) => new Vector2D(this.x + v.x, this.y + v.y)
    subtract =  (v: Vector2D) => new Vector2D(this.x - v.x, this.y - v.y)
    multiply =  (v: Vector2D) => new Vector2D(this.x * v.x, this.y * v.y)
    divide =    (v: Vector2D) => new Vector2D(this.x / v.x, this.y / v.y)
    dot =       (v: Vector2D) => this.x * v.x + this.y * v.y
    cross =     (v: Vector2D) => this.x * v.y - this.y * v.x
    scale =     (s: number) => new Vector2D(this.x * s, this.y * s)
    equals =    (v: Vector2D) =>  this.x == v.x && this.y == v.y;
    toArray =   () => [this.x, this.y]
    clone =     () => new Vector2D(this.x, this.y)
};
