import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './VolunteerSetup.module.css';
import { supabase } from '../util/api/supabaseClient';
import { upsertProfile, markOnboardingComplete } from '../util/api/profile';

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

export default function VolunteerSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Initialize availability with all days disabled
  const initialAvailability = {};
  DAYS.forEach(day => { initialAvailability[day] = { enabled: false, start: '', end: '' }; });

  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    avatar_url: '',
    phone: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
    availability: initialAvailability,
    city: '',
    state: '',
  });

  const timezones = useMemo(() => {
    try {
      // A small curated list for UX; can be expanded or loaded dynamically
      return [
        'America/Los_Angeles',
        'America/Denver',
        'America/Chicago',
        'America/New_York',
        'UTC',
        'Europe/London',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Kolkata',
        'Australia/Sydney',
      ];
    } catch {
      return ['America/Los_Angeles', 'UTC'];
    }
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setNeedsConfirm(true);
        setLoading(false);
        return;
      }
      setUser(session.user);
      setLoading(false);
    })();
  }, []);

  const refreshSession = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      setNeedsConfirm(false);
    }
    setLoading(false);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

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

  // Copy availability from one day to all other days
  const copyToAllDays = (sourceDay) => {
    const sourceAvail = form.availability[sourceDay];
    if (!sourceAvail?.enabled || !sourceAvail.start || !sourceAvail.end) {
      alert('Please set valid times for this day first');
      return;
    }
    const newAvailability = {};
    DAYS.forEach(day => {
      newAvailability[day] = {
        enabled: true,
        start: sourceAvail.start,
        end: sourceAvail.end
      };
    });
    setForm(f => ({ ...f, availability: newAvailability }));
    
    // Show success feedback
    setCopyFeedback(sourceDay);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Apply a preset schedule
  const applyPreset = (preset) => {
    const newAvailability = {};
    if (preset === 'weekdays') {
      DAYS.forEach(day => {
        if (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day)) {
          newAvailability[day] = { enabled: true, start: '09:00', end: '17:00' };
        } else {
          newAvailability[day] = { enabled: false, start: '', end: '' };
        }
      });
    } else if (preset === 'weekends') {
      DAYS.forEach(day => {
        if (['Sat', 'Sun'].includes(day)) {
          newAvailability[day] = { enabled: true, start: '10:00', end: '16:00' };
        } else {
          newAvailability[day] = { enabled: false, start: '', end: '' };
        }
      });
    } else if (preset === 'alldays') {
      DAYS.forEach(day => {
        newAvailability[day] = { enabled: true, start: '09:00', end: '17:00' };
      });
    }
    setForm(f => ({ ...f, availability: newAvailability }));
  };

  // Clear all availability
  const clearAll = () => {
    const newAvailability = {};
    DAYS.forEach(day => {
      newAvailability[day] = { enabled: false, start: '', end: '' };
    });
    setForm(f => ({ ...f, availability: newAvailability }));
  };

  // Calculate hours for a day
  const calculateHours = (start, end) => {
    if (!start || !end) return null;
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const hours = (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;
    return hours > 0 ? hours.toFixed(1) : null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    // Prepare location and availability for DB
    const payload = {
      ...form,
      default_location: { city: form.city, state: form.state },
      availability: form.availability,
    };
    const result = await upsertProfile(user.id, payload);
    setSaving(false);
    if (result.success) {
      // Best-effort: set onboarding_complete flag if column exists
      await markOnboardingComplete(user.id);
      navigate('/');
    } else {
      alert(result.message || 'Failed to save profile');
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (needsConfirm) {
    return (
      <div className={"flex-grow-1 " + styles.pageWrapper}>
        <div className={"card shadow-sm " + styles.card}>
          <div className={"card-header bg-transparent " + styles.header}>
            <h2 className="mb-0">Confirm your email to continue</h2>
            <small className={styles.helper}>We sent a confirmation link to your email. After confirming, return to this tab and click Continue.</small>
          </div>
          <div className="card-body d-flex justify-content-end">
            <button onClick={refreshSession} className="btn btn-primary">Continue</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={"flex-grow-1 " + styles.pageWrapper}>
      <div className={"card shadow-sm " + styles.card}>
        <div className={styles.header}>
          <h2>Complete your volunteer profile</h2>
          <p className={styles.helper}>Tell organizations a bit about yourself so check-ins and registrations are seamless.</p>
        </div>
        <div className="card-body px-4 py-4">
          <form onSubmit={onSubmit} id="volunteer-setup-form">
            {/* Basic Information Section */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Basic Information</h3>
              <p className={styles.sectionDescription}>Your personal details for registration and communication</p>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className={styles.required} htmlFor="full_name">Full name</label>
                  <input id="full_name" name="full_name" className="form-control" value={form.full_name} onChange={onChange} required />
                </div>
                <div className="col-md-6">
                  <label htmlFor="display_name">Display name</label>
                  <input id="display_name" name="display_name" className="form-control" placeholder="Shown publicly" value={form.display_name} onChange={onChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" name="phone" type="tel" className="form-control" placeholder="(555) 555-5555" value={form.phone} onChange={onChange} />
                </div>
                <div className="col-md-6">
                  <label htmlFor="avatar_url">Avatar URL</label>
                  <input id="avatar_url" name="avatar_url" type="url" className="form-control" placeholder="https://..." value={form.avatar_url} onChange={onChange} />
                </div>
                <div className="col-12">
                  <label htmlFor="bio">Bio</label>
                  <textarea id="bio" name="bio" rows={3} className="form-control" placeholder="Tell us about your interests, skills, and why you want to volunteer..." value={form.bio} onChange={onChange} />
                  <small className="form-text text-muted">This helps organizations match you with the right opportunities</small>
                </div>
                <div className="col-md-6">
                  <label className={styles.required} htmlFor="timezone">Timezone</label>
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
              
              {/* Quick Presets - Integrated into section */}
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

              {/* Copy to All Button - After the grid */}
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
              <h3 className={styles.sectionTitle}>Preferred Location</h3>
              <p className={styles.sectionDescription}>Where would you like to volunteer?</p>
              <div className={styles.locationGrid}>
                <div>
                  <label htmlFor="city">City</label>
                  <input 
                    id="city" 
                    name="city" 
                    className="form-control" 
                    placeholder="City, neighborhood, or 'remote'" 
                    value={form.city} 
                    onChange={onChange} 
                  />
                </div>
                <div>
                  <label htmlFor="state">State</label>
                  <select 
                    id="state" 
                    name="state" 
                    className="form-select" 
                    value={form.state} 
                    onChange={onChange}
                  >
                    <option value="">Select state</option>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className={styles.footer}>
          <p className={styles.footerNote}>All fields are optional except Full name and Timezone</p>
          <button type="submit" form="volunteer-setup-form" className="btn btn-primary btn-lg px-5" disabled={saving}>
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              'Save profile'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
