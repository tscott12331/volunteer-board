import { Link, useNavigate } from 'react-router-dom';
import styles from './FollowedOrgCard.module.css';

/*
    * Card displaying an organization a user follows
    * Users can navigate to the organization page or unfollow from this card
*/
export default function FollowedOrgCard({
    org
}) {
    const navigate = useNavigate();

    // unfollows a user from an organization
    const handleUnfollow = (e) => {
        e.stopPropagation();
        // not implemented
    }

    return (
        <div 
            className={"d-flex flex-wrap justify-content-between align-items-center gap-3 bg-body-secondary shadow-sm rounded-3 text-decoration-none " + styles.card}
            onClick={() => navigate(`/org/${org.slug}`)}
        >
            <div className="d-flex align-content-center gap-3">
                <img className={"img-fluid d-inline-block " + styles.logo} src={org.logo_url} />
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
