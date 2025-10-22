import './App.css'
import 'bootstrap';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import VolunteerDashboard from './components/VolunteerDashboard'
import OrganizationDashboard from './components/OrganizationDashboard'
import OrgSetup from './components/OrgSetup'
import VolunteerSetup from './components/VolunteerSetup'
import UserCredentialForm from './components/UserCredentialForm';
import Navbar from './components/Navbar';
import ProfilePage from './components/ProfilePage';
import EventDetailPage from './components/EventDetailPage';
import NotificationsPage from './components/NotificationsPage';
import { fetchProfile } from './util/api/profile';

import { supabase } from './util/api/supabaseClient';
import { useEffect, useState } from 'react';
import OrgPage from './components/OrgPage';

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

    useEffect(() => {
        const logNavigation = (event) => {
            console.log('Navigation or reload detected:', event.type, event);
        };
        window.addEventListener('beforeunload', logNavigation);
        window.addEventListener('unload', logNavigation);
        window.addEventListener('popstate', logNavigation);
        window.addEventListener('hashchange', logNavigation);
        return () => {
            window.removeEventListener('beforeunload', logNavigation);
            window.removeEventListener('unload', logNavigation);
            window.removeEventListener('popstate', logNavigation);
            window.removeEventListener('hashchange', logNavigation);
        };
    }, []);

    const Guard = ({ children }) => {
        const navigate = useNavigate();
        const location = useLocation();
        useEffect(() => {
            const guard = async () => {
                if (!session?.user) return; // not logged in yet
                const isOrg = !!session.user.user_metadata?.is_organization;
                console.debug('[Guard] path=', location.pathname, 'isOrg=', isOrg, 'userId=', session.user.id);

                // For orgs: if on auth pages, kick to home; otherwise don't enforce volunteer setup
                if (isOrg) {
                    if (location.pathname === '/signin' || location.pathname === '/signup') {
                        console.debug('[Guard] Org user on auth page -> navigate /');
                        navigate('/');
                    }
                    return;
                }

                // Volunteers: check profile completeness
                try {
                    const res = await fetchProfile(session.user.id);
                    const profile = res.success ? res.data : null;
                    let complete = false;
                    if (profile) {
                        // Prefer explicit flag if column exists in payload
                        if (Object.prototype.hasOwnProperty.call(profile, 'onboarding_complete')) {
                            complete = profile.onboarding_complete === true;
                        } else {
                            // Fallback heuristic
                            complete = !!(profile.full_name || profile.display_name);
                        }
                    }

                    // If incomplete and not already on setup, go to setup
                    if (!complete && location.pathname !== '/volunteer-setup') {
                        console.debug('[Guard] Volunteer incomplete -> navigate /volunteer-setup');
                        navigate('/volunteer-setup');
                        return;
                    }

                    // If complete but on auth pages, go home
                    if (complete && (location.pathname === '/signin' || location.pathname === '/signup')) {
                        console.debug('[Guard] Volunteer complete on auth page -> navigate /');
                        navigate('/');
                        return;
                    }
                } catch {
                    // On any error, push to setup (unless already there)
                    if (location.pathname !== '/volunteer-setup') {
                        console.debug('[Guard] Error during guard -> navigate /volunteer-setup');
                        navigate('/volunteer-setup');
                    }
                }
            };
            guard();
        }, [session, location.pathname]);
        return children;
    };

    return (
        <Router>
            <Guard>
                <Navbar user={session?.user}/>
                <Routes>
                    <Route path="/" element={<VolunteerDashboard user={session?.user} />} />
                    <Route path="/org-setup" element={<OrgSetup user={session?.user} />} />
                    <Route path="/org/:slug" element={<OrgPage />}/>
                    <Route path="/volunteer-setup" element={<VolunteerSetup />} />
                    <Route path="/org-dashboard" element={<OrganizationDashboard user={session?.user} />} />
                    <Route path="/profile/:userId" element={<ProfilePage />} />
                    <Route path="/event/:eventId" element={<EventDetailPage user={session?.user} />} />
                    <Route path="/notifications" element={<NotificationsPage user={session?.user} />} />
                    <Route path="/signup" element={<UserCredentialForm isSignin={false} />} />
                    <Route path="/signin" element={<UserCredentialForm isSignin={true} />} />
                </Routes>
            </Guard>
        </Router>
    )
}

export default App
