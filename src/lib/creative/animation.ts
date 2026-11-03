/** Deterministic, local-only animation of design layers. Values are stored in .cgdesign.
 * Time is measured in seconds relative to the start of an MP4 composition.
 */
import type {DesignNode} from './design';
export type MotionPoint={time:number;x:number;y:number;w:number;h:number;angle:number;opacity:number};
export type MotionPreset='fade'|'slide-left'|'slide-right'|'zoom'|'spin'|'none';
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
const properties=(n:DesignNode,time:number):MotionPoint=>({time,x:n.x,y:n.y,w:n.w,h:n.h,angle:n.angle,opacity:n.opacity});
/** Two editable timeline points, with smooth acceleration/deceleration. */
export function motionPreset(n:DesignNode,preset:MotionPreset,duration:number):MotionPoint[]{
 if(preset==='none')return [];
 const end=properties(n,clamp(duration,.2,20));const start={...end,time:0};
 if(preset==='fade')start.opacity=0;
 if(preset==='slide-left')start.x=end.x-Math.max(80,end.w*.5);
 if(preset==='slide-right')start.x=end.x+Math.max(80,end.w*.5);
 if(preset==='zoom'){start.w=end.w*.55;start.h=end.h*.55;start.x=end.x+(end.w-start.w)/2;start.y=end.y+(end.h-start.h)/2;start.opacity=0;}
 if(preset==='spin'){start.angle=end.angle-180;start.opacity=0;}
 return [start,end];
}
export function animateDesignNode(n:DesignNode,time:number):DesignNode{
 const frames=n.keyframes;
 if(!frames?.length||!Number.isFinite(time))return n;
 const sorted=[...frames].filter(p=>Number.isFinite(p.time)&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.w)&&Number.isFinite(p.h)&&Number.isFinite(p.angle)&&Number.isFinite(p.opacity)).sort((a,b)=>a.time-b.time);
 if(!sorted.length)return n;
 const first=sorted[0],last=sorted[sorted.length-1];
 if(time<=first.time)return {...n,...first};
 if(time>=last.time)return {...n,...last};
 const upper=sorted.findIndex(p=>p.time>=time);const a=sorted[upper-1],b=sorted[upper];
 const linear=clamp((time-a.time)/Math.max(.00001,b.time-a.time),0,1);
 const t=linear*linear*(3-2*linear); // smoothstep, no jump at either endpoint
 const lerp=(x:number,y:number)=>x+(y-x)*t;
 return {...n,x:lerp(a.x,b.x),y:lerp(a.y,b.y),w:lerp(a.w,b.w),h:lerp(a.h,b.h),angle:lerp(a.angle,b.angle),opacity:clamp(lerp(a.opacity,b.opacity),0,1)};
}
/** Updates a single keyframe from an element's currently edited geometry. */
export function withMotionPoint(n:DesignNode,time:number):DesignNode{
 const point=properties(n,clamp(time,0,20));
 return {...n,keyframes:[...(n.keyframes||[]).filter(x=>Math.abs(x.time-point.time)>.04),point].sort((a,b)=>a.time-b.time)};
}
