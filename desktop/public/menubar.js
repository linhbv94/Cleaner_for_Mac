const invoke=window.__TAURI__.core.invoke, listen=window.__TAURI__.event.listen;
const el=id=>document.getElementById(id);let active=false,inflight=false,timer=null,history=[],lastGood=null;
const bytes=n=>{if(n===0)return '0 B';const i=Math.floor(Math.log(n)/Math.log(1000));return parseFloat((n/Math.pow(1000,i)).toFixed(2))+' '+['B','KB','MB','GB','TB'][i];};
const percent=f=>Math.round(Math.max(0,Math.min(1,f))*100)+'%';
function theme(){const setting=localStorage.getItem('vxclean_theme')||'system';document.documentElement.classList.toggle('dark',setting==='dark'||(setting==='system'&&matchMedia('(prefers-color-scheme:dark)').matches));}
theme();addEventListener('storage',theme);matchMedia('(prefers-color-scheme:dark)').addEventListener('change',theme);
async function sample(){if(!active||inflight)return;inflight=true;try{
 const [s,status]=await Promise.all([invoke('get_system_snapshot'),invoke('get_operation_status')]);lastGood=s;const m=s.metrics;
 el('cpu').textContent=percent(m.cpu.usage);history.push(m.cpu.usage);history=history.slice(-20);el('spark').setAttribute('points',history.map((v,i)=>`${i*300/Math.max(1,history.length-1)},${35-Math.max(0,Math.min(1,v))*33}`).join(' '));
 el('ram').textContent=`${bytes(m.memory.used_bytes)} / ${bytes(m.memory.total_bytes)}`;el('ram_bar').style.width=percent(m.memory.fraction);
 el('breakdown').textContent=`Active ${bytes(m.memory.active_bytes)} · Wired ${bytes(m.memory.wired_bytes)} · Compressed ${bytes(m.memory.compressed_bytes)}`;
 el('disk').textContent=`${bytes(m.disk.used_bytes)} / ${bytes(m.disk.total_bytes)}`;el('disk_bar').style.width=percent(m.disk.fraction);el('available').textContent=`Khả dụng: ${bytes(m.disk.available_bytes)}`;
 el('battery_row').hidden=!m.battery.has_battery;el('battery').textContent=`${m.battery.charge_percent}% · ${m.battery.is_charging?'Đang sạc':m.battery.is_ac_powered?'Nguồn điện':'Dùng pin'}`;
 el('updated').textContent=new Date(s.timestamp).toLocaleTimeString();el('status').textContent=status.mutation_active?'Đang dọn dữ liệu':status.read_active?'Đang quét':'Chưa quét / mở app để xem kết quả';el('quick').disabled=status.mutation_active;el('error').hidden=true;
 }catch(e){el('error').hidden=false;el('error').textContent=(lastGood?'Dữ liệu cũ · ':'')+String(e);}
 finally{inflight=false;clearTimeout(timer);if(active)timer=setTimeout(sample,5000);}}
function start(){active=true;theme();clearTimeout(timer);void sample();}function stop(){active=false;clearTimeout(timer);}
void listen('panel-open',start);addEventListener('focus',start);addEventListener('blur',stop);
addEventListener('keydown',e=>{if(e.key==='Escape'){stop();void invoke('menubar_action',{action:'hide'});}});
for(const id of ['quick','open','settings'])el(id).addEventListener('click',async()=>{try{await invoke('menubar_action',{action:id});stop();}catch(e){el('error').hidden=false;el('error').textContent=String(e);}});
