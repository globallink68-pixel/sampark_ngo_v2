import React,{useCallback,useEffect,useRef,useState} from 'react';
import {adminRequest,apiUrl,publicImageUrl} from './lib/api';

const specs={
 members:{heading:'Member management',title:'name',image:'photo_path',fields:[
  ['name','Name',120,true],['designation','Designation',80,true],['bio','Biography',2000],['category','Category',80]
 ]},
 programs:{heading:'Program management',title:'title',image:'image_path',fields:[
  ['title','Title',160,true],['short_description','Short description',500],['description','Full description',10000],
  ['location','Location',255],['category','Category',80],['start_date','Start date','date'],['end_date','End date','date'],
  ['status','Status',['upcoming','ongoing','completed']]
 ]},
 gallery:{heading:'Gallery management',title:'title',image:'image_path',fields:[
  ['title','Title',160,true],['description','Caption',10000],['album','Album',80],['event_date','Event date','date']
 ]},
 certificates:{heading:'Certificates',title:'title',image:'image_path',verified:true,fields:[['title','Title',160,true],['description','Description',4000]]},
 donations:{heading:'Manual donation details',title:'title',image:'image_path',verified:true,fields:[
  ['title','Title',160,true],['bank_name','Bank name',120],['account_holder','Account holder',160],
  ['account_number','Account number',34],['ifsc','IFSC',11],['upi_id','UPI ID',120],['description','Instructions',4000]
 ]}
};

function Field({field,record}){
 const [name,label,type,required]=field;
 const value=record?.[name]??'';
 return <label>{label}{Array.isArray(type)?
  <select name={name} defaultValue={value||type[0]}>{type.map(option=><option key={option}>{option}</option>)}</select>:
  type==='date'?<input name={name} type="date" defaultValue={value.slice(0,10)}/>:
  type>=500?<textarea name={name} defaultValue={value} maxLength={type}/>:
  <input name={name} defaultValue={value} maxLength={type} required={required}/>}
 </label>;
}

