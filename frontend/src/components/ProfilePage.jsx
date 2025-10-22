import { useParams } from 'react-router-dom';
import styles from './ProfilePage.module.css';
import { useEffect, useState } from "react";
import { fetchProfile, upsertProfile } from '../util/api/profile';
import { fetchOrganizationByOwner, updateOrganization } from '../util/api/organizations';
import { supabase } from '../util/api/supabaseClient';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

const timezones = [
    'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
    'UTC', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'
];

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
    const [copyFeedback, setCopyFeedback] = useState(false);

    // Calculate hours between two times
    const calculateHours = (start, end) => {
        if (!start || !end) return null;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const hours = (eh * 60 + em - (sh * 60 + sm)) / 60;
        return hours > 0 ? hours.toFixed(1) : null;
    };

    // Apply preset availability
    const applyPreset = (preset) => {
        let newAvail = {};
        DAYS.forEach(day => {
            if (preset === 'weekdays' && !['Sun', 'Sat'].includes(day)) {
                newAvail[day] = { enabled: true, start: '09:00', end: '17:00' };
            } else if (preset === 'weekends' && ['Sun', 'Sat'].includes(day)) {
                newAvail[day] = { enabled: true, start: '10:00', end: '16:00' };
            } else if (preset === 'alldays') {
                newAvail[day] = { enabled: true, start: '09:00', end: '17:00' };
            } else {
                newAvail[day] = { enabled: false, start: '', end: '' };
            }
        });
        setForm(f => ({ ...f, availability: newAvail }));
    };

    // Clear all availability
    const clearAll = () => {
        const cleared = {};
        DAYS.forEach(day => { cleared[day] = { enabled: false, start: '', end: '' }; });
        setForm(f => ({ ...f, availability: cleared }));
    };

    // Copy times to all days
    const copyToAllDays = (sourceDay) => {
        const source = form.availability[sourceDay];
        if (!source?.enabled || !source.start || !source.end) return;
        const updated = {};
        DAYS.forEach(day => {
            updated[day] = {
                enabled: form.availability[day]?.enabled || false,
                start: source.start,
                end: source.end
            };
        });
        setForm(f => ({ ...f, availability: updated }));
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

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
        // Parse availability (object with days as keys)
        let availability = {};
        if (profile.availability && typeof profile.availability === 'object') {
            availability = { ...profile.availability };
        } else {
            DAYS.forEach(day => { availability[day] = { enabled: false, start: '', end: '' }; });
        }
        // Parse location
        let city = '', state = '';
        if (profile.default_location && typeof profile.default_location === 'object') {
            city = profile.default_location.city || '';
            state = profile.default_location.state || '';
        }
        setForm({
            full_name: profile.full_name ?? '',
            display_name: profile.display_name ?? '',
            logo_url: profile.logo_url ?? '',
            phone: profile.phone ?? '',
            bio: profile.bio ?? '',
            timezone: profile.timezone ?? timezones[0],
            availability,
            city,
            state,
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
    // For availability per day
    const onAvailChange = (day, field, value) => {
        setForm(f => ({
            ...f,
            availability: {
                ...f.availability,
                [day]: {
                    ...f.availability[day],
                    [field]: field === 'enabled' ? value : value
                }
            }
        }));
    };

    // Save profile
    const onSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Prepare location and availability for DB
        const toSave = {
            ...form,
            default_location: { city: form.city, state: form.state },
            availability: form.availability,
        };
        const result = await upsertProfile(userId, toSave);
        setSaving(false);
        if (result.success) {
                setProfile({ ...profile, ...toSave });
                // If this user represents an organization, also save the logo_url into
                // the organizations table so org pages show the updated logo.
                if (profile?.account === 'organization') {
                    try {
                        const orgRes = await fetchOrganizationByOwner(userId);
                        if (orgRes.success && orgRes.data) {
                            const org = orgRes.data;
                            const orgUpdate = {
                                logo_url: form.logo_url ?? form.avatar_url ?? null,
                                // keep name/description unchanged if not editing them here
                                name: org.name,
                                description: org.description,
                            };
                            const upd = await updateOrganization(org.id, orgUpdate);
                            if (!upd.success) {
                                console.warn('Failed to update organization logo:', upd.message || upd);
                            }
                        } else {
                            console.warn('Could not find organization for owner when saving logo:', orgRes.message || orgRes);
                        }
                    } catch (e) {
                        console.error('Error saving organization logo:', e);
                    }
                }
            setEditing(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 2500);
        } else {
            alert(result.message || 'Failed to save profile');
        }
    };

    // Logo preview (accept both logo_url and avatar_url during transition)
    const logoPreview = form?.logo_url || form?.avatar_url || profile?.logo_url || profile?.avatar_url;

    return (
        <div className={styles.pageWrapper}>
            {profile && (
                <div className={styles.card}>
                    {showToast && (
                        <div className="toast show position-absolute top-0 end-0 m-3 bg-success text-white" role="alert">
                            <div className="toast-body">Profile updated!</div>
                        </div>
                    )}
                    {/* Header with avatar and name */}
                    <div className={styles.header}>
                        <div className="d-flex flex-column align-items-center">
                            <div className={styles.avatarWrapper}>
                                <img src={profile.logo_url || profile.avatar_url || '/placeholder.svg'} alt="Avatar" className={styles.pfp} />
                            </div>
                            <h2 className={styles.profileName}>{profile.display_name || profile.full_name || 'Unnamed User'}</h2>
                            <span className="badge bg-primary" style={{ fontSize: '1rem', fontWeight: 500 }}>
                                {profile.account === 'organization' ? 'Organization' : 'Volunteer'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.formBody}>
                        {editing ? (
                            <form onSubmit={onSave}>
                                {/* Basic Info Section */}
                                <div className={styles.formSection}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h3 className={styles.sectionTitle}>Basic Information</h3>
                                            <p className={styles.sectionDescription}>Your public profile information</p>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label htmlFor="full_name" className="form-label"><span className={styles.required}>Full Name</span></label>
                                            <input id="full_name" name="full_name" className="form-control" value={form.full_name} onChange={onChange} required />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="display_name" className="form-label">Display Name</label>
                                            <input id="display_name" name="display_name" className="form-control" value={form.display_name} onChange={onChange} />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="logo_url" className="form-label">Logo URL</label>
                                            <input id="logo_url" name="logo_url" className="form-control" value={form.logo_url ?? form.avatar_url} onChange={onChange} placeholder="https://..." />
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
                                            <label htmlFor="timezone" className="form-label"><span className={styles.required}>Timezone</span></label>
                                            <select id="timezone" name="timezone" className="form-select" value={form.timezone} onChange={onChange} required>
                                                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Availability Section */}
                                <div className={styles.formSection}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h3 className={styles.sectionTitle}>Availability</h3>
                                            <p className={styles.sectionDescription}>Select the days and times you're available to volunteer</p>
                                        </div>
                                    </div>
                                    
                                    {/* Quick Presets */}
                                    <div className={styles.quickTemplates}>
                                        <div className="d-flex flex-wrap align-items-center gap-2">
                                            <label className="mb-0">Quick templates:</label>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyPreset('weekdays')}>
                                                Weekdays 9-5
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyPreset('weekends')}>
                                                Weekends 10-4
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => applyPreset('alldays')}>
                                                Every Day 9-5
                                            </button>
                                            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={clearAll}>
                                                Clear All
                                            </button>
                                        </div>
                                    </div>

                                    {copyFeedback && (
                                        <div className={styles.copyFeedback}>
                                            <i className="bi bi-check-circle-fill me-2"></i>
                                            Times copied to all selected days!
                                        </div>
                                    )}

                                    <div className={styles.availabilityGrid}>
                                        {DAYS.map(day => {
                                            const hours = calculateHours(form.availability[day]?.start, form.availability[day]?.end);
                                            return (
                                                <div className={styles.dayRow} key={day}>
                                                    <div className={styles.dayLabel}>
                                                        <input 
                                                            type="checkbox" 
                                                            className="form-check-input m-0" 
                                                            id={`avail-${day}`} 
                                                            checked={form.availability[day]?.enabled || false} 
                                                            onChange={e => onAvailChange(day, 'enabled', e.target.checked)} 
                                                        />
                                                        <label htmlFor={`avail-${day}`} className="mb-0">{day}</label>
                                                    </div>
                                                    <div className={styles.timeInputs}>
                                                        <input 
                                                            type="time" 
                                                            className={`form-control form-control-sm ${styles.timeInput}`}
                                                            value={form.availability[day]?.start || ''} 
                                                            onChange={e => onAvailChange(day, 'start', e.target.value)} 
                                                            disabled={!form.availability[day]?.enabled} 
                                                        />
                                                        <span className="text-muted small">to</span>
                                                        <input 
                                                            type="time" 
                                                            className={`form-control form-control-sm ${styles.timeInput}`}
                                                            value={form.availability[day]?.end || ''} 
                                                            onChange={e => onAvailChange(day, 'end', e.target.value)} 
                                                            disabled={!form.availability[day]?.enabled} 
                                                        />
                                                        {hours && (
                                                            <span className={styles.hoursBadge}>{hours}h</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Copy to All Button */}
                                    {(() => {
                                        const firstEnabledDay = DAYS.find(d => form.availability[d]?.enabled && form.availability[d]?.start && form.availability[d]?.end);
                                        return firstEnabledDay && (
                                            <div className="mt-3 text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => copyToAllDays(firstEnabledDay)}
                                                    title="Copy first set time to all days"
                                                >
                                                    <i className="bi bi-files me-2"></i>
                                                    Copy {firstEnabledDay}'s times to all days
                                                </button>
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Location Section */}
                                <div className={styles.formSection}>
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div>
                                            <h3 className={styles.sectionTitle}>Location</h3>
                                            <p className={styles.sectionDescription}>Your primary volunteering location</p>
                                        </div>
                                    </div>
                                    <div className="row g-3">
                                        <div className="col-md-6">
                                            <label htmlFor="city" className="form-label">City</label>
                                            <input id="city" name="city" className="form-control" value={form.city} onChange={onChange} placeholder="City" />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="state" className="form-label"><span className={styles.required}>State</span></label>
                                            <select id="state" name="state" className="form-select" value={form.state} onChange={onChange} required>
                                                <option value="">Select state</option>
                                                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer with buttons - inside form body */}
                                <div className="d-flex justify-content-end gap-2 mt-4 pt-3" style={{ borderTop: '1px solid #3a3f44' }}>
                                    <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
                                    <button type="submit" className="btn btn-primary" disabled={saving}>
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <>
                                {/* Basic Info Section */}
                                <div className={styles.viewSection}>
                                    <h3 className={styles.viewSectionTitle}>Basic Information</h3>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoLabel}>Full Name</div>
                                            <div className={styles.infoValue}>{profile.full_name || <span className={styles.notSet}>Not set</span>}</div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoLabel}>Display Name</div>
                                            <div className={styles.infoValue}>{profile.display_name || <span className={styles.notSet}>Not set</span>}</div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoLabel}>Phone</div>
                                            <div className={styles.infoValue}>{profile.phone || <span className={styles.notSet}>Not set</span>}</div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoLabel}>Timezone</div>
                                            <div className={styles.infoValue}>{profile.timezone || <span className={styles.notSet}>Not set</span>}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio Section */}
                                {(profile.bio || sessionUserId === userId) && (
                                    <div className={styles.viewSection}>
                                        <h3 className={styles.viewSectionTitle}>Bio</h3>
                                        {profile.bio ? (
                                            <div className={styles.bioContent}>
                                                {profile.bio}
                                            </div>
                                        ) : (
                                            <div className={styles.emptyState}>
                                                <i className="bi bi-chat-quote text-muted" style={{ fontSize: '2rem', opacity: 0.3 }}></i>
                                                <p className={styles.notSet}>No bio provided yet.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Location Section */}
                                <div className={styles.viewSection}>
                                    <h3 className={styles.viewSectionTitle}>Location</h3>
                                    <div className={styles.infoGrid}>
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoLabel}>City</div>
                                            <div className={styles.infoValue}>{profile.default_location?.city || <span className={styles.notSet}>Not set</span>}</div>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <div className={styles.infoLabel}>State</div>
                                            <div className={styles.infoValue}>{profile.default_location?.state || <span className={styles.notSet}>Not set</span>}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Availability Section */}
                                <div className={styles.viewSection}>
                                    <h3 className={styles.viewSectionTitle}>Weekly Availability</h3>
                                    <div className={styles.availabilityList}>
                                        {DAYS.map(day => {
                                            const avail = profile.availability?.[day];
                                            const isAvailable = avail?.enabled && avail?.start && avail?.end;
                                            return (
                                                <div className={styles.availabilityItem} key={day}>
                                                    <div className={styles.dayName}>
                                                        <span className={isAvailable ? styles.dayActive : styles.dayInactive}>
                                                            {day}
                                                        </span>
                                                    </div>
                                                    {isAvailable ? (
                                                        <div className={styles.timeRange}>
                                                            <i className="bi bi-clock me-2"></i>
                                                            {avail.start} - {avail.end}
                                                        </div>
                                                    ) : (
                                                        <div className={styles.unavailable}>
                                                            <i className="bi bi-dash-circle me-2"></i>
                                                            Unavailable
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Edit Button */}
                                {sessionUserId === userId && (
                                    <div className={styles.editButtonContainer}>
                                        <button className="btn btn-primary btn-lg" onClick={startEdit}>
                                            <i className="bi bi-pencil me-2"></i>Edit Profile
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
