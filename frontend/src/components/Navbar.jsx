import { Link, useNavigate, useLocation } from "react-router";
import { supabase } from "../util/api/supabaseClient";
import { useState, useEffect } from "react";

/*
    * Dynamically displays necessary nav links
    * props:
        * user?
            * Supabase Auth user
            * Basic information about the logged in user
*/
export default function Navbar({
    user,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [userProfile, setUserProfile] = useState(null);
    const [hasOrganization, setHasOrganization] = useState(false);
    
    // different nav options appear when user is logged in
    const loggedIn = user ? true : false;

    // Determine current view based on route
    const currentView = location.pathname === '/org-dashboard' ? 'organization' : 'volunteer';

    useEffect(() => {
        async function checkUserProfile() {
            if (!user) return;

            // Fetch user profile to check account type
            const { data: profile } = await supabase
                .from('profiles')
                .select('account')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserProfile(profile);
            }

            // Check if user owns an organization
            const { data: org } = await supabase
                .from('organizations')
                .select('id')
                .eq('owner_user_id', user.id)
                .single();

            setHasOrganization(!!org);
        }

        checkUserProfile();
    }, [user]);

    // signs user out 
    const handleSignout = async () => {
        await supabase.auth.signOut();
    }

    const handleViewChange = (e) => {
        const newView = e.target.value;
        if (newView === 'organization') {
            navigate('/org-dashboard');
        } else {
            navigate('/');
        }
    }

    // Only show view switcher if user has organization account
    const showViewSwitcher = loggedIn && (userProfile?.account === 'organization' || hasOrganization);
    
    return (
        <nav className="navbar navbar-expand-lg bg-body-tertiary">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/">StepUp</Link>
                
                {showViewSwitcher && (
                    <select 
                        className="form-select form-select-sm ms-3" 
                        style={{ width: 'auto' }}
                        value={currentView}
                        onChange={handleViewChange}
                    >
                        <option value="volunteer">Volunteer View</option>
                        <option value="organization">Organization View</option>
                    </select>
                )}

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item">
                            <Link className="nav-link active" to="/">Home</Link>
                        </li>
                        {
                        loggedIn ?
                        <>
                        <li className="nav-item">
                            <Link className="nav-link active" to={"/profile/" + user.id}>Profile</Link>
                        </li>
                        <li className="nav-item">
                            <a 
                                className="nav-link active" 
                                href="#"
                                onClick={handleSignout}
                            >Sign out</a>
                        </li>
                        </>
                        :
                        <>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/signin">Sign in</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link active" to="/signup">Sign up</Link>
                        </li>
                        </>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
}
