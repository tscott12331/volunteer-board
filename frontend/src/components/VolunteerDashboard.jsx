import styles from './VolunteerDashboard.module.css';
import DiscoverPanel from './DiscoverPanel';

/*
    * Page to display published volunteer events, user's current registrations,
    * and followed organizations.
*/
export default function VolunteerDashboard() {

    return (
        <>
        <div className={"p-4 flex-grow-1 " + styles.pageWrapper}>
            <ul className="nav nav-tabs mb-3" id="myTab" role="tablist">
                <li className="nav-item" role="presentation">
                    <button className="nav-link active" id="discover-tab" data-bs-toggle="tab" data-bs-target="#discover-tab-pane" type="button" role="tab" aria-controls="home-tab-pane" aria-selected="true">Discover</button>
                </li>
                <li className="nav-item" role="presentation">
                    <button className="nav-link" id="registrations-tab" data-bs-toggle="tab" data-bs-target="#registrations-tab-pane" type="button" role="tab" aria-controls="profile-tab-pane" aria-selected="false">Registrations</button>
                </li>
                <li className="nav-item" role="presentation">
                    <button className="nav-link" id="following-tab" data-bs-toggle="tab" data-bs-target="#following-tab-pane" type="button" role="tab" aria-controls="contact-tab-pane" aria-selected="false">Following</button>
                </li>
            </ul>
            <div className="tab-content" id="myTabContent">
                <div className="tab-pane fade show active" id="discover-tab-pane" role="tabpanel" aria-labelledby="home-tab" tabIndex="0">
                    <DiscoverPanel />
                </div>
                <div className="tab-pane fade" id="registrations-tab-pane" role="tabpanel" aria-labelledby="profile-tab" tabIndex="0">...</div>
                <div className="tab-pane fade" id="following-tab-pane" role="tabpanel" aria-labelledby="contact-tab" tabIndex="0">...</div>
            </div>
        </div>
        </>
    )
}
