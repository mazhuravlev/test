import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as math from 'mathjs';
import { object } from 'prop-types';

interface Force extends Vec2 {}

interface Acceleration extends Vec2 {}

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
  private forces: {v: Vec2, t: number}[] = [];

  public setPosition(position: Vec2) {
    this.position = position;
  }

  public getPosition() {
     return this.position;
  }

  public applyForce(force: Force, time: number) {
    this.forces.push({v: force, t: time});
  }

  public update(dt: number) {
    this.forces = this.forces.filter(x => x.t > 0);
    const sumForce = this.forces.reduce((a, c) => {
      c.t -= dt;
      return c.t > 0 ? a.add(c.v) : a;
    }, new Vec2(0,0));
    const acceleration = sumForce.divide(this.mass);
    this.velocity = acceleration.multiply(dt).add(this.velocity);
    this.position = this.velocity.multiply(dt).add(this.position);
  }
}

class Display {
  private ctx: CanvasRenderingContext2D; 
  public onClick?: (position: Vec2) => void;
  canvasBBox: ClientRect | DOMRect;

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if(!ctx) throw new Error();
    this.ctx = ctx;
    this.canvasBBox = canvas.getBoundingClientRect();
    canvas.onclick = e => {
      if(this.onClick) {
        const clickPos = this.fromCanvas(new Vec2(e.clientX - this.canvasBBox.left, e.clientY - this.canvasBBox.top));
        this.onClick(clickPos);
      }
    };
  }

  public clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public renderObj(obj: Obj) {
    const size = 6;
    const canvasPos = this.toCanvas(obj.getPosition());
    this.ctx.beginPath();
    this.ctx.arc(canvasPos.x + size/2, canvasPos.y + size/2, size, 0, 2 * Math.PI);
    this.ctx.stroke();
  }

  private fromCanvas(vec2: Vec2): Vec2 {
    return new Vec2(vec2.x, this.canvas.height- vec2.y);
  }

  private toCanvas(vec2: Vec2): Vec2 {
    return new Vec2(vec2.x, this.canvas.height- vec2.y);
  }
}

const g = new Vec2(0, 9.8);

const terrainExprString = 'sin(x/20) * 20 + 100';
const terrainExpr = math.compile(terrainExprString);
const terrainExprDerivative = math.derivative(terrainExprString, 'x');

class App extends Component {
  private cRef = React.createRef<HTMLCanvasElement>();

  public componentDidMount() {
    const obj = new Obj(100);
    obj.setPosition(new Vec2(450,450));

    const obj2 = new Obj(1000);
    obj2.setPosition(new Vec2(100,100));

    if(!this.cRef.current) return;
    const display = new Display(this.cRef.current);
    display.onClick = (pos) => {
      const v = obj.getPosition().substract(pos).normalize();
      obj.applyForce(v.multiply(.01), 100);
    };
    let lt = 0;
    const step  = (t: number) => {
      if(lt) {
        const dt = t - lt;
        obj.update(dt);
        const v = obj.getPosition().substract(obj2.getPosition());
        obj2.applyForce(v.normalize().divide(v.length), dt + 1);
        obj2.update(dt);
      }
      lt = t;
      display.clear();
      display.renderObj(obj);
      display.renderObj(obj2);
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
// \\
// private renderCanvas = (ctx: CanvasRenderingContext2D, mousePos : Pt2, obj: Obj) => {
//   ctx.beginPath();
//   ctx.moveTo(0, 0);
//   for(let x = 0; x < 900; x += 6) {
//       ctx.lineTo(x, Math.sin(x/20) * 20 + 100);
//   }
//   ctx.stroke();
//   if(mousePos) {
//     const s = 6;
//     ctx.beginPath();
//     ctx.arc(obj.position.x + s/2, obj.position.y + s/2, s, 0, 2 * Math.PI);
//     ctx.stroke();
//     const y = Math.sin(mousePos.x/20) * 20 + 100;
//     const tg = d.eval({x: mousePos.x});
//     ctx.moveTo(mousePos.x - 50, y - 50 * tg);
//     ctx.lineTo(mousePos.x  + 50, y + 50 * tg);
//     ctx.stroke();
//   }
// }

// public componentDidMount() {
//   if(!this.cRef.current) return;
//   const canvas = this.cRef.current;
//   const ctx = canvas.getContext('2d');
//   if(!ctx) return;
//   const canvasBbox = canvas.getBoundingClientRect();
//   let pt = 0;
//   let mousePos: Pt2 =  {x :0, y: 0};  
//   const obj: Obj = {position: {x: 100, y: 10}, velocity: {x: 0, y: 0.001}}
//   const step  = (t: number) => {
//     if(pt && ctx) {
//       const dt = t - pt;

//       const y = Math.sin(obj.position.x/20) * 20 + 100;
//       if(Math.abs(y - obj.position.y) < 6/2) {
//         const tg = d.eval({x: obj.position.x});
//       }
//       obj.velocity.y += 0.001;
//       obj.position.y += obj.velocity.y * dt;


//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       this.renderCanvas(ctx, mousePos, obj);
//     }
//     pt = t;
//     requestAnimationFrame(step);
//   }
//   requestAnimationFrame(step);
//   canvas.onmousemove = e => {
//     mousePos.x = e.clientX - canvasBbox.left;
//     mousePos.y = e.clientY - canvasBbox.top;
//   };
// }
