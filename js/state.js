 /* I used the following article as refrence 
 1) From Dev by Brian Neville-O'Neill --> https://dev.to/bnevilleoneill/state-management-pattern-in-javascript-sharing-data-across-components-2gkj

 Information above also Included in the Acknowledgments portion of the html file.*/


export const state = {
  selectedFuelTypes: [], 
};

export function updateState(newState) {
  Object.assign(state, newState);
  notifyListeners();
}

export function getState() {
  return state;
}

const listeners = [];

export function subscribe(listener) {
  listeners.push(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener(state));
}
