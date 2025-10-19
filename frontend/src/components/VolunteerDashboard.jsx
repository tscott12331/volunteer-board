import { useState } from 'react';
import EventCard from './EventCard';
import styles from './VolunteerDashboard.module.css';
import EventInfoModal from './EventInfoModal';

export default function VolunteerDashboard() {
    const [events, setEvents] = useState([
    {
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("December 13, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("August 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("July 28, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image_url: "/placeholder.svg",
        start_at: new Date("December 12, 2025"),
    },
    ]);

    const [dateFilter, setDateFilter] = useState(undefined);
    const [selectedProject, setSelectedProject] = useState(undefined);

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
            <div className={"d-grid gap-3 mt-4 " + styles.eventsWrappers}>
                {
                    events.length > 0 ?
                        dateFilter ?
                        events.filter(e => datesMatch(e.date, dateFilter)).map((e, i) =>
                            <EventCard 
                            event={e}
                            onMoreInfo={(project) => setSelectedProject(project)}
                            key={i}
                            />
                        )
                        :
                        events.map((e, i) =>
                            <EventCard 
                            event={e}
                            onMoreInfo={(project) => setSelectedProject(project)}
                            key={i}
                            />
                        )
                    :
                    <p className="text-center">No events available</p>
                }
            </div>
        </div>
        <EventInfoModal event={selectedProject} />
        </>
    )
}
