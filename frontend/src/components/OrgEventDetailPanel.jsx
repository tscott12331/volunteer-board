import { useMemo, useState, useEffect } from 'react';
import styles from './OrgEventDetailPanel.module.css';
import { formatEventDateTime } from '../util/date';
import { createEvent, updateEvent, updateEventStatus, deleteEvent, fetchEventRegistrations } from '../util/api/organizations';
import CheckInModal from './CheckInModal';

const STATES = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"
];

/*
  OrgEventDetailPanel
  - Shows event details with actions OR an editor form for create/edit.
  Props:
    - organization
    - event (nullable)
    - mode: 'view' | 'edit' | 'create'
    - onClose: () => void (clear selection)
    - onSaved: (eventId?: string) => void (refresh list)
    - onDeleted: () => void
    - onEdit: () => void (switch to edit mode)
*/
export default function OrgEventDetailPanel({ organization, event, mode = 'view', onClose, onSaved, onDeleted, onEdit }) {
  const isCreate = mode === 'create';
  const isEdit = mode === 'edit';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Helper functions for date/time conversion
  const toDateStr = (dt) => {
    if (!dt) return '';
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  
  const toTimeStr = (dt) => {
    if (!dt) return '';
    const hh = String(dt.getHours()).padStart(2, '0');
    const mi = String(dt.getMinutes()).padStart(2, '0');
    return `${hh}:${mi}`;
  };

  // Initialize form data based on mode and event
  const getInitialFormData = () => {
    if (mode === 'create' || !event) {
      return {
        title: '',
        summary: '',
        description: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        event_date: '',
        start_time: '',
        end_time: '',
        capacity: 10,
      };
    }
    
    // Parse existing event data for edit mode
    const startDt = event.start_at ? new Date(event.start_at) : null;
    const endDt = event.end_at ? new Date(event.end_at) : null;
    
    return {
      title: event.title || '',
      summary: event.summary || '',
      description: event.description || '',
      street: event.location?.street || '',
      city: event.location?.city || '',
      state: event.location?.state || '',
      zip: event.location?.zip || '',
      event_date: startDt ? toDateStr(startDt) : '',
      start_time: startDt ? toTimeStr(startDt) : '',
      end_time: endDt ? toTimeStr(endDt) : '',
      capacity: event.capacity ?? 10,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  
  // Update form data when mode or event changes
  useEffect(() => {
    setFormData(getInitialFormData());
  }, [mode, event?.id]);

  const badgeClass = useMemo(() => {
    const s = (event?.status || 'draft');
    switch (s) {
      case 'published': return 'bg-success';
      case 'completed': return 'bg-primary';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }, [event]);

  const handlePublishToggle = async () => {
    if (!event?.id) return;
    const newStatus = event.status === 'published' ? 'draft' : 'published';
    const res = await updateEventStatus(event.id, newStatus);
    if (!res.success) {
      alert('Failed to update status: ' + (res.error || 'Unknown error'));
      return;
    }
    onSaved && onSaved(event.id);
  };

  const handleDelete = async () => {
    if (!event?.id) return;
    if (!confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    const res = await deleteEvent(event.id);
    if (!res.success) {
      alert('Failed to delete event: ' + (res.error || 'Unknown error'));
      return;
    }
    onDeleted && onDeleted();
    onClose && onClose();
  };

  const handleDownloadCsv = async () => {
    if (!event?.id) return;
    // Fetch all registrants (handle both array and {rows: []} shapes)
    const res = await fetchEventRegistrations(event.id, { status: null, limit: 10000, offset: 0 });
    if (!res.success) {
      alert('Failed to fetch registrations: ' + (res.error || 'Unknown error'));
      return;
    }
    const rows = Array.isArray(res.data?.rows) ? res.data.rows : (Array.isArray(res.data) ? res.data : []);
    // Map to CSV rows
      const headers = ['Full Name', 'Display Name', 'Status', 'Checked In'];
    const dataLines = rows.map(r => {
      const full = (r.full_name || '').replaceAll('"', '""');
      const alias = (r.display_name || '').replaceAll('"', '""');
      const status = r.status || '';
      const checked = status === 'checked_in' ? 'Yes' : 'No';
        const values = [full, alias, status, checked];
      // Quote each value for CSV safety
      return values.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...dataLines].join('\n');
    // Prepend BOM for Excel compatibility
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeTitle = (event.title || 'event').replace(/[^a-z0-9\-_]+/gi, '_');
    a.href = url;
    a.download = `${safeTitle}_registrations.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Removed - delete moved to card only

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'capacity' ? Number(value) : value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    // Validate and combine date + time
    if (!formData.event_date || !formData.start_time || !formData.end_time) {
      setError('Please provide event date, start time, and end time');
      setSaving(false);
      return;
    }

    // Validate ZIP code format (5 digits or 5+4 format)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (formData.zip && !zipRegex.test(formData.zip)) {
      setError('ZIP code must be 5 digits or 5+4 format (e.g., 91325 or 91325-1234)');
      setSaving(false);
      return;
    }

    const startDate = new Date(`${formData.event_date}T${formData.start_time}`);
    const endDate = new Date(`${formData.event_date}T${formData.end_time}`);
    
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Invalid date or time values');
      setSaving(false);
      return;
    }
    
    if (endDate <= startDate) {
      setError('End time must be after start time');
      setSaving(false);
      return;
    }

    // Build location object with structured address
    const location = (formData.street && formData.city && formData.state && formData.zip) 
      ? {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
        }
      : null;

    const payload = {
      title: formData.title,
      summary: formData.summary,
      description: formData.description,
      location,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      capacity: Number(formData.capacity) || 1,
      status: event?.status || 'draft',
    };

    const res = isCreate
      ? await createEvent(organization.id, payload)
      : await updateEvent(event.id, payload);

    if (!res.success) {
      setError(res.error || 'Failed to save');
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved && onSaved(res.data?.id || event?.id);
  };

  // Render edit/create form
  if (isCreate || isEdit) {
    // Safety check - ensure formData is initialized
    if (!formData) {
      return (
        <aside className={styles.panel}>
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </aside>
      );
    }
    
    return (
      <aside className={styles.panel} aria-label={isCreate ? 'Create event panel' : 'Edit event panel'}>
        <div className={styles.header}>
          <h3 className={styles.title}>{isCreate ? 'Create Event' : `Edit: ${event?.title || ''}`}</h3>
          <div className={styles.actionsRow}>
            <button 
              className="btn btn-outline-secondary" 
              onClick={() => { onClose && onClose(); }} 
              aria-label="Cancel editing"
            >
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave} 
              disabled={saving} 
              aria-label="Save event"
              style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        {error && <div className="alert alert-danger" role="alert" aria-live="assertive">{error}</div>}
        <form className={styles.form} onSubmit={handleSave}>
          <div>
            <label htmlFor="title" className="form-label">Title</label>
            <input id="title" name="title" className="form-control" value={formData.title} onChange={handleChange} required />
          </div>
          <div>
            <label htmlFor="summary" className="form-label">Summary</label>
            <input id="summary" name="summary" className="form-control" value={formData.summary} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="description" className="form-label">Description</label>
            <textarea id="description" name="description" rows={4} className="form-control" value={formData.description} onChange={handleChange} />
          </div>
          <div>
            <label htmlFor="street" className="form-label">Street Address</label>
            <input id="street" name="street" className="form-control" value={formData.street} onChange={handleChange} required placeholder="123 Main St" />
          </div>
          <div className={styles.formRow}>
            <div>
              <label htmlFor="city" className="form-label">City</label>
              <input id="city" name="city" className="form-control" value={formData.city} onChange={handleChange} required placeholder="Los Angeles" />
            </div>
            <div>
              <label htmlFor="state" className="form-label">State</label>
              <select id="state" name="state" className="form-select" value={formData.state} onChange={handleChange} required>
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="zip" className="form-label">ZIP Code</label>
            <input 
              id="zip" 
              name="zip" 
              className="form-control" 
              value={formData.zip} 
              onChange={handleChange} 
              required 
              placeholder="91325 or 91325-1234"
              pattern="\d{5}(-\d{4})?"
              title="ZIP code must be 5 digits or 5+4 format"
            />
          </div>
          <div>
            <label htmlFor="event_date" className="form-label">Event Date</label>
            <input id="event_date" name="event_date" type="date" className="form-control" value={formData.event_date} onChange={handleChange} required />
          </div>
          <div className={styles.formRow}>
            <div>
              <label htmlFor="start_time" className="form-label">Start Time</label>
              <input id="start_time" name="start_time" type="time" className="form-control" value={formData.start_time} onChange={handleChange} required />
            </div>
            <div>
              <label htmlFor="end_time" className="form-label">End Time</label>
              <input id="end_time" name="end_time" type="time" className="form-control" value={formData.end_time} onChange={handleChange} required />
            </div>
          </div>
          <div>
            <label htmlFor="capacity" className="form-label">Capacity</label>
            <input id="capacity" name="capacity" type="number" min={1} className="form-control" value={formData.capacity} onChange={handleChange} required />
          </div>
        </form>
      </aside>
    );
  }

  // View mode
  if (!event) {
    return (
      <aside className={styles.panel} aria-label="No event selected">
        <div className={styles.header}>
          <h3 className={styles.title}>Select an event</h3>
        </div>
        <p className="text-muted mb-0">Pick an event from the list to view details, edit, or manage check-in.</p>
      </aside>
    );
  }

  return (
    <aside className={styles.panel} aria-label="Event details">
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <h3 className={styles.title}>
            {event.title}
            <span className={`badge ${badgeClass} ${styles.badge}`}>{event.status}</span>
          </h3>
          <button
            className={`btn btn-danger btn-sm ${styles.iconBtn}`}
            onClick={handleDelete}
            aria-label="Delete event"
            title="Delete"
          >
            <i className="bi bi-trash" />
          </button>
        </div>
        <div className={styles.actionsRow}>
          {/* Keep Edit as the primary text button for clarity */}
          <button
            className="btn btn-primary btn-sm"
            onClick={onEdit}
            aria-label="Edit event"
            style={{ backgroundColor: '#007bff', borderColor: '#007bff' }}
            title="Edit"
          >
            <i className="bi bi-pencil me-1" />
            <span className="d-none d-sm-inline">Edit</span>
          </button>

          {/* Separate secondary buttons with spacing */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowCheckIn(true)}
            aria-label="Open check-in"
            title="Check-In"
          >
            <i className="bi bi-check2-square me-1" />
            Check-In
          </button>
        </div>
      </div>
      <div className={styles.content}>
        <div className={styles.metaRow}>
          <i className="bi bi-calendar-event me-2"></i>
          {formatEventDateTime(event.start_at)}{event.end_at ? ` – ${formatEventDateTime(event.end_at)}` : ''}
        </div>
        {event.location && (event.location.street || event.location.city || event.location.state || event.location.zip) && (
          <div className={styles.metaRow}>
            <i className="bi bi-geo-alt me-2" />
            {[
              event.location.street,
              event.location.city && event.location.state && event.location.zip 
                ? `${event.location.city}, ${event.location.state} ${event.location.zip}`
                : [event.location.city, event.location.state, event.location.zip].filter(Boolean).join(' ')
            ].filter(Boolean).join(', ')}
          </div>
        )}
        <div className={styles.stats}>
          <i className="bi bi-people me-2"></i>
          {event.registered_count}/{event.capacity} registered • {event.checked_in_count} checked in
        </div>
        {event.summary && (
          <div>
            <div className={styles.sectionTitle}>Summary</div>
            <div>{event.summary}</div>
          </div>
        )}
        {event.description && (
          <div>
            <div className={styles.sectionTitle}>Description</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{event.description}</div>
          </div>
        )}
      </div>

      {/* Footer actions: Publish/Unpublish and Download CSV */}
      <div className={styles.footerActions}>
        <button
          className={`btn ${event.status === 'published' ? 'btn-warning' : 'btn-success'}`}
          onClick={handlePublishToggle}
        >
          <i className={`bi me-2 ${event.status === 'published' ? 'bi-cloud-slash' : 'bi-cloud-upload'}`} />
          {event.status === 'published' ? 'Unpublish' : 'Publish'}
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={handleDownloadCsv}
          title="Download CSV of registrations"
          aria-label="Download registrations CSV"
        >
          <i className="bi bi-download me-2" />
          Download CSV
        </button>
      </div>

      {showCheckIn && (
        <CheckInModal 
          event={event} 
          onClose={() => setShowCheckIn(false)} 
          onCheckInComplete={() => {
            // Ask parent to refresh counts and reselect this event
            if (onSaved && event?.id) onSaved(event.id);
          }}
        />
      )}
    </aside>
  );
}
