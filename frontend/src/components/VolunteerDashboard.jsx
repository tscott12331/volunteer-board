import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import styles from './VolunteerDashboard.module.css';
import EventInfoModal from './EventInfoModal';
import { fetchEvents } from '../util/api/events';

export default function VolunteerDashboard() {
    const [events, setEvents] = useState([]);

    const [dateFilter, setDateFilter] = useState(undefined);
    const [selectedEvent, setSelectedEvent] = useState(undefined);

    const onDateChange = e => {
        if(e.target.value.length > 0) {
            const split = e.target.value.split('-');
            const d = new Date(split[0], split[1] - 1, split[2]);
            setDateFilter(d);
        } else {
            setDateFilter(undefined);
        }
    }

    const datesMatch = (date1, date2) => {
        return date1.getFullYear() === date2.getFullYear()
            && date1.getMonth() === date2.getMonth()
            && date1.getDate() === date2.getDate()
    }

    useEffect(() => {
        fetchEvents().then(res => {
            if(res.success) {
                setEvents(res.data);
            }
        })
    }, []);

    return (
        <>
        <div className={"p-4 flex-grow-1 " + styles.pageWrapper}>
            <h2 className="mb-4 text-center fw-bold">Register to Volunteer</h2>
            <div className="input-group">
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search for events"
                    aria-label="Text input with segmented dropdown button"
                />
                <button type="button" className="btn btn-primary">Search</button>
                <input 
                    type="date" 
                    className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" 
                    onChange={onDateChange}
                />
            </div>
                {
                    events.length > 0 ?
                    <div className={"d-grid gap-3 mt-4 " + styles.eventsWrappers}>
                        {
                        dateFilter ?
                        events.filter(e => datesMatch(e.date, dateFilter)).map((e, i) =>
                            <EventCard 
                            event={e}
                            onMoreInfo={(event) => setSelectedEvent(event)}
                            key={i}
                            />
                        )
                        :
                        events.map((e, i) =>
                            <EventCard 
                            event={e}
                            onMoreInfo={(event) => setSelectedEvent(event)}
                            key={i}
                            />
                        )
                    }
                    </div>
                    :
                    <p className="text-center mt-4">No events available</p>
                }
        </div>
        <EventInfoModal event={selectedEvent} />
        </>
    )
}
