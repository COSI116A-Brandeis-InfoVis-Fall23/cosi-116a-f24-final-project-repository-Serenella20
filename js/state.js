export const state = {
  selectedFuelTypes: [], // Shared state for selected fuel types
};

export function updateState(newState) {
  Object.assign(state, newState);
  notifyListeners(); // Notify listeners about the state change
}

export function getState() {
  return state;
}

const listeners = [];

// Allow visualizations to subscribe to state changes
export function subscribe(listener) {
  listeners.push(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener(state));
}
