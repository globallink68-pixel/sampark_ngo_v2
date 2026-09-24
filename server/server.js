import'./config/env.js';import{createApp}from'./app.js';const app=createApp();app.listen(process.env.PORT||3000,()=>console.log('Server listening'));
