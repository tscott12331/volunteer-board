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
    // temp placeholder data
// [
//         {
//             "id": "76d709c3-0502-4667-a6f4-3112d3b8e531",
//             "owner_user_id": "36f07330-f51d-4913-8035-76b96003a831",
//             "name": "James' Park Cleanup",
//             "slug": "jamescleanup",
//             "description": "We help clean up parks all around the state",
//             "website_url": null,
//             "logo_url": "/placeholder.svg",
//             "created_at": "2025-10-19 05:28:51.600341+00",
//             "updated_at": "2025-10-19 05:28:51.600341+00",
//         }
//     ]

    const [orgs, setOrgs] = useState([]);

    useEffect(() => {
        if (!user?.id) return;
        fetchUserOrgSubscription(user.id).then(res => {
            if(res.success) {
                setOrgs(res.data);
            }
        })
    }, [user?.id]);

    useEffect(() => {
        const handler = () => {
            if (!user?.id) return;
            fetchUserOrgSubscription(user.id).then(res => {
                if (res.success) setOrgs(res.data);
            });
        };
        window.addEventListener('org:follow-changed', handler);
        return () => window.removeEventListener('org:follow-changed', handler);
    }, [user?.id]);
    
    return (
        <>
        <h2 className="mb-4 fw-bold">Following</h2>
        {
        orgs.length > 0 ?
            <div className="d-flex flex-column gap-3 mt-4">
            {
            orgs.map(org =>
                <FollowedOrgCard org={org} key={org.organization_id} />
            )
            }
            </div>
        :
            <p>You do not follow any organizations</p>
        }
        </>
    );
}
