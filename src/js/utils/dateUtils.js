/**
 * Date and time manipulation utilities.
 * Handles local date strings ("YYYY-MM-DD") strictly without UTC day-shift bugs.
 */

export function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateStr) {
  if (!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(dateStr, days) {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(fromStr, toStr) {
  if (!fromStr || !toStr) return 0;
  const d1 = parseLocalDate(fromStr);
  const d2 = parseLocalDate(toStr);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDayOfWeek(dateStr) {
  return parseLocalDate(dateStr).getDay(); // 0 = Sunday, 1 = Monday, ...
}

export function formatDate(dateStr, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!dateStr) return '';
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString(undefined, options);
}

export function formatTime(timeStr) {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function getMonthMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const matrix = [];
  let currentWeek = [];

  // Previous month trailing days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonthDate = new Date(year, month - 1, day);
    const mStr = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    currentWeek.push({
      dateString: `${prevMonthDate.getFullYear()}-${mStr}-${dStr}`,
      dayNumber: day,
      isCurrentMonth: false
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(day).padStart(2, '0');
    currentWeek.push({
      dateString: `${year}-${mStr}-${dStr}`,
      dayNumber: day,
      isCurrentMonth: true
    });

    if (currentWeek.length === 7) {
      matrix.push(currentWeek);
      currentWeek = [];
    }
  }

  // Next month leading days to complete week
  if (currentWeek.length > 0) {
    let nextDay = 1;
    while (currentWeek.length < 7) {
      const nextMonthDate = new Date(year, month + 1, nextDay);
      const mStr = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
      const dStr = String(nextDay).padStart(2, '0');
      currentWeek.push({
        dateString: `${nextMonthDate.getFullYear()}-${mStr}-${dStr}`,
        dayNumber: nextDay,
        isCurrentMonth: false
      });
      nextDay++;
    }
    matrix.push(currentWeek);
  }

  return matrix;
}
