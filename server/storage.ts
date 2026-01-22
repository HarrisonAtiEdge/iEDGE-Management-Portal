// This implementation uses Firebase for all data storage
// The IStorage interface is not used in this Firebase-based implementation
export interface IStorage {
  // Placeholder interface - Firebase handles all storage operations
}

export class MemStorage implements IStorage {
  // Placeholder class - Firebase handles all storage operations
}

export const storage = new MemStorage();
