import { useState } from 'react';
import styles from './OrgProfilePanel.module.css';
import { updateOrganization } from '../util/api/organizations';

/*
    * Panel for editing organization profile
    * props:
        * organization - Organization object with details
        * onUpdate - Callback when organization is updated
*/
export default function OrgProfilePanel({ organization, onUpdate }) {
    const [formData, setFormData] = useState({
        name: organization?.name || '',
        description: organization?.description || '',
        logo_url: organization?.logo_url || '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);

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
        setMessage(null);

        const result = await updateOrganization(organization.id, formData);
        
        if (result.success) {
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
            onUpdate(result.data);
        } else {
            setMessage({ type: 'error', text: 'Failed to update profile: ' + result.message });
        }
        setIsSaving(false);
    };

    return (
        <div className={styles.profileContainer}>
            <h2 className={styles.title}>Organization Profile</h2>

            {message && (
                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`} role="alert">
                    {message.text}
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={() => setMessage(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="logo_url" className={styles.label}>Logo</label>
                    <div className={styles.logoPreview}>
                        {formData.logo_url && (
                            <img 
                                src={formData.logo_url} 
                                alt="Organization logo" 
                                className={styles.logoImage}
                            />
                        )}
                    </div>
                    <input
                        type="text"
                        id="logo_url"
                        name="logo_url"
                        className="form-control"
                        value={formData.logo_url}
                        onChange={handleChange}
                        placeholder="Logo URL"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="name" className={styles.label}>Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.label}>Description</label>
                    <textarea
                        id="description"
                        name="description"
                        className="form-control"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </form>
        </div>
    );
}
