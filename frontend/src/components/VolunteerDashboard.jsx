import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import styles from './VolunteerDashboard.module.css';
import EventInfoModal from './EventInfoModal';
import { fetchEvents } from '../util/api/events';

export default function VolunteerDashboard() {
    const [events, setEvents] = useState([]);

    const [startDate, setStartDate] = useState(undefined);
    const [endDate, setEndDate] = useState(undefined);
    const [searchQuery, setSearchQuery] = useState(undefined);

    const  [searchValue, setSearchValue] = useState("");

    const [selectedEvent, setSelectedEvent] = useState(undefined);

    const onDateFilterChange = (e, setFilter) => {
        if(e.target.value.length > 0) {
            const split = e.target.value.split('-');
            const d = new Date(split[0], split[1] - 1, split[2]);
            setFilter(d);
        } else {
            setFilter(undefined);
        }
    }

    const onSearchInputChange = (e) => {
        setSearchValue(e.target.value);
    }

    const onSearchInputKeyDown = (e) => {
        if(e.key === "Enter") {
            search();
        }
    }

    const search = () => {
        setSearchQuery(searchValue.length > 0 ? searchValue : undefined);
    }

    useEffect(() => {
        fetchEvents(searchQuery, startDate, endDate).then(res => {
            if(res.success) {
                setEvents(res.data);
            }
        })
    }, [searchQuery, startDate, endDate]);

    return (
        <>
        <div className={"p-4 flex-grow-1 " + styles.pageWrapper}>
            <h2 className="mb-4 text-center fw-bold">Register to Volunteer</h2>
            <div className="input-group">
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search for events"
                    aria-label="Text input with segmented dropdown filter button"
                    value={searchValue}
                    onChange={onSearchInputChange}
                    onKeyDown={onSearchInputKeyDown}
                
                />
                <button className="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Filter</button>
                <ul className="dropdown-menu">
                    <li>
                        <div className="dropdown-item d-flex gap-2 justify-content-between">
                            <label className="lh-lg" htmlFor="start-date">Start: </label>
                            <input 
                                id="start-date"
                                type="date" 
                                className="btn btn-outline-secondary" 
                                onChange={(e) => onDateFilterChange(e, setStartDate)}
                            />
                        </div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                        <div className="dropdown-item d-flex gap-2 justify-content-between">
                            <label className="lh-lg" htmlFor="end-date">End: </label>
                            <input 
                                id="end-date"
                                type="date" 
                                className="btn btn-outline-secondary" 
                                onChange={(e) => onDateFilterChange(e, setEndDate)}
                            />
                        </div>
                    </li>
                </ul>
                <button type="button" className="btn btn-primary" onClick={search}>Search</button>
            </div>
                {
                    events.length > 0 ?
                    <div className={"d-grid gap-3 mt-4 " + styles.eventsWrappers}>
                        {
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
