import { Link, useNavigate } from 'react-router-dom';
import styles from './FollowedOrgCard.module.css';
import { unfollowOrganization } from '../util/api/organizations';

/*
    * Card displaying an organization a user follows
    * Users can navigate to the organization page or unfollow from this card
*/
export default function FollowedOrgCard({
    org,
    onUnfollow
}) {
    const navigate = useNavigate();

    // unfollows a user from an organization
    const handleUnfollow = async (e) => {
        e.stopPropagation();
        const res = await unfollowOrganization(org.id);
        if(res.success) {
            onUnfollow?.(org.id);
        }
    }

    return (
        <div 
            className={"d-flex flex-wrap justify-content-between align-items-center gap-3 bg-body-secondary shadow-sm rounded-3 text-decoration-none " + styles.card}
            onClick={() => navigate(`/org/${org.slug}`)}
        >
            <div className="d-flex align-content-center gap-3">
                {org.logo_url ?
                <img className={`${styles.logo} d-flex align-items-center justify-content-center`} src={org.logo_url} />
                :
                <div className={`${styles.logo} d-flex align-items-center justify-content-center`}>{org.name[0]}</div>
                }
                <h3 className={"fw-semibold mb-0 " + styles.name}>{org.name}</h3>
            </div>
            <button 
                role="button"
                className="btn btn-outline-danger"
                onClick={handleUnfollow}
            >
            Unfollow
            </button>
        </div>
    );
}
