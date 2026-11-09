import React,{useEffect,useState} from 'react';
import {adminRequest} from './lib/api';
import {SiteImageSettings} from './site-image-settings';
function useRows(url){const [rows,setRows]=useState([]),[error,setError]=useState('');const load=()=>adminRequest(url).then(setRows).catch(()=>setError('Unable to load records.'));useEffect(()=>{load()},[url]);return {rows,error,load,setError};}
export function AdminApplications(){const [offset,setOffset]=useState(0);const {rows,error,load,setError}=useRows('/api/admin/applications?offset='+offset);async function update(id,status){try{await adminRequest(`/api/admin/applications/${id}`,{method:'PUT',body:{status}});load()}catch{setError('Unable to save application status.')}}return <section className="admin-panel"><h2>Applications</h2><p>Private applicant information. Do not share outside authorised staff.</p><div><button disabled={offset===0} onClick={()=>setOffset(Math.max(0,offset-100))}>Previous page</button><span> Page {offset/100+1} </span><button disabled={rows.length<100} onClick={()=>setOffset(offset+100)}>Next page</button></div>{error&&<p role="alert">{error}</p>}{rows.map(r=><article className="admin-card" key={r.id}><h3>{r.name} · {r.kind}</h3><p>{r.email} · {r.mobile}</p><p className="preserve-lines">{r.message}</p><label>Status<select aria-label={`Status for application ${r.id}`} value={r.status} onChange={e=>update(r.id,e.target.value)}>{['new','contacted','accepted','closed'].map(s=><option key={s}>{s}</option>)}</select></label></article>)}</section>}
export function AdminContent(){
 const {rows,error,load}=useRows('/api/admin/content');
 const [record,setRecord]=useState({slug:'',title:'',body:'',kind:'page',published:false});
 const [status,setStatus]=useState('');
 const [preview,setPreview]=useState(null);
 const [busy,setBusy]=useState(false);
 const route='/api/admin/content/'+encodeURIComponent(record.slug);
 const validSlug=/^[a-z0-9-]{1,100}$/.test(record.slug);
 const change=(key,value)=>{setRecord(current=>({...current,[key]:value}));setPreview(null);setStatus('')};
 async function run(action){
  setBusy(true);
  setStatus('');
  try{
   if(action==='save'){
    await adminRequest(route+'/draft',{method:'PUT',body:record});
    setPreview(null);
    setStatus('Draft saved.');
   }else if(action==='preview'){
    const draft=await adminRequest(route+'/draft');
    setRecord(current=>({...current,...draft}));
    setPreview(draft);
   }else if(action==='publish'){
    await adminRequest(route+'/draft/publish',{method:'POST',body:preview});
    setPreview(null);
    setStatus('Draft published.');
    await load();
   }else{
    await adminRequest(route,{method:'PUT',body:{...record,published:false}});
    setPreview(null);
    setStatus('Page unpublished.');
    await load();
   }
  }catch(error){
   setStatus(error.status===409?'The draft changed. Load its preview again before publishing.':'Unable to complete this action. Check the page slug, content and your session.');
  }finally{setBusy(false)}
 }
 return <section className="admin-panel">
  <SiteImageSettings/><h2>Content and policies</h2>
  <p>Save plain text as a draft, review the saved version, then publish it. To reopen a new draft, enter its slug and load the preview.</p>
  {error&&<p role="alert">{error}</p>}
  <label>Existing page<select disabled={busy} defaultValue="" onChange={event=>{
   const page=rows.find(row=>row.slug===event.target.value);
   if(page){setRecord({...page,published:!!page.published});setPreview(null);setStatus('')}
  }}><option value="">Choose record</option>{rows.map(row=><option key={row.slug}>{row.slug}</option>)}</select></label>
  <form onSubmit={event=>{event.preventDefault();run('save')}}>
   <fieldset disabled={busy}>
    <label>Slug<input required value={record.slug} pattern="[a-z0-9\-]{1,100}" maxLength={100} onChange={event=>change('slug',event.target.value)}/></label>
    <label>Title<input required value={record.title} maxLength={160} onChange={event=>change('title',event.target.value)}/></label>
    <label>Type<select value={record.kind} onChange={event=>change('kind',event.target.value)}>{['page','policy','campaign','activity','setting'].map(kind=><option key={kind}>{kind}</option>)}</select></label>
    <label>Body<textarea required rows="12" maxLength={30000} value={record.body} onChange={event=>change('body',event.target.value)}/></label>
    <button className="btn btn-green">Save draft</button>
    <button type="button" disabled={!validSlug} onClick={()=>run('preview')}>Load saved preview</button>
    <button type="button" disabled={!preview} onClick={()=>run('publish')}>Publish previewed draft</button>
    {rows.some(row=>row.slug===record.slug&&row.published)&&<button type="button" onClick={()=>run('unpublish')}>Unpublish current page</button>}
   </fieldset>
  </form>
  {status&&<p role="status">{status}</p>}
  {preview&&<article className="admin-card" aria-label="Private draft preview"><h3>{preview.title}</h3><p className="preserve-lines">{preview.body}</p></article>}
 </section>
}
export function AdminAudit(){const {rows,error}=useRows('/api/admin/audit');return <section className="admin-panel"><h2>Audit history</h2>{error&&<p role="alert">{error}</p>}<div className="admin-table-wrap"><table><thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Resource</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.created_at}</td><td>{r.admin_id}</td><td>{r.action}</td><td>{r.resource}</td></tr>)}</tbody></table></div></section>}

