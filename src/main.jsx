import React from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter,Route,Routes,useLocation} from 'react-router-dom';
import {AdminDonations,AdminGallery,AdminGate,AdminHome,AdminLogin,AdminMembers,AdminMessages,AdminOrganization,AdminPrograms,AdminShell} from './admin';
import {PublicRoutes} from './public';
import {AdminApplications,AdminContent,AdminAudit} from './workflows-admin';
import './bootstrap.min.css';
import './reference-site.css';
import './reference-sampark.css';
import './public-compat.css';
export function App(){const location=useLocation();const admin=page=><div className="admin-view"><AdminGate><AdminShell>{page}</AdminShell></AdminGate></div>;if(!location.pathname.startsWith('/admin'))return <PublicRoutes/>;return <Routes><Route path="/admin/login" element={<div className="admin-view"><AdminLogin/></div>}/>{[['',<AdminHome/>],['gallery',<AdminGallery/>],['members',<AdminMembers/>],['programs',<AdminPrograms/>],['organization',<AdminOrganization/>],['messages',<AdminMessages/>],['donations',<AdminDonations/>],['applications',<AdminApplications/>],['content',<AdminContent/>],['audit',<AdminAudit/>]].map(([path,page])=><Route key={path} path={'/admin'+(path?'/'+path:'')} element={admin(page)}/>)}</Routes>}
createRoot(document.getElementById('root')).render(<BrowserRouter><App/></BrowserRouter>);
import './site-refresh.css';
