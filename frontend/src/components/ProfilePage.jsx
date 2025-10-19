import { useParams } from 'react-router';
import styles from './ProfilePage.module.css';
import { useEffect, useState } from "react";
import { fetchProfile } from '../util/api/profile';

export default function ProfilePage() {
    const { userId } = useParams();

    const [profile, setProfile] = useState(undefined);

    useEffect(() => {
        fetchProfile(userId).then(res => {
            if(res.success) {
                setProfile(res.data);
            }
        })
    }, []);

    console.log(profile);

    return (
        <div className={"flex-grow-1 mx-auto p-4 " + styles.pageWrapper}>
            {profile &&
            <div className="bg-body-secondary shadow-lg p-4 rounded-5">
                {profile.avatar_url &&
                <>
                <img src={profile.avatar_url} className={"border border-secondary border-2 mx-auto mb-3 d-block " + styles.pfp} />
                </>
                }
                {profile.display_name &&
                <h3 className="fw-bold text-body-emphasis">{profile.display_name} - {profile.account === "volunteer" ? "Volunteer" : "Organization"}</h3>
                }
                {profile.full_name &&
                <h4 className="mb-3 text-body-emphasis">{profile.full_name}</h4>
                }
                {(profile.avatar_url || profile.display_name || profile.full_name) &&
                <hr className="border border-secondary my-4"/>
                }
                <p className="mb-3">{
                    profile.bio ??
                    `We don't know much about ${profile.full_name ?? "this user"}, but we're sure they're great`
                }</p>
                <p className="mb-2">Email: <a 
                    className="link-info"
                    href={profile.email ? `mailto:${profile.email}` : '#'}
                    >
                    {profile.email ?? "No email on record"}
                </a></p>
                <p className="mb-2">Phone: <span className={profile.phone ? "text-info" : "text-muted"}>{profile.phone ?? "No phone number on record"}</span></p>
                <p className="mb-2">Timezone: <span className="text-muted">{profile.timezone ?? "No timezone on record"}</span></p>
            </div>
            }
        </div>
    );
}
