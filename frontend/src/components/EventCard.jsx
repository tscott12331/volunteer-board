import { useState } from 'react';
import { registerForEvent } from '../util/api/events';
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
            * is_registered
        * } | null | undefined
            * Information about the event
        * isNewlyRegistered: boolean
            * Whether the user has just registered for the event or not
        * onMoreInfo: (event) => any | undefined;
            * Called when more info button is pressed
        * onRegister: (id) => any | undefined;
            * Called when register button is clicked
            * Handles registration logic
*/
export default function EventCard({
    event,
    isNewlyRegistered,
    onMoreInfo,
    onRegister,
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
                <div className="d-flex flex-wrap align-items-center gap-2">
                    <button 
                        disabled={event.is_registered || isNewlyRegistered}
                        type="button" 
                        className="btn btn-primary"
                        onClick={() => onRegister?.(event.id)}
                    >
                        Register
                    </button>
                    {(event.is_registered || isNewlyRegistered) &&
                    <p className="m-0 d-inline-block text-secondary-emphasis">You are registered for this event</p>
                    }
                </div>
            </div>
            <div className="card-footer d-flex justify-content-between">
                <span>{startDate.toLocaleDateString()}</span>
                <span>{formatTime(startDate.toLocaleTimeString())}</span>
            </div>
        </div>
        </>
    )
}
