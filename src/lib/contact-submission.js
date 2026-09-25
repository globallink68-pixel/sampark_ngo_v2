export const contactStatus=(phase='idle',message='',kind='')=>({phase,message:phase==='error'||phase==='success'?message:'',kind:phase==='error'?kind:''});
export const beginContactSubmission=()=>contactStatus('submitting');
export const contactSubmissionSucceeded=()=>contactStatus('success','Thank you. Your enquiry has been submitted successfully.');
export const contactSubmissionFailed=(message,kind='submission')=>contactStatus('error',message,kind);
export const contactTurnstileFailed=(status,message)=>['submitting','success'].includes(status.phase)?status:contactSubmissionFailed(message,'turnstile');
export const clearTurnstileErrorOnToken=(status,token)=>token&&status.phase==='error'&&status.kind==='turnstile'?contactStatus():status;
export const canStartContactSubmission=status=>status.phase!=='submitting';
