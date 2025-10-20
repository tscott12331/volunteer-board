import { Link } from 'react-router-dom';
import styles from './FollowedOrgCard.module.css';

/*
    * Card displaying an organization a user follows
    * Users can navigate to the organization page or unfollow from this card
*/
export default function FollowedOrgCard({
    org
}) {
    // unfollows a user from an organization
    const handleUnfollow = () => {
        // not implemented
    }

    return (
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 px-3 py-2 bg-body-secondary shadow-sm rounded-3" >
            <div className="d-flex align-content-center gap-3">
                <img className={"img-fluid d-inline-block " + styles.logo} src={org.logo_url} />
                <div className="d-flex flex-column justify-content-center">
                    <h3 className="text-body-emphasis"><Link to={`/orgs/${org.slug}`}>{org.name}</Link></h3>
                    <p className="mb-0">{org.description}</p>
                </div>
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
