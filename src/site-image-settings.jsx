import React,{useEffect,useState} from 'react';
import {adminRequest,apiUrl} from './lib/api';

const slots=[['logo','NGO logo'],['favicon','Browser icon'],['hero','Homepage hero photograph']];

function ImageEditor({slot,label}){
 const route='/api/admin/site-images/'+slot;
 const [record,setRecord]=useState(null);
 const [reviewed,setReviewed]=useState(null);
 const [busy,setBusy]=useState(false);
 const [status,setStatus]=useState('');
 useEffect(()=>{
  let active=true;
  adminRequest(route).then(data=>{if(active)setRecord(data)}).catch(()=>{if(active)setStatus('Unable to load image settings.')});
  return()=>{active=false};
 },[route]);

 async function update(method,suffix,body){
  setBusy(true);
  setStatus('');
  try{
   await adminRequest(route+suffix,{method,body});
   setReviewed(null);
   setRecord(await adminRequest(route));
   setStatus(method==='PUT'?'Image saved as a private draft.':'Image published.');
  }catch(error){
   setReviewed(null);
   setStatus(error.status===409?'The draft changed. Reload the page and review the latest image.':'Unable to update the image. Check the file and your session.');
  }finally{setBusy(false)}
 }

 return <section className="admin-card">
  <h3>{label}</h3>
  {record?.public_id&&<img src={apiUrl('/api/site-images/'+record.public_id)} alt={label+' currently published'} style={{maxWidth:'min(100%, 240px)'}}/>}
  <form onSubmit={event=>{
   event.preventDefault();
   update('PUT','',new FormData(event.currentTarget));
  }}>
   <label>{label} file<input required name="image" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||!record}/></label>
   <button disabled={busy||!record}>Save image draft</button>
  </form>
  {record?.draft_id&&<img src={apiUrl(route+'/preview/'+record.draft_id)} alt={label+' draft preview'}
   style={{maxWidth:'min(100%, 240px)'}} onLoad={()=>setReviewed(record.draft_id)} onError={()=>setReviewed(null)}/>}
  <button type="button" disabled={busy||!reviewed||reviewed!==record?.draft_id} onClick={()=>update('POST','/publish',{id:reviewed})}>Publish previewed image</button>
  {status&&<p role="status">{status}</p>}
 </section>;
}

export function SiteImageSettings(){
 return <section aria-label="Brand and homepage images"><h2>Brand and homepage images</h2>
  <p>Choose a JPEG, PNG or WebP up to 5 MB. Use images approved for public display.</p>
  {slots.map(([slot,label])=><ImageEditor key={slot} slot={slot} label={label}/>)}
 </section>;
}
