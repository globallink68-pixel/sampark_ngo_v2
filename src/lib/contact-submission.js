export const contactStatus=(phase='idle',message='',kind='')=>({phase,message:phase==='error'||phase==='success'?message:'',kind:phase==='error'?kind:''});
export const beginContactSubmission=()=>contactStatus('submitting');
export const contactSubmissionSucceeded=()=>contactStatus('success','Thank you. Your enquiry has been submitted successfully.');
export const contactSubmissionFailed=(message,kind='submission')=>contactStatus('error',message,kind);
export const canStartContactSubmission=status=>status.phase!=='submitting';
