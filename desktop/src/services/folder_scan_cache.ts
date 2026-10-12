import { SCAN_RETENTION_MS } from './scan_retention';
export class FolderScanCache<T> {
  private entries = new Map<string, { value:T; completedAt:number; revision:number }>();
  private now:()=>number;
  private capacity:number;
  constructor(now:()=>number=Date.now, capacity=16) {this.now=now;this.capacity=capacity;}
  get(path:string, revision:number):T|undefined {
    const entry=this.entries.get(path);
    if (!entry || entry.revision!==revision || this.now()-entry.completedAt>=SCAN_RETENTION_MS) {this.entries.delete(path);return;}
    this.entries.delete(path);this.entries.set(path,entry);return entry.value;
  }
  put(paths:string[],value:T,revision:number) {
    for (const path of new Set(paths)) {
      this.entries.delete(path);this.entries.set(path,{value,completedAt:this.now(),revision});
      while(this.entries.size>this.capacity)this.entries.delete(this.entries.keys().next().value!);
    }
  }
  async resolve(path:string,revision:number,ticket:string,load:(ticket:string,path:string)=>Promise<T|null>):Promise<T|undefined> {
    const cached=this.get(path,revision);if(cached!==undefined)return cached;
    if(!ticket)return;
    const value=await load(ticket,path);if(value===null)return;
    this.put([path],value,revision);return value;
  }
  clear(){this.entries.clear();}
}
