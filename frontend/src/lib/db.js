import Dexie from "dexie";

class ApexYouthDatabase extends Dexie {
  constructor() {
    super("ApexYouthDB");
    this.version(1).stores({
      bookmarks: "id, title, category, deadline, created_at"
    });
  }
}

export const db = typeof window !== "undefined" ? new ApexYouthDatabase() : null;
