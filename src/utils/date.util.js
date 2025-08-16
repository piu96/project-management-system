const formatDate = (date) => {
    if (!date) return null;

    const optionsDate = { month: 'long', day: '2-digit' }; // Example: March 20
    const optionsYear = { year: 'numeric' }; // Example: 2025
    const optionsTime = { hour: '2-digit', minute: '2-digit', hour12: true }; // Example: 5:20 PM

    const formattedDate = new Intl.DateTimeFormat('en-US', optionsDate).format(new Date(date));
    const formattedYear = new Intl.DateTimeFormat('en-US', optionsYear).format(new Date(date));
    const formattedTime = new Intl.DateTimeFormat('en-US', optionsTime).format(new Date(date));

    return {
        date: formattedDate,
        year: formattedYear,
        time: formattedTime.toLowerCase() // Convert AM/PM to lowercase
    };
};

module.exports = { formatDate };
