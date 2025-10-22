import { useState, useEffect } from 'react';
import styles from './CreateEventModal.module.css';
import { createEvent, updateEvent } from '../util/api/organizations';

/*
    * Modal for creating or editing events
    * props:
        * organization - Organization object
        * event - Event object (if editing, null if creating)
        * onClose - Callback when modal is closed
        * onSave - Callback when event is saved
*/
export default function CreateEventModal({ organization, event, onClose, onSave }) {
    const isEditing = !!event;

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        description: '',
        location: '',
        start_at: '',
        end_at: '',
        capacity: 10,
        image_url: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (event) {
            // Convert timestamps to datetime-local format
            const startDate = new Date(event.start_at);
            const endDate = new Date(event.end_at);
            
            setFormData({
                title: event.title || '',
                summary: event.summary || '',
                description: event.description || '',
                location: event.location?.address || '',
                start_at: formatDateTimeLocal(startDate),
                end_at: formatDateTimeLocal(endDate),
                capacity: event.capacity || 10,
                image_url: event.image_url || '',
            });
        }
    }, [event]);

    const formatDateTimeLocal = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);

        // Validate dates
        const startDate = new Date(formData.start_at);
        const endDate = new Date(formData.end_at);

        if (endDate <= startDate) {
            setError('End date must be after start date');
            setIsSaving(false);
            return;
        }

        // Prepare event data
        const eventData = {
            title: formData.title,
            summary: formData.summary,
            description: formData.description,
            location: formData.location ? { address: formData.location } : null,
            start_at: startDate.toISOString(),
            end_at: endDate.toISOString(),
            capacity: parseInt(formData.capacity),
            status: event?.status || 'draft',
            image_url: formData.image_url || null,
        };

        const result = isEditing 
            ? await updateEvent(event.id, eventData)
            : await createEvent(organization.id, eventData);

        if (result.success) {
            onSave();
        } else {
            setError(result.message);
        }
        setIsSaving(false);
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        {isEditing ? 'Edit Event' : 'Create Event'}
                    </h2>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        type="button"
                    >
                        ×
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            className="form-control"
                            value={formData.title}
                            onChange={handleChange}
                            required
                            placeholder="New Event"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="summary">Summary</label>
                        <input
                            type="text"
                            id="summary"
                            name="summary"
                            className="form-control"
                            value={formData.summary}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="image_url">Event Image URL</label>
                        <input
                            type="text"
                            id="image_url"
                            name="image_url"
                            className="form-control"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-control"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="location">Address</label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            className="form-control"
                            value={formData.location}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="start_at">Start Date/Time</label>
                            <input
                                type="datetime-local"
                                id="start_at"
                                name="start_at"
                                className="form-control"
                                value={formData.start_at}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="end_at">End Date/Time</label>
                            <input
                                type="datetime-local"
                                id="end_at"
                                name="end_at"
                                className="form-control"
                                value={formData.end_at}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="capacity">Capacity</label>
                        <input
                            type="number"
                            id="capacity"
                            name="capacity"
                            className="form-control"
                            value={formData.capacity}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Event'}
                    </button>
                </form>
            </div>
        </div>
    );
}
