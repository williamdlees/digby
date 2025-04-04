
  // Helper function to compare two dictionaries (shallow comparison)
export function areObjectsEqual(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
      return false; // Different number of keys
  }

  return keys1.every(key => obj2.hasOwnProperty(key) && obj1[key] === obj2[key]);
}


// shallow comparison of lists of dicts
export function listsOfDictionariesEqual(list1: Record<string, any>[], list2: Record<string, any>[]): boolean {
  if (list1.length !== list2.length) {
      return false; // Lists have different lengths
  }

  // Convert each dictionary to a JSON string and sort the lists
  const sortedList1 = list1.map(dict => JSON.stringify(dict)).sort();
  const sortedList2 = list2.map(dict => JSON.stringify(dict)).sort();

  // Compare the sorted lists
  return sortedList1.every((dict, index) => dict === sortedList2[index]);
}

export function areListsEqual(list1: any[], list2: any[]): boolean {
  if (list1.length !== list2.length) {
      return false; // Lists have different lengths
  }

  const set1 = new Set(list1);
  const set2 = new Set(list2);

  if (set1.size !== set2.size) {
      return false; // Sets have different sizes
  }

  for (const item of set1) {
      if (!set2.has(item)) {
          return false; // An item in set1 is not in set2
      }
  }

  return true; // All items match
}
