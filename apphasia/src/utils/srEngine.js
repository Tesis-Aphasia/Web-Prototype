// utils/srEngine.js

/**
 * Intervalos fijos (en segundos)
 */
export function getIntervals() {
  return [15, 30, 60, 120, 240];
}

/**
 * Estado interno de una tarjeta SR:
 * {
 *   interval_index: índice actual preparado (ej. 0=15s),
 *   baseline_index: último intervalo consolidado por un acierto,
 *   success_streak: consecutivos bien,
 *   lapses: fallos acumulados,
 *   last_answer_correct: bool,
 *   last_timer_index: índice del último timer corrido
 * }
 */

/**
 * Calcular qué intervalo se debe usar en el próximo intento según la respuesta.
 * - Si es correcto: usar preparedIndex y preparar baseline+1 para la próxima.
 * - Si es incorrecto: usar baselineIndex y resetear prepared a baseline+1.
 *
 * @param {Object} card - tarjeta actual (con campos SR)
 * @param {boolean} correct - si la respuesta fue correcta
 * @returns {Object} nextState - nuevo estado de la tarjeta
 */
export function computeNext(card, correct) {
  const now = Date.now();
  const intervals = getIntervals();

  // baseline = último acierto consolidado
  const baselineIndex =
    typeof card.baseline_index === "number" ? card.baseline_index : -1;

  // prepared = intervalo propuesto si acierta
  let preparedIndex =
    typeof card.interval_index === "number" ? card.interval_index : 0;

  let nextBaseline = baselineIndex;
  let nextPrepared = preparedIndex;
  let nextTimerIndex = null;

  let streak = card.success_streak || 0;
  let lapses = card.lapses || 0;

  if (correct) {
    // ✅ se corre el timer con el prepared actual
    nextTimerIndex = preparedIndex;
    streak += 1;
    // el próximo preparado sube 1 (pero baseline se promueve al terminar timer)
    nextPrepared = Math.min(preparedIndex + 1, intervals.length - 1);
  } else {
    // ❌ se corre timer con baseline
    nextTimerIndex = Math.max(baselineIndex, 0);
    streak = 0;
    lapses += 1;
    // el próximo preparado = baseline+1
    nextPrepared = Math.min(nextTimerIndex + 1, intervals.length - 1);
  }

  const secs = intervals[nextTimerIndex];
  const nextDue = now + secs * 1000;

  return {
    ...card,
    last_answer_correct: correct,
    last_timer_index: nextTimerIndex,
    baseline_index: nextBaseline, // baseline solo se promueve al terminar el timer de un acierto
    interval_index: nextPrepared, // prepared para la próxima vez
    success_streak: streak,
    lapses,
    next_due: nextDue,
    status: correct ? "learning" : "relearning",
    current_interval: secs, // útil para UI (segundos que corre ahora)
  };
}

/**
 * Promover baseline después de que termina un timer exitoso.
 * (Esto se llama cuando se acaba el temporizador de un acierto)
 */
export function consolidateBaseline(card) {
  if (card.last_answer_correct && typeof card.last_timer_index === "number") {
    return {
      ...card,
      baseline_index: card.last_timer_index,
    };
  }
  return card;
}
