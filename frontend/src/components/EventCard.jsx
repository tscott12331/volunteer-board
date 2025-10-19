import styles from './EventCard.module.css';

export default function EventCard({
    event,
    onMoreInfo,
}) {
    const { title, description, image_url, start_at } = event
    return (
        <>
        <div className={"card " + styles.openingCard}>
            <div className="card-header d-flex justify-content-end">
                <button 
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => onMoreInfo?.(event)}

                    data-bs-toggle="modal" 
                    data-bs-target="#info-modal"
                >
                More Info
                </button>
            </div>
            <img src={image_url} className={"card-img-top " + styles.cardImg} alt="Project photos" />
            <div className="card-body">
                <h5 className="card-title">{title}</h5>
                <p className="card-text">{description}</p>
                <a href="#" className="btn btn-primary">Register</a>
            </div>
            <div className="card-footer d-flex justify-content-between">
                <span>{start_at.toLocaleDateString()}</span>
                <span>{start_at.toLocaleTimeString()}</span>
            </div>
        </div>
        </>
    )
}
