import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../util/api/supabaseClient";
import { useState, useEffect } from "react";
import Notifications from './Notifications';
import { useRef } from 'react';
import { countUnreadNotifications, subscribeToNotifications } from '../util/api/notifications';

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
    const [showNotifications, setShowNotifications] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const profileMenuRef = useRef();
    const loggedIn = !!user;
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

    // Load unread count and subscribe to changes
    useEffect(() => {
        if (!user?.id) return;
        let unsub = null;
        let mounted = true;

        // initial load
        countUnreadNotifications(user.id)
            .then(c => { if (mounted) setUnreadCount(c || 0); })
            .catch(() => {});

        // subscribe to realtime changes
        unsub = subscribeToNotifications(user.id, {
            onInsert: (n) => {
                // increase if the new notification is unread (default false means unread)
                if (!n.is_read) setUnreadCount(c => (c || 0) + 1);
            },
            onUpdate: (n, old) => {
                // adjust count if read state toggled
                if (old?.is_read && !n.is_read) setUnreadCount(c => (c || 0) + 1);
                if (!old?.is_read && n.is_read) setUnreadCount(c => Math.max(0, (c || 0) - 1));
            },
            onDelete: (old) => {
                if (!old?.is_read) setUnreadCount(c => Math.max(0, (c || 0) - 1));
            }
        });

        return () => {
            mounted = false;
            if (unsub) unsub();
        };
    }, [user?.id]);

    // signs user out 
    const handleSignout = async () => {
        await supabase.auth.signOut();
        // navigate to home after signout
        navigate('/');
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
    
    // Avatar/initials helper
    const getAvatar = () => {
        if (userProfile?.logo_url || userProfile?.avatar_url) return <img src={userProfile.logo_url || userProfile.avatar_url} alt="logo" style={{ width: 32, height: 32, borderRadius: '50%' }} />;
        if (user?.email) return <span className="avatar-circle">{user.email[0].toUpperCase()}</span>;
        return <span className="avatar-circle">U</span>;
    };

    // Close profile menu on outside click
    useEffect(() => {
        function handleClick(e) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfileMenu(false);
            }
        }
        if (showProfileMenu) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showProfileMenu]);

    return (
        <nav className="navbar navbar-dark bg-dark shadow-sm px-2" style={{ minHeight: 56 }}>
            <div className="container-fluid d-flex align-items-center justify-content-between">
                {/* Left: Logo */}
                <div className="d-flex align-items-center gap-3">
                    <Link className="navbar-brand fw-bold" to="/" style={{ fontSize: '1.5rem', letterSpacing: '0.02em' }}>
                        <span style={{ color: '#0d6efd' }}>Step</span>Up
                    </Link>
                    {showViewSwitcher && (
                        <select 
                            className="form-select form-select-sm ms-2" 
                            style={{ width: 'auto' }}
                            value={currentView}
                            onChange={handleViewChange}
                        >
                            <option value="volunteer">Volunteer View</option>
                            <option value="organization">Organization View</option>
                        </select>
                    )}
                </div>

                {/* Center nav removed */}

                {/* Right: Notifications and Profile */}
                <div className="d-flex align-items-center gap-2 position-relative">
                    {loggedIn && (
                        <button
                            className="btn btn-link position-relative p-0 me-2"
                            style={{ fontSize: 22 }}
                            onClick={() => setShowNotifications(v => !v)}
                            aria-label="Toggle notifications"
                        >
                            <i className="fa-solid fa-bell" />
                            {unreadCount > 0 && (
                                <span
                                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                                    style={{ fontSize: '0.65rem' }}
                                >
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                    <span className="visually-hidden">unread notifications</span>
                                </span>
                            )}
                        </button>
                    )}
                    {loggedIn ? (
                        <div className="dropdown" ref={profileMenuRef}>
                            <button
                                className="btn btn-link p-0 d-flex align-items-center"
                                style={{ minWidth: 36 }}
                                onClick={() => setShowProfileMenu(v => !v)}
                                aria-label="Profile menu"
                            >
                                {/* {getAvatar()} */}
                                <i className="fa-regular fa-user"></i>
                                <i className="bi bi-caret-down ms-1 text-secondary" />
                                
                            </button>
                            {showProfileMenu && (
                                <ul className="dropdown-menu dropdown-menu-end show mt-2" style={{ minWidth: 160, right: 0, left: 'auto' }}>
                                    <li>
                                        <Link className="dropdown-item" to={`/profile/${user.id}`} onClick={() => setShowProfileMenu(false)}>Profile</Link>
                                    </li>
                                    <li>
                                        <Link className="dropdown-item" to="/notifications" onClick={() => setShowProfileMenu(false)}>Notifications</Link>
                                    </li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li>
                                        <button className="dropdown-item text-danger" onClick={handleSignout}>Sign out</button>
                                    </li>
                                </ul>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link className="btn btn-outline-light btn-sm me-2" to="/signin">Sign in</Link>
                            <Link className="btn btn-primary btn-sm" to="/signup">Sign up</Link>
                        </>
                    )}
                </div>
            </div>
            {showNotifications && loggedIn && (
                <Notifications user={user} onClose={() => setShowNotifications(false)} />
            )}
        </nav>
    );
}
