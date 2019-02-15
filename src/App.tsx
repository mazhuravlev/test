import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import * as math from 'mathjs';
import { object } from 'prop-types';

interface Pt2 {
  x: number;
  y: number;
}

interface Obj {
  position: Pt2;
  velocity: Pt2;
}

const d = math.derivative('sin(x/20) * 20 + 100', 'x');

class App extends Component {
  private cRef = React.createRef<HTMLCanvasElement>();

  private renderCanvas = (ctx: CanvasRenderingContext2D, mousePos : Pt2, obj: Obj) => {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for(let x = 0; x < 900; x += 6) {
        ctx.lineTo(x, Math.sin(x/20) * 20 + 100);
    }
    ctx.stroke();
    if(mousePos) {
      const s = 6;
      ctx.beginPath();
      ctx.arc(obj.position.x + s/2, obj.position.y + s/2, s, 0, 2 * Math.PI);
      ctx.stroke();
      const y = Math.sin(mousePos.x/20) * 20 + 100;
      const tg = d.eval({x: mousePos.x});
      ctx.moveTo(mousePos.x - 50, y - 50 * tg);
      ctx.lineTo(mousePos.x  + 50, y + 50 * tg);
      ctx.stroke();
    }
  }

  public componentDidMount() {
    if(!this.cRef.current) return;
    const canvas = this.cRef.current;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const canvasBbox = canvas.getBoundingClientRect();
    let pt = 0;
    let mousePos: Pt2 =  {x :0, y: 0};  
    const obj: Obj = {position: {x: 100, y: 10}, velocity: {x: 0, y: 0.001}}
    const step  = (t: number) => {
      if(pt && ctx) {
        const dt = t - pt;

        const y = Math.sin(obj.position.x/20) * 20 + 100;
        if(Math.abs(y - obj.position.y) < 6/2) {
          const tg = d.eval({x: obj.position.x});
        }
        obj.velocity.y += 0.001;
        obj.position.y += obj.velocity.y * dt;


        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.renderCanvas(ctx, mousePos, obj);
      }
      pt = t;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    canvas.onmousemove = e => {
      mousePos.x = e.clientX - canvasBbox.left;
      mousePos.y = e.clientY - canvasBbox.top;
    };
  }

  render() {
    return (
      <canvas ref={this.cRef} width="900" height="400"/>
    );
  }
}

export default App;
