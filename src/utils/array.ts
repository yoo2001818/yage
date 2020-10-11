// Removes the item in the array in O(1). This will do this by changing order
// of the array.
export function removeItem<T>(array: T[], index: number): void {
  if (array.length - 1 === index) {
    array.pop();
  } else {
    array[index] = array[array.length - 1];
    array.pop();
  }
}
