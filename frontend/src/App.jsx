import './App.css'
import 'bootstrap';
import { BrowserRouter as Router, Routes, Route } from 'react-router'
import VolunteerDashboard from './components/VolunteerDashboard'
import UserCredentialForm from './components/UserCredentialForm';
import Navbar from './components/Navbar';
import ProfilePage from './components/ProfilePage';

import { supabase } from './util/api/supabaseClient';
import { useEffect, useState } from 'react';

function App() {
    const [session, setSession] = useState(null);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription }
        } = supabase.auth.onAuthStateChange((e, session) => {
            setSession(session);
        })
        
        return () => subscription.unsubscribe();
    }, []);

    return (
        <Router>
            <Navbar user={session?.user}/>
            <Routes>
                <Route path="/" element={<VolunteerDashboard />} />
                <Route path="/profile/:userId" element={<ProfilePage />} />
                <Route path="/signup" element={<UserCredentialForm isLogin={false} />} />
                <Route path="/login" element={<UserCredentialForm isLogin={true} />} />
            </Routes>
        </Router>
    )
}

export default App
