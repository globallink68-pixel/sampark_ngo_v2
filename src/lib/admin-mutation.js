export async function performAdminMutation({request,refresh,onSuccess,onRefreshError,onError}){
  try{
    const result=await request();
    onSuccess(result);
    if(refresh)try{await refresh()}catch(error){onRefreshError?.(error)}
    return{ok:true,result};
  }catch(error){onError(error);return{ok:false,error}}
}
