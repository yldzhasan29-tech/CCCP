// Función para convertir horas de texto a minutos reales
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Esta función calcula el porcentaje del match basándose en la regla del 40-30-15-15%
export function calculateMatchScore(driver, passengerInput) {
  let score = 0;

  // 1. RUTA (Vale 40 puntos)
  if (driver.origin === passengerInput.origin && driver.destination === passengerInput.destination) {
    score += 40;
  } else if (driver.destination === passengerInput.destination) {
    score += 20; 
  }

  // 2. HORARIO (Vale 30 puntos)
  const driverMin = timeToMinutes(driver.departureTime);
  const passengerMin = timeToMinutes(passengerInput.time);
  const timeDifference = Math.abs(driverMin - passengerMin);

  if (timeDifference === 0) {
    score += 30; 
  } else if (timeDifference <= 15) {
    score += 20; 
  } else if (timeDifference <= 30) {
    score += 10;
  }

  // 3. CALIFICACIÓN (Vale 15 puntos)
  score += (driver.rating / 5.0) * 15;

  // 4. PREFERENCIAS (Vale 15 puntos)
  let preferencePoints = 0;
  if (passengerInput.music === driver.music) preferencePoints += 7.5;
  if (passengerInput.wantsQuiet && !driver.chatty) preferencePoints += 7.5;
  score += preferencePoints;

  return Math.round(score); 
}
