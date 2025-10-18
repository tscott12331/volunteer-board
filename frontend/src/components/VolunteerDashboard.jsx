import { useState } from 'react';
import OpeningCard from './OpeningCard';
import styles from './VolunteerDashboard.module.css';
import ProjectInfoModal from './ProjectInfoModal';

export default function VolunteerDashboard() {
    const [openings, setOpenings] = useState([{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("December 13, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("August 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("July 28, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("December 12, 2025"),
    },{
        title: "Park Cleanup",
        description: "Come help us clean up the park...",
        image: "/placeholder.svg",
        date: new Date("December 12, 2025"),
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
        <div className={styles.pageWrapper}>
            <h2 className="mb-4 text-center fw-bold">Openings</h2>
            <div className="input-group">
                <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search for openings"
                    aria-label="Text input with segmented dropdown button"
                />
                <button type="button" className="btn btn-primary">Search</button>
                <input 
                    type="date" 
                    className="btn btn-outline-secondary dropdown-toggle dropdown-toggle-split" 
                    onChange={onDateChange}
                />
            </div>
            <div className={"d-grid gap-3 mt-4 " + styles.openingsWrappers}>
                {
                    openings.length > 0 ?
                        dateFilter ?
                        openings.filter(o => datesMatch(o.date, dateFilter)).map((o, i) =>
                            <OpeningCard 
                            title={o.title} 
                            description={o.description}
                            image={o.image}
                            date={o.date}
                            onMoreInfo={(project) => setSelectedProject(project)}
                            key={i}
                            />
                        )
                        :
                        openings.map((o, i) =>
                            <OpeningCard 
                            title={o.title} 
                            description={o.description}
                            image={o.image}
                            date={o.date}
                            onMoreInfo={(project) => setSelectedProject(project)}
                            key={i}
                            />
                        )
                    :
                    <p>No openings available</p>
                }
            </div>
        </div>
        <ProjectInfoModal project={selectedProject} />
        </>
    )
}
