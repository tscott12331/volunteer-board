import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './VolunteerSetup.module.css';
import { supabase } from '../util/api/supabaseClient';
import { upsertProfile, markOnboardingComplete } from '../util/api/profile';

export default function VolunteerSetup() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    display_name: '',
    avatar_url: '',
    phone: '',
    bio: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles',
    availability: {
      days: [],
      start_time: '',
      end_time: '',
      location: '',
    },
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

  const toggleDay = (day) => {
    setForm(f => {
      const days = new Set(f.availability.days || []);
      if (days.has(day)) days.delete(day); else days.add(day);
      return { ...f, availability: { ...f.availability, days: Array.from(days) } };
    });
  };

  const onAvailabilityChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, availability: { ...f.availability, [name]: value } }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    // include availability in the profile payload
    const payload = { ...form };
    // normalize days to a simple array of strings
    if (payload.availability && Array.isArray(payload.availability.days)) {
      payload.availability.days = payload.availability.days;
    }
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
      <div className={"p-4 flex-grow-1 " + styles.pageWrapper}>
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
    <div className={"p-4 flex-grow-1 " + styles.pageWrapper}>
      <div className={"card shadow-sm " + styles.card}>
        <div className={"card-header bg-transparent " + styles.header}>
          <h2 className="mb-0">Complete your volunteer profile</h2>
          <small className={styles.helper}>Tell organizations a bit about yourself so check-ins and registrations are seamless.</small>
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
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
                <label htmlFor="avatar_url">Avatar URL</label>
                <input id="avatar_url" name="avatar_url" className="form-control" placeholder="https://..." value={form.avatar_url} onChange={onChange} />
              </div>
              <div className="col-md-6">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" className="form-control" placeholder="(555) 555-5555" value={form.phone} onChange={onChange} />
              </div>
              <div className="col-12">
                <label htmlFor="bio">Bio</label>
                <textarea id="bio" name="bio" rows={3} className="form-control" placeholder="A little about you..." value={form.bio} onChange={onChange} />
              </div>
              <div className="col-md-6">
                <label className={styles.required} htmlFor="timezone">Timezone</label>
                <select id="timezone" name="timezone" className="form-select" value={form.timezone} onChange={onChange} required>
                  {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>

              <div className="col-12 mt-3">
                <h5>Availability</h5>
                <div className="mb-2">
                  <div className="d-flex flex-wrap gap-2">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div className="form-check" key={d}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`avail-${d}`}
                          checked={form.availability.days.includes(d)}
                          onChange={() => toggleDay(d)}
                        />
                        <label className="form-check-label" htmlFor={`avail-${d}`}>{d}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="row g-3">
                  <div className="col-md-3">
                    <label htmlFor="start_time">Start time</label>
                    <input id="start_time" name="start_time" type="time" className="form-control" value={form.availability.start_time} onChange={onAvailabilityChange} />
                  </div>
                  <div className="col-md-3">
                    <label htmlFor="end_time">End time</label>
                    <input id="end_time" name="end_time" type="time" className="form-control" value={form.availability.end_time} onChange={onAvailabilityChange} />
                  </div>
                  <div className="col-md-6">
                    <label htmlFor="location">Preferred location</label>
                    <input id="location" name="location" className="form-control" placeholder="City, neighborhood, or 'remote'" value={form.availability.location} onChange={onAvailabilityChange} />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-4">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
