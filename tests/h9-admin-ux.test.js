import{describe,it,expect,vi}from'vitest';
import{readFileSync}from'node:fs';
import{adminRequest,AdminApiError}from'../src/lib/api.js';
import{performAdminMutation}from'../src/lib/admin-mutation.js';

describe('H9 admin mutation behavior',()=>{
  it('treats a successful empty mutation response as success',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:true,status:201,json:async()=>{throw Error('empty body')}});await expect(adminRequest('/api/admin/programs',{method:'POST',body:{title:'Program'},fetcher})).resolves.toBeNull()});
  it('keeps a successful program mutation successful when its list refresh fails',async()=>{const success=vi.fn(),refreshError=vi.fn(),error=vi.fn();const result=await performAdminMutation({request:vi.fn().mockResolvedValue({id:1}),refresh:vi.fn().mockRejectedValue(Error('temporary read failure')),onSuccess:success,onRefreshError:refreshError,onError:error});expect(result).toMatchObject({ok:true,result:{id:1}});expect(success).toHaveBeenCalledOnce();expect(refreshError).toHaveBeenCalledOnce();expect(error).not.toHaveBeenCalled()});
  it('reports genuine program request failures without claiming success',async()=>{const success=vi.fn(),error=vi.fn();const result=await performAdminMutation({request:vi.fn().mockRejectedValue(new AdminApiError(400,'Invalid program')),refresh:vi.fn(),onSuccess:success,onError:error});expect(result.ok).toBe(false);expect(success).not.toHaveBeenCalled();expect(error).toHaveBeenCalledOnce()});
  it('uses the same success path for organization saves and clears an old operation error before requests',async()=>{const success=vi.fn();await expect(performAdminMutation({request:vi.fn().mockResolvedValue({organization_name:'Sampark'}),onSuccess:success,onError:vi.fn()})).resolves.toMatchObject({ok:true});expect(success).toHaveBeenCalledOnce();const source=readFileSync('src/admin.jsx','utf8');expect(source).toContain("if(busy)return false;setBusy(busyLabel);setError('')");expect(source).toContain("setSaving(true);settings.setError('')")});
  it('rejects non-2xx responses while retaining safe server validation text',async()=>{const fetcher=vi.fn().mockResolvedValue({ok:false,status:400,json:async()=>({error:'Invalid email address'})});await expect(adminRequest('/api/admin/organization',{method:'PUT',body:{},fetcher})).rejects.toMatchObject({status:400,safeMessage:'Invalid email address'})});
  it('prevents duplicate in-flight submissions in the shared CRUD hook implementation',()=>{const source=readFileSync('src/admin.jsx','utf8');expect(source).toContain('if(busy)return false');const editor=readFileSync('src/record-draft-editor.jsx','utf8');expect(editor).toContain('if(inFlight.current)return');expect(editor).toContain('fieldset disabled={busy}')});
  it('retains compatible Gallery and Member multipart mutation routes',async()=>{
   const server=readFileSync('server/app.js','utf8');
   expect(server).toContain("['gallery',['title'");
   expect(server).toContain("['members',['name'");
   expect(server).toContain("app.put(`/api/admin/${kind}/:id`,admin,sameOrigin,upload(kind).single('image')");
   const editor=readFileSync('src/record-draft-editor.jsx','utf8');
   expect(editor).toContain("const route='/api/admin/record-drafts/'+collection");
   expect(editor).toContain("body.set('image',file)");
  });
});