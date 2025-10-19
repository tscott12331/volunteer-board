import { useParams } from 'react-router';
import styles from './ProfilePage.module.css';
import { useState } from "react";

export default function ProfilePage() {
    const { userId } = useParams();

    const [profile, setProfile] = useState({
        account: "volunteer",
        full_name: "James Test",
        display_name: "Jamestheuser",
        avatar_url: "/placeholder.svg",
        phone: "800-555-0100",
        timezone: "PST",
        bio: "I am James Test, this is my description. Jamestheuser is my username, and this is text describing Jamestheuser",
        default_location: null,
        created_at: new Date(),
        updated_at: new Date(),
    })

    return (
        <div className={"flex-grow-1 mx-auto p-4 " + styles.pageWrapper}>
            <div className="bg-body-secondary shadow-lg p-3 rounded-5">
                <img src={profile.avatar_url} className={"border border-secondary border-2 mx-auto mb-3 d-block " + styles.pfp} />
                <hr className="border border-secondary my-4"/>
                <h3 className="fw-bold text-body-emphasis">{profile.display_name} - {profile.account === "volunteer" ? "Volunteer" : "Organization"}</h3>
                <h4 className="mb-3 text-body-emphasis">{profile.full_name}</h4>
                <p className="mb-2">{profile.bio}</p>
                <p className="mb-2">Phone: <span className="text-info">{profile.phone}</span></p>
                <p>Account created: {profile.created_at.toLocaleDateString()}</p>
            </div>
        </div>
    );
}
