export type ScanAccessStatus = {
  platform:string; status:'access_confirmed'|'restricted'|'unverified'|'not_required';
  evidence:string; app_bundle_path:string|null; signing_kind:string; version:string; detail?:string;
};
export type AccessScope='quick'|'detailed'|'uninstaller'|'orphans'|'space_lens';
export type AccessSnapshot={status:ScanAccessStatus|null;checking:boolean;error:string|null;requestedScopes:AccessScope[]};
export class ScanAccessDeferred extends Error {constructor(){super('Chưa bắt đầu quét. Có thể cấp Full Disk Access trong Cài đặt → Hệ thống.');this.name='ScanAccessDeferred';}}
export const isScanAccessDeferred=(error:unknown):boolean=>error instanceof ScanAccessDeferred;
const permitted=(status:ScanAccessStatus)=>status.status==='access_confirmed'||status.status==='not_required';
/** Coordinates UX only. OS permissions and native deletion policy remain authoritative. */
export class ScanAccessCoordinator {
  private snapshot:AccessSnapshot={status:null,checking:false,error:null,requestedScopes:[]};
  private listeners=new Set<()=>void>();
  private reader:()=>Promise<ScanAccessStatus>;
  private checking:Promise<ScanAccessStatus>|null=null;
  private pending:{promise:Promise<boolean>;resolve:(ready:boolean)=>void}|null=null;
  constructor(reader:()=>Promise<ScanAccessStatus>){this.reader=reader;}
  getSnapshot=()=>this.snapshot;
  subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener);};};
  private update(patch:Partial<AccessSnapshot>){this.snapshot={...this.snapshot,...patch};for(const listener of this.listeners)listener();}
  refresh=():Promise<ScanAccessStatus>=>{
    if(this.checking)return this.checking;
    this.update({checking:true,error:null});
    const work=Promise.resolve().then(()=>this.reader()).then(status=>{
      if(!['access_confirmed','restricted','unverified','not_required'].includes(status.status))throw new Error('Trạng thái quyền không hợp lệ');
      this.update({status,checking:false,error:status.detail??null});
      if(permitted(status)&&this.pending){const pending=this.pending;this.pending=null;this.update({requestedScopes:[]});pending.resolve(true);}
      return status;
    }).catch(error=>{
      const status:ScanAccessStatus={platform:this.snapshot.status?.platform??'unknown',status:'unverified',evidence:'check_failed',app_bundle_path:this.snapshot.status?.app_bundle_path??null,signing_kind:this.snapshot.status?.signing_kind??'unknown',version:this.snapshot.status?.version??''};
      this.update({status,checking:false,error:error instanceof Error?error.message:String(error)});return status;
    }).finally(()=>{this.checking=null;});
    this.checking=work;return work;
  };
  defer=()=>{const pending=this.pending;this.pending=null;this.update({requestedScopes:[]});pending?.resolve(false);};
  async ensure(scope:AccessScope,cancelled:()=>boolean=()=>false,interactive=true):Promise<void>{
    if(cancelled())throw new Error('Đã hủy quét.');
    const status=await this.refresh();
    if(cancelled())throw new Error('Đã hủy quét.');
    if(permitted(status))return;
    if(!interactive)throw new Error('Quyền truy cập đã thay đổi. Chưa quét lại; hãy kiểm tra Full Disk Access trước khi dọn tiếp.');
    if(!this.pending){let resolve!:(ready:boolean)=>void;const promise=new Promise<boolean>(done=>{resolve=done;});this.pending={promise,resolve};}
    const pending=this.pending;
    this.update({requestedScopes:[...new Set([...this.snapshot.requestedScopes,scope])]});
    const ready=await pending.promise;
    if(!ready||cancelled())throw new ScanAccessDeferred();
  }
}
