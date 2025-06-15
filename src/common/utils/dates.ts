export function dateStr(d?: number): string {
	const realDate = d ? new Date(d) : new Date();
	const year = String(realDate.getFullYear()).padStart(4, '0');
    const month = String(realDate.getMonth() + 1).padStart(2, '0');
    const day = String(realDate.getDate()).padStart(2, '0');
	return `${year}${month}${day}`
}

export function timeStr(d?: number) {
	const realDate = d ? new Date(d) : new Date();
	const hour = String(realDate.getHours()).padStart(2, '0');
    const minute = String(realDate.getMinutes()).padStart(2, '0');
    const seconds = String(realDate.getSeconds()).padStart(2, '0');
    const milliseconds = String(realDate.getMilliseconds()).padStart(3, '0');
	return `${hour}${minute}${seconds}${milliseconds}`
}
