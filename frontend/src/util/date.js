// formats date into MM/DD/YY at HH:MM MD
export const formatDateAtTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${date.toLocaleString(undefined, {
                dateStyle: 'short'
            })} at ${hours % 12}:${(minutes < 10 ? "0" : "") + minutes} ${hours > 11 ? 'PM' : 'AM'}`
}

