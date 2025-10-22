import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OrgSetup.module.css';
import { createOrganizationProfile } from '../util/api/organizations';

/*
    * Organization setup/onboarding page
    * Shown to new organization accounts to complete their profile
    * props:
        * user - Supabase Auth user object
*/
export default function OrgSetup({ user }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Generate URL-friendly slug from organization name
    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/\s+/g, '-')      // Replace spaces with hyphens
            .replace(/-+/g, '-')       // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');    // Remove leading/trailing hyphens
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validate
        if (!formData.name.trim()) {
            setError('Organization name is required');
            setIsSubmitting(false);
            return;
        }

        const slug = generateSlug(formData.name);
        if (!slug) {
            setError('Please provide a valid organization name');
            setIsSubmitting(false);
            return;
        }

        // Create organization
        const orgData = {
            owner_user_id: user.id,
            name: formData.name.trim(),
            slug: slug,
            description: formData.description.trim() || null,
        };

        const result = await createOrganizationProfile(orgData);

        if (result.success) {
            // Success! Redirect to org dashboard
            navigate('/org-dashboard');
        } else {
            setError(result.message);
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.setupContainer}>
            <div className={styles.setupCard}>
                <div className={styles.header}>
                    <div className={styles.iconCircle}>
                        <i className="bi bi-building"></i>
                    </div>
                    <h1 className={styles.title}>Welcome! Let's set up your organization</h1>
                    <p className={styles.subtitle}>
                        Complete your organization profile to start creating volunteer events
                    </p>
                </div>

                {error && (
                    <div className="alert alert-danger" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="name" className={styles.label}>
                            Organization Name <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            className="form-control form-control-lg"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Downtown Community Center"
                            required
                            disabled={isSubmitting}
                        />
                        {formData.name && (
                            <small className={styles.slugPreview}>
                                URL: stepup.org/{generateSlug(formData.name)}
                            </small>
                        )}
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description" className={styles.label}>
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            className="form-control"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Tell volunteers about your organization's mission and impact..."
                            disabled={isSubmitting}
                        />
                        <small className="text-muted">
                            This will be shown to volunteers when they view your events
                        </small>
                    </div>

                    <div className="d-flex justify-content-end gap-2 pt-3" style={{ borderTop: '1px solid #3a3f44' }}>
                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            disabled={isSubmitting}
                            style={{ minWidth: '200px' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Creating Organization...
                                </>
                            ) : (
                                <>
                                    Complete Setup
                                    <i className="bi bi-arrow-right ms-2"></i>
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className={styles.footer}>
                    <p className={styles.footerText}>
                        <i className="bi bi-info-circle me-2"></i>
                        You can update these details later in your profile settings
                    </p>
                </div>
            </div>
        </div>
    );
}
