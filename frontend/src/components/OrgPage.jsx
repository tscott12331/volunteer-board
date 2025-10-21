import { useEffect, useState } from 'react';
import styles from './OrgPage.module.css';
import { fetchOrganizationBySlug, fetchOrganizationEventsBySlug } from '../util/api/organizations';
import { useParams } from 'react-router';

export default function OrgPage() {
    const { slug } = useParams();

    const [org, setOrg] = useState({});

    const [orgEvents, setOrgEvents] = useState([]);

    const hoursBetween = (startAt, endAt) => {
        try {
            const s = new Date(startAt);
            const e = new Date(endAt);
            const ms = Math.max(0, e - s);
            const hours = ms / (1000 * 60 * 60);
            return Math.round(hours * 100) / 100;
        } catch {
            return 0;
        }
    }

    useEffect(() => {
        fetchOrganizationBySlug(slug).then(res => {
            if(res.success) {
                setOrg(res.data);
                console.log(res.data);
            }
        })

        fetchOrganizationEventsBySlug(slug).then(res => {
            if(res.success) {
                setOrgEvents(res.data);
            }
        })
    }, []);

    // TABLE(id uuid, org_id uuid, title text, description text, start_at timestamp with time zone, end_at timestamp with time zone, status event_status, capacity integer, image_url text, created_at timestamp with time zone, updated_at timestamp with time zone, location jsonb, location_street text, location_city text, location_state text, location_zip text, location_address text, is_registered boolean, registration_id uuid, registered_at timestamp with time zone, registration_status text)

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.card}>
                    <div className={styles.header}>
                        <div className="d-flex flex-column align-items-center">
                            <div className={styles.logoWrapper}>
                                <img src={org.logo_url || '/placeholder.svg'} alt="Avatar" className={styles.pfp} />
                            </div>
                            <h2 className={styles.orgName}>{org.name}</h2>
                            <button className="btn btn-primary">Follow</button>
                        </div>
                    </div>
                    <div className={styles.body}>
                        <div className={styles.viewSection}>
                            <h3 className={styles.viewSectionTitle}>Basic Information</h3>
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>Followers</div>
                                    <div className={styles.infoValue}>{org.follower_count}</div>
                                </div>
                                <div className={styles.infoItem}>
                                    <div className={styles.infoLabel}>Website</div>
                                    <div className={styles.infoValue}>{org.website_url || <span className={styles.notSet}>Not set</span>}</div>
                                </div>
                            </div>
                        </div>
                        <div className={styles.viewSection}>
                            <h3 className={styles.viewSectionTitle}>Description</h3>
                            {org.description ? (
                                <div className={styles.descriptionContent}>
                                    {org.description}
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <i className="bi bi-chat-quote text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                                    <p className={styles.notSet}>No bio provided yet.</p>
                                </div>
                            )}
                        </div>
                        <div className={styles.viewSection}>
                            <h3 className={styles.viewSectionTitle}>Events</h3>
                            <div className={"row mt-4 " + styles.eventsWrappers}>
                                <div className={styles.eventList}>
                                    {orgEvents.map(e =>
                                    <button
                                        key={e.id}
                                        type="button"
                                        className={styles.eventListItem}
                                    >
                                        <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                                            <div className="d-flex align-items-center gap-2">
                                                <h6 className="mb-0 fw-semibold">{e.title}</h6>
                                            </div>
                                            <small className={styles.dateText}>{new Date(e.start_at).toLocaleDateString()}</small>
                                        </div>
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <i className="bi bi-clock text-muted" style={{ fontSize: '0.875rem' }}></i>
                                            <small className="text-muted">{hoursBetween(e.start_at, e.end_at)} hrs</small>
                                        </div>
                                        {e.location && (
                                            <div className="d-flex align-items-center gap-2">
                                                <i className="bi bi-geo-alt text-muted" style={{ fontSize: '0.875rem' }}></i>
                                                <small className="text-muted">{e.location?.address}</small>
                                            </div>
                                        )}
                                    </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    );
}
