import styles from './OpeningCard.module.css';

export default function OpeningCard({
    title,
    description,
    image,
    date,
    onMoreInfo,
}) {
    return (
        <>
        <div className={"card " + styles.openingCard}>
            <div className="card-header d-flex justify-content-end">
                <button 
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => onMoreInfo?.({title, description, image, date})}

                    data-bs-toggle="modal" 
                    data-bs-target="#info-modal"
                >
                More Info
                </button>
            </div>
            <img src={image} className={"card-img-top " + styles.cardImg} alt="Project photos" />
            <div className="card-body">
                <h5 className="card-title">{title}</h5>
                <p className="card-text">{description}</p>
                <a href="#" className="btn btn-primary">Register</a>
            </div>
            <div className="card-footer d-flex justify-content-between">
                <span>{date.toLocaleDateString()}</span>
                <span>{date.toLocaleTimeString()}</span>
            </div>
        </div>
        </>
    )
}
