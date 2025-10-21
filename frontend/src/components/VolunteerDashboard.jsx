import styles from './VolunteerDashboard.module.css';
import DiscoverPanel from './DiscoverPanel';
import RegistrationsPanel from './RegistrationsPanel';
import FollowingPanel from './FollowingPanel';

/*
    * Page to display published volunteer events, user's current registrations,
    * and followed organizations.
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function VolunteerDashboard({
    user,
}) {

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.tabsContainer}>
                <ul className={`nav nav-tabs ${styles.customTabs}`} id="myTab" role="tablist">
                    <li className="nav-item" role="presentation">
                        <button className="nav-link active" id="discover-tab" data-bs-toggle="tab" data-bs-target="#discover-tab-pane" type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">
                            <i className="bi bi-compass me-2"></i>
                            Discover
                        </button>
                    </li>
                    {user &&
                    <>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="registrations-tab" data-bs-toggle="tab" data-bs-target="#registrations-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">
                            <i className="bi bi-calendar-check me-2"></i>
                            Registrations
                        </button>
                    </li>
                    <li className="nav-item" role="presentation">
                        <button className="nav-link" id="following-tab" data-bs-toggle="tab" data-bs-target="#following-tab-pane" type="button" role="tab" aria-controls="contact-tab-pane" aria-selected="false">
                            <i className="bi bi-heart me-2"></i>
                            Following
                        </button>
                    </li>
                    </>
                    }
                </ul>
                <div className={`tab-content ${styles.tabContent}`} id="myTabContent">
                    <div className="tab-pane fade show active" id="discover-tab-pane" role="tabpanel" aria-labelledby="home-tab" tabIndex="0">
                        <DiscoverPanel user={user} />
                    </div>
                    {user &&
                    <>
                    <div className="tab-pane fade" id="registrations-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0">
                        <RegistrationsPanel user={user} />
                    </div>
                    <div className="tab-pane fade" id="following-tab-pane" role="tabpanel" aria-labelledby="contact-tab" tabIndex="0">
                        <FollowingPanel user={user}/>
                    </div>
                    </>
                    }
                </div>
            </div>
        </div>
    )
}
