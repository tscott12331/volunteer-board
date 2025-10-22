import { useState, useEffect } from "react";
import FollowedOrgCard from './FollowedOrgCard';
import fetchUserOrgSubscription from "../util/api/orgs";

/*
    * Panel on the volunteer dashboard displaying the orgs a user follows
    * Users can navigate to the organization page or unfollow
    * props:
        * user?
            * Supabase Auth user object
            * Currently logged in user
*/
export default function FollowingPanel({
    user,
}) {

    const [orgs, setOrgs] = useState([]);

    const handleUnfollow = (id) => {
        setOrgs(cur => {
            const index = cur.findIndex(o => o.organization_id === id);
            if(index !== -1) {
                const newOrgs = [...cur.slice(0, index), ...cur.slice(index + 1)];
                return newOrgs;
            } else {
                return cur;
            }
        })
    }

    useEffect(() => {
        fetchUserOrgSubscription(user.id).then(res => {
            if(res.success) {
                setOrgs(res.data);
            }
        })
    }, []);
    
    return (
        <>
        <h2 className="mb-4 fw-bold">Following</h2>
        {
        orgs.length > 0 ?
            <div className="d-flex flex-column gap-3 mt-4">
            {
            orgs.map(org =>
                <FollowedOrgCard 
                    org={org} 
                    onUnfollow={handleUnfollow}
                    key={org.organization_id} 
                />
            )
            }
            </div>
        :
            <p>You do not follow any organizations</p>
        }
        </>
    );
}
