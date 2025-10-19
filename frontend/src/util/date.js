// formats date into MM/DD/YY at HH:MM MD
export const formatDateAtTime = (date) => {
    return `${date.toLocaleString(undefined, {
                dateStyle: 'short'
            })} at ${date.getHours() % 12}:${date.getMinutes()} ${date.getHours() > 11 ? 'PM' : 'AM'}`
}

