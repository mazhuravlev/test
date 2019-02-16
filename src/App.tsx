import React, { Component } from 'react';
import './App.css';
import * as math from 'mathjs';
import { object } from 'prop-types';

class Vec2 {
  constructor(public readonly x: number, public readonly y: number) {
  }

  public add(other: Vec2) {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  public substract(other: Vec2) {
    return new Vec2(this.x - other.x, this.y - other.y);
  }

  public divide(x: number) {
    return new Vec2(this.x / x, this.y / x);
  }

  public multiply(x: number) {
    return new Vec2(this.x * x, this.y * x);
  }

  public rotate(angle: number) {
    const { x, y } = this;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    return new Vec2(x * cos - y * sin, x * sin + y * cos);
  }

  public normalize() {
    return this.divide(this.length);
  }

  public get length() {
    return Math.sqrt(this.x * this.x + this.y * this. y);
  }
}

class Obj {
  constructor(public readonly mass: number){}

  private position = new Vec2(0,0);
  private velocity = new Vec2(0,0);
  private forces: Vec2[] = [];

  public setPosition(position: Vec2) {
    this.position = position;
  }

  public setVelocity(velocity: Vec2) {
    this.velocity = velocity;
  }

  public getForces(){
    return this.forces;
  }

  public getVelocity() {
    return this.velocity;
  }

  public getPosition() {
     return this.position;
  }

  public applyForce(force: Vec2) {
    this.forces.push(force);
  }

  public update(dt: number) {
    const acceleration = this.resultingForce.divide(this.mass);
    this.velocity = acceleration.multiply(dt).add(this.velocity);
    this.position = this.velocity.multiply(dt).add(this.position);
    this.forces = [];
  }

  public get resultingForce() {
    return this.forces.reduce((a, c) => a.add(c), new Vec2(0,0));
  }
}

class Display {
  private ctx: CanvasRenderingContext2D; 
  public onClick?: (position: Vec2) => void;
  canvasBBox: ClientRect | DOMRect;
  public offset = 0;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if(!ctx) throw new Error();
    this.ctx = ctx;
    this.canvasBBox = canvas.getBoundingClientRect();
    canvas.onclick = e => {
      if(this.onClick) {
        const clickPos = this.fromCanvas(new Vec2(e.clientX - this.canvasBBox.left + this.offset, e.clientY - this.canvasBBox.top));
        this.onClick(clickPos);
      }
    };
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public renderTerrain(f: math.EvalFunction){
    const { ctx } = this;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for(let x = 0; x < this.canvas.width; x += 6) {
        ctx.lineTo(x, this.canvas.height - f.eval({x: x + this.offset}));
    }
    ctx.stroke();
  }

  public renderObj(obj: Obj) {
    const { ctx } = this;
    const size = 6;
    const forceDrawMultiplier = 30000;
    const canvasObjPos = this.toCanvas(obj.getPosition()).substract(new Vec2(this.offset, 0));
    ctx.beginPath();
    ctx.arc(canvasObjPos.x, canvasObjPos.y, size, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    const s = ctx.strokeStyle;
    ctx.strokeStyle = "#0000aa";
    obj.getForces().forEach(force => {
      ctx.moveTo(canvasObjPos.x, canvasObjPos.y);
      ctx.lineTo(canvasObjPos.x + force.x * forceDrawMultiplier, canvasObjPos.y - force.y * forceDrawMultiplier);
    });
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = "#dd2311";
    const sumForce = obj.resultingForce;
    ctx.moveTo(canvasObjPos.x, canvasObjPos.y);
    ctx.lineTo(canvasObjPos.x + sumForce.x * forceDrawMultiplier, canvasObjPos.y - sumForce.y * forceDrawMultiplier);
    ctx.stroke();
    ctx.strokeStyle = s;
    const ox = this.canvas.width / 2 - canvasObjPos.x;
    const dOffset = ox * ox / 10000;
    if(canvasObjPos.x > this.canvas.width / 2) {
      this.offset += dOffset;
    } else {
      this.offset -= dOffset;
    }
  }

  private fromCanvas(vec2: Vec2): Vec2 {
    return new Vec2(vec2.x, this.canvas.height - vec2.y);
  }

  private toCanvas(vec2: Vec2): Vec2 {
    return new Vec2(vec2.x, this.canvas.height - vec2.y);
  }
}

const gravity = (mass: number) => new Vec2(0, mass * -0.000098);

const terrainExprString = 'sin(x/30) * 30 + 100';
// const terrainExprString = ' ((x-400)/15)^2 + 125';
const terrainExpr = math.compile(terrainExprString);
const terrainExprDerivative = math.derivative(terrainExprString, 'x');

const collisionTheshold = 3;

class App extends Component {
  private cRef = React.createRef<HTMLCanvasElement>();
  private keyDown = false;

  public componentDidMount() {
    const obj = new Obj(10);
    obj.setPosition(new Vec2(450,150));

    if(!this.cRef.current) return;
    const display = new Display(this.cRef.current);
    document.addEventListener('keydown', e => {
      switch(e.keyCode) {
        case 32:
          this.keyDown = true;
          break;
        case 37:
          display.offset -= 10;
          break;
        case 39:
          display.offset += 10;
          break;
        default:
          console.log(e.keyCode);
      }
    });
    document.addEventListener('keyup', e => {
      switch(e.keyCode) {
        case 32:
          this.keyDown = false;
          break;
      }
    });
    display.onClick = (pos) => {
      obj.setPosition(pos);
      obj.setVelocity(new Vec2(0,0));
    };
    let lt = 0;
    let flag = false;
    const step  = (t: number) => {
      const objPos = obj.getPosition();
      const terrainY = terrainExpr.eval({x: objPos.x});
      if(objPos.y - terrainY < collisionTheshold) {
        const tg = terrainExprDerivative.eval({x: objPos.x});
        const θ = Math.atan(tg);
        const fN = gravity(obj.mass).multiply(Math.cos(θ) * obj.getVelocity().length * 100).rotate(θ - Math.PI);
        if(!flag) {
          const v = obj.getVelocity();
         // obj.setVelocity(new Vec2(v.x * Math.sin(θ), v.y * Math.cos(θ)));
          flag = true;
        }
        obj.applyForce(fN);
      } else {
        flag = false;
      }
      if(this.keyDown) obj.applyForce(gravity(obj.mass));
      obj.applyForce(gravity(obj.mass));

      display.clear();
      display.renderObj(obj);
      display.renderTerrain(terrainExpr);
      if(lt) {
        const dt = t - lt;
        obj.update(dt);
      }
      lt = t;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  render() {
    return (
      <canvas ref={this.cRef} width="900" height="900"/>
    );
  }
}

export default App;
