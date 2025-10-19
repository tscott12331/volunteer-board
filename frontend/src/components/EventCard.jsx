import styles from './EventCard.module.css';

/*
    * Card displaying basic info for an event
    * props:
        * event: {
            * id: string
            * org_id: string
            * title: string
            * summary: string | null
            * description: string | null
            * location: {
                * lon: string
                * lat: string
            * } | null
            * start_at: string (timestamptz)
            * end_at: string (timestamptz)
            * status: "draft" | "published" | "cancelled" | "completed"
            * capacity: number
            * image_url: string | null
            * created_at: string (timestamptz)
            * updated_at: string (timestamptz)
        * } | null | undefined
            * Information about the event
        * onMoreInfo: (event) => void | undefined;
            * Called when more info button is pressed
*/
export default function EventCard({
    event,
    onMoreInfo,
}) {
    const { title, description, image_url, start_at } = event
    const startDate = new Date(start_at);

    const formatTime = (time) => {
        const [value, md] = time.split(' ');
        const newValue = value.slice(0, -3);
        return `${newValue} ${md}`;
    }

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
            {image_url &&
            <img src={image_url} className={"text-center card-img-top " + styles.cardImg} alt="Project photos" />
            }
            <div className="card-body d-flex gap-3 flex-column justify-content-between align-items-start">
                <div>
                    <h5 className="card-title">{title}</h5>
                    <p className="card-text">{description}</p>
                </div>
                <a href="#" className="btn btn-primary">Register</a>
            </div>
            <div className="card-footer d-flex justify-content-between">
                <span>{startDate.toLocaleDateString()}</span>
                <span>{formatTime(startDate.toLocaleTimeString())}</span>
            </div>
        </div>
        </>
    )
}