export function RecordDraftEditor({collection}){
 const spec=specs[collection];
 const route='/api/admin/record-drafts/'+collection;
 const legacy=spec.verified?route+'/current/list':'/api/admin/'+collection;
 const [rows,setRows]=useState([]);
 const [drafts,setDrafts]=useState([]);
 const [selected,setSelected]=useState(null);
 const [preview,setPreview]=useState(null);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [ready,setReady]=useState(false);
 const inFlight=useRef(false);

 const load=useCallback(async()=>{
  const [current,pending]=await Promise.all([adminRequest(legacy),adminRequest(route)]);
  setRows(current);
  setDrafts(pending);
  setReady(true);
  return pending;
 },[legacy,route]);
 useEffect(()=>{load().catch(()=>setStatus('Unable to load records.'))},[load]);

 function edit(selection){
  setSelected(selection);
  setPreview(null);
  setStatus('');
 }

 async function run(action){
  if(inFlight.current)return;
  inFlight.current=true;
  setBusy(true);
  setStatus('');
  try{await action()}catch(error){
   setStatus(error.status===409?'This revision or the current record changed. Reload and review the latest version.':
    error.status===422?'Attach the required image or supply complete manual donation details before publishing.':'Unable to complete this action. Check the details and your session.');
  }finally{inFlight.current=false;setBusy(false)}
 }

 function save(event){
  event.preventDefault();
  const form=new FormData(event.currentTarget);
  const record=Object.fromEntries(spec.fields.map(([key])=>[key,form.get(key)]));
  record.display_order=Number(form.get('display_order'));
  record.active=form.has('active');
  record.public_visible=form.has('public_visible');
  if(spec.verified)record.verified=form.has('verified');
  const body=new FormData();
  body.set('record',JSON.stringify(record));
  const file=form.get('image');
  if(file?.size)body.set('image',file);
  run(async()=>{
   const draft=selected?.draft;
   const url=draft?route+'/'+draft.id+'?revision='+draft.revision:
    selected?.row?route+'?target='+selected.row.id:route;
   const saved=await adminRequest(url,{method:draft?'PUT':'POST',body});
   const pending=await load();
   edit({draft:pending.find(item=>item.id===saved.id)});
   setStatus('Private draft saved.');
  });
 }

 const draft=selected?.draft;
 const record=draft?.record??selected?.row;
 const existing=draft?.target_id?rows.find(row=>String(row.id)===String(draft.target_id)):selected?.row;
 const currentPath=existing?.[spec.image];
 const image=draft?.has_image?apiUrl(route+'/'+draft.id+'/image?revision='+draft.revision):
  currentPath?.startsWith('api/site-images/')?apiUrl(route+'/current/'+existing.id+'/image'):publicImageUrl(currentPath);
 return <section className="section">
  <h1>{spec.heading}</h1>
  <p>Save changes privately, review the saved record, then publish it. Clear public visibility to keep the record off the website.</p>
  <button type="button" disabled={busy||!ready} onClick={()=>edit({})}>New draft</button>
  {status&&<p role="status">{status}</p>}
  {selected&&<form key={draft?.revision??selected.row?.id??'new'} onSubmit={save} onChange={()=>setPreview(null)}>
   <fieldset disabled={busy}>
    {spec.fields.map(field=><Field key={field[0]} field={field} record={record}/>)}
    <label>Display order<input name="display_order" type="number" min="-1000000" max="1000000" defaultValue={record?.display_order??0}/></label>
    <label><input name="active" type="checkbox" defaultChecked={Boolean(record?.active??true)}/> Active</label>
    <label><input name="public_visible" type="checkbox" defaultChecked={Boolean(record?.public_visible??false)}/> Public visibility</label>
    {spec.verified&&<label><input name="verified" type="checkbox" defaultChecked={Boolean(record?.verified)}/> I verified the source and approved these details and the image for public display</label>}
    {collection==='certificates'&&<p>Upload only a redacted public copy.</p>}
    {collection==='donations'&&<p>Upload only the approved recipient QR. Confirm the encoded recipient in a banking app before publishing.</p>}
    <label>Image<input name="image" type="file" accept="image/jpeg,image/png,image/webp"/></label>
    <button>Save private draft</button>
    {draft&&<button type="button" onClick={()=>setPreview(draft.revision)}>Preview saved draft</button>}
   </fieldset>
  </form>}
  {draft&&preview===draft.revision&&<article className="admin-card" aria-label="Private record preview">
   <h2>{draft.record[spec.title]}</h2>
   {image&&<img src={image} alt="Draft image preview" style={{maxWidth:'min(100%, 240px)'}}/>}
   <dl>{spec.fields.map(([key,label])=><React.Fragment key={key}><dt>{label}</dt><dd className="preserve-lines">{draft.record[key]||'—'}</dd></React.Fragment>)}</dl>
   <p>{draft.record.active&&draft.record.public_visible?'Visible on the public site':'Hidden from the public site'} · Order {draft.record.display_order}</p>
   <button type="button" disabled={busy} onClick={()=>run(async()=>{
    await adminRequest(route+'/'+draft.id+'/publish',{method:'POST',body:{revision:preview}});
    edit(null);
    await load();
    setStatus('Reviewed draft published.');
   })}>Publish reviewed draft</button>
  </article>}
  <h2>Saved drafts</h2>
  <ul>{drafts.map(item=><li key={item.id}>
   <button type="button" disabled={busy} onClick={()=>edit({draft:item})}>{item.record[spec.title]}</button>
   <button type="button" disabled={busy} onClick={()=>run(async()=>{
    await adminRequest(route+'/'+item.id+'?revision='+item.revision,{method:'DELETE'});
    if(draft?.id===item.id)edit(null);
    await load();
    setStatus('Draft discarded.');
   })}>Discard draft</button>
  </li>)}</ul>
  <h2>Current records</h2>
  <div className="cards">{rows.map(row=><article key={row.id}>
   <h3>{row[spec.title]}</h3>
   <p>{row.active&&row.public_visible?'Public':'Hidden'} · Order {row.display_order}</p>
   <button type="button" disabled={busy} onClick={()=>edit({row})}>Edit as draft</button>
   {!spec.verified&&<button type="button" disabled={busy} onClick={()=>{
    if(!confirm('Delete '+row[spec.title]+'?'))return;
    run(async()=>{await adminRequest(legacy+'/'+row.id,{method:'DELETE'});edit(null);await load();setStatus('Record deleted.')});
   }}>Delete</button>}
  </article>)}</div>
 </section>;
}
