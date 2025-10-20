import { useParams } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import { useEffect, useState } from "react";
import { fetchProfile, upsertProfile } from '../util/api/profile';
import { supabase } from '../util/api/supabaseClient';

/*
    * Page component displaying a user's profile information
*/
export default function ProfilePage() {
    const { userId } = useParams();
    const [profile, setProfile] = useState(undefined);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [sessionUserId, setSessionUserId] = useState(null);

    // Timezone options
    const timezones = [
        'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
        'UTC', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'
    ];

    useEffect(() => {
        fetchProfile(userId).then(res => {
            if(res.success) {
                setProfile(res.data);
            }
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionUserId(session?.user?.id ?? null);
        });
    }, [userId]);

    // Start editing with current profile
    const startEdit = () => {
        setForm({
            full_name: profile.full_name ?? '',
            display_name: profile.display_name ?? '',
            avatar_url: profile.avatar_url ?? '',
            phone: profile.phone ?? '',
            bio: profile.bio ?? '',
            timezone: profile.timezone ?? timezones[0],
        });
        setEditing(true);
    };

    // Cancel editing
    const cancelEdit = () => {
        setEditing(false);
        setForm(null);
    };

    // Handle form changes
    const onChange = (e) => {
        const { name, value } = e.target;
        setForm(f => ({ ...f, [name]: value }));
    };

    // Save profile
    const onSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        const result = await upsertProfile(userId, form);
        setSaving(false);
        if (result.success) {
            setProfile({ ...profile, ...form });
            setEditing(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2500);
        } else {
            alert(result.message || 'Failed to save profile');
        }
    };

    // Avatar preview
    const avatarPreview = form?.avatar_url || profile?.avatar_url;

    return (
        <div className={"flex-grow-1 mx-auto p-4 d-flex align-items-center justify-content-center " + styles.pageWrapper}>
            {profile && (
                <div className="profile-card shadow-lg rounded-5 position-relative bg-body-secondary" style={{ maxWidth: 480, width: '100%', padding: '2.5rem 2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                    {showToast && (
                        <div className="toast show position-absolute top-0 end-0 m-3 bg-success text-white" role="alert">
                            <div className="toast-body">Profile updated!</div>
                        </div>
                    )}
                    {/* Header with avatar and name */}
                    <div className="d-flex flex-column align-items-center mb-4">
                        <div style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.12)', borderRadius: '50%', background: '#222', padding: '6px', marginBottom: '1rem' }}>
                            <img src={profile.avatar_url || '/placeholder.svg'} alt="Avatar" className={styles.pfp} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: '50%', border: '3px solid #444' }} />
                        </div>
                        <h2 className="fw-bold mb-1 text-light" style={{ fontSize: '2rem', letterSpacing: '0.02em' }}>{profile.display_name || profile.full_name || 'Unnamed User'}</h2>
                        <span className="badge bg-primary mb-2" style={{ fontSize: '1rem', fontWeight: 500 }}>{profile.account === 'organization' ? 'Organization' : 'Volunteer'}</span>
                    </div>
                    {/* Info grid */}
                    {editing ? (
                        <form onSubmit={onSave} className="row g-3">
                            <div className="col-md-6">
                                <label htmlFor="full_name" className="form-label">Full Name</label>
                                <input id="full_name" name="full_name" className="form-control" value={form.full_name} onChange={onChange} required />
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="display_name" className="form-label">Display Name</label>
                                <input id="display_name" name="display_name" className="form-control" value={form.display_name} onChange={onChange} />
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="avatar_url" className="form-label">Avatar URL</label>
                                <input id="avatar_url" name="avatar_url" className="form-control" value={form.avatar_url} onChange={onChange} placeholder="https://..." />
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="phone" className="form-label">Phone</label>
                                <input id="phone" name="phone" className="form-control" value={form.phone} onChange={onChange} placeholder="(555) 555-5555" />
                            </div>
                            <div className="col-12">
                                <label htmlFor="bio" className="form-label">Bio</label>
                                <textarea id="bio" name="bio" rows={3} className="form-control" value={form.bio} onChange={onChange} placeholder="A little about you..." />
                            </div>
                            <div className="col-md-6">
                                <label htmlFor="timezone" className="form-label">Timezone</label>
                                <select id="timezone" name="timezone" className="form-select" value={form.timezone} onChange={onChange} required>
                                    {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                </select>
                            </div>
                            <div className="col-12 d-flex justify-content-end gap-2 mt-4">
                                <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
                            </div>
                        </form>
                    ) : (
                        <>
                            <div className="row g-2 mb-3">
                                <div className="col-6">
                                    <div className="text-muted small">Full Name</div>
                                    <div className="fw-semibold text-light">{profile.full_name || <span className="text-muted">Not set</span>}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">Display Name</div>
                                    <div className="fw-semibold text-light">{profile.display_name || <span className="text-muted">Not set</span>}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">Phone</div>
                                    <div className="fw-semibold text-light">{profile.phone || <span className="text-muted">Not set</span>}</div>
                                </div>
                                <div className="col-6">
                                    <div className="text-muted small">Timezone</div>
                                    <div className="fw-semibold text-light">{profile.timezone || <span className="text-muted">Not set</span>}</div>
                                </div>
                            </div>
                            <hr className="border border-secondary my-3" />
                            <div className="mb-3">
                                <div className="text-muted small mb-1">Bio</div>
                                {profile.bio ? (
                                    <blockquote className="blockquote text-light" style={{ fontStyle: 'italic', borderLeft: '4px solid #0d6efd', paddingLeft: '1rem' }}>
                                        {profile.bio}
                                    </blockquote>
                                ) : (
                                    <div className="text-muted">No bio provided yet.</div>
                                )}
                            </div>
                            {sessionUserId === userId && (
                                <div className="d-flex justify-content-end mt-4">
                                    <button className="btn btn-outline-primary" style={{ minWidth: 120 }} onClick={startEdit}>
                                        <i className="bi bi-pencil me-2"></i>Edit Profile
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
