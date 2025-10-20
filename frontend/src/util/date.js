// formats date into MM/DD/YY at HH:MM MD
export const formatDateAtTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${date.toLocaleString(undefined, {
                dateStyle: 'short'
            })} at ${hours % 12}:${(minutes < 10 ? "0" : "") + minutes} ${hours > 11 ? 'PM' : 'AM'}`
}

// formats event date and time for display (e.g., "Wed, Oct 22, 7:52 PM")
export const formatEventDateTime = (dateString) => {
    const date = new Date(dateString);
    const dayOfWeek = date.toLocaleString('en-US', { weekday: 'short' });
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${dayOfWeek}, ${month} ${day}, ${displayHours}:${displayMinutes} ${ampm}`;
}

