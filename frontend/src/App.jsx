import './App.css'
import 'bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import VolunteerDashboard from './components/VolunteerDashboard'
import OrganizationDashboard from './components/OrganizationDashboard'
import OrgSetup from './components/OrgSetup'
import UserCredentialForm from './components/UserCredentialForm';
import Navbar from './components/Navbar';
import ProfilePage from './components/ProfilePage';

import { supabase } from './util/api/supabaseClient';
import { useEffect, useState } from 'react';

function App() {
    // holds the supabase auth session
    const [session, setSession] = useState(null);

    useEffect(() => {
        // fetch session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        // add listener to auth state change
        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((e, session) => {
            // set session when the auth state changes
            setSession(session);
        })
        
        // unsubscribe from onAuthStateChange
        return () => subscription.unsubscribe();
    }, []);

    return (
        <Router>
            <Navbar user={session?.user}/>
            <Routes>
                <Route path="/" element={<VolunteerDashboard user={session?.user} />} />
                <Route path="/org-setup" element={<OrgSetup user={session?.user} />} />
                <Route path="/org-dashboard" element={<OrganizationDashboard user={session?.user} />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/signup" element={<UserCredentialForm isSignin={false} />} />
                <Route path="/signin" element={<UserCredentialForm isSignin={true} />} />
            </Routes>
        </Router>
    )
}

export default App
