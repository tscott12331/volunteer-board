import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OrganizationDashboard.module.css';
import OrgEventsPanel from './OrgEventsPanel';
import OrgProfilePanel from './OrgProfilePanel';
import { fetchOrganizationByOwner } from '../util/api/organizations';

/*
    * Organization dashboard page with Events and Profile tabs
    * props:
        * user
            * Supabase Auth user object
            * Currently logged in user
*/
export default function OrganizationDashboard({ user }) {
    const navigate = useNavigate();
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function loadOrganization() {
            if (!user) {
                setError("User not authenticated");
                setLoading(false);
                return;
            }

            const result = await fetchOrganizationByOwner(user.id);
            
            if (result.success) {
                if (!result.data) {
                    // No organization found - redirect to setup
                    navigate('/org-setup');
                } else {
                    setOrganization(result.data);
                }
            } else {
                setError(result.message);
            }
            setLoading(false);
        }

        loadOrganization();
    }, [user, navigate]);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <div className="alert alert-danger" role="alert" style={{ maxWidth: '600px' }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.tabsContainer}>
                <ul className={`nav nav-tabs ${styles.customTabs}`} id="orgTab" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button 
                            className="nav-link active" 
                            id="events-tab" 
                            data-bs-toggle="tab" 
                            data-bs-target="#events-tab-pane" 
                            type="button" 
                            role="tab" 
                            aria-controls="events-tab-pane" 
                            aria-selected="true"
                        >
                            <i className="bi bi-calendar-event me-2"></i>
                            Events
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button 
                            className="nav-link" 
                            id="profile-tab" 
                            data-bs-toggle="tab" 
                            data-bs-target="#profile-tab-pane" 
                            type="button" 
                            role="tab" 
                            aria-controls="profile-tab-pane" 
                            aria-selected="false"
                        >
                            <i className="bi bi-building me-2"></i>
                            Profile
                        </button>
                    </li>
                </ul>
                <div className={`tab-content ${styles.tabContent}`} id="orgTabContent">
                    <div 
                        className="tab-pane fade show active" 
                        id="events-tab-pane" 
                        role="tabpanel" 
                        aria-labelledby="events-tab" 
                        tabIndex="0"
                    >
                        <OrgEventsPanel organization={organization} />
                    </div>
                    <div 
                        className="tab-pane fade" 
                        id="profile-tab-pane" 
                        role="tabpanel" 
                        aria-labelledby="profile-tab" 
                        tabIndex="0"
                    >
                        <OrgProfilePanel 
                            organization={organization} 
                            onUpdate={setOrganization}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
