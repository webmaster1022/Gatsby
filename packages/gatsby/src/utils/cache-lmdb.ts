import { open, RootDatabase, Database, DatabaseOptions } from "lmdb"
import fs from "fs-extra"
import path from "path"

// Since the regular GatsbyCache saves to "caches" this should be "caches-lmdb"
const cacheDbFile =
  process.env.NODE_ENV === `test`
    ? `caches-lmdb-${
        // FORCE_TEST_DATABASE_ID will be set if this gets executed in worker context
        // when running jest tests. JEST_WORKER_ID will be set when this gets executed directly
        // in test context (jest will use jest-worker internally).
        process.env.FORCE_TEST_DATABASE_ID ?? process.env.JEST_WORKER_ID
      }`
    : `caches-lmdb`

export default class GatsbyCacheLmdb {
  private static store
  private db: Database | undefined
  private encoding: DatabaseOptions["encoding"]
  public readonly name: string
  // Needed for plugins that want to write data to the cache directory
  public readonly directory: string
  // TODO: remove `.cache` in v4. This is compat mode - cache-manager cache implementation
  // expose internal cache that gives access to `.del` function that wasn't available in public
  // cache interface (gatsby-plugin-sharp use it to clear no longer needed data)
  public readonly cache: GatsbyCacheLmdb

  constructor({
    name = `db`,
    encoding = `json`,
  }: {
    name: string
    encoding?: DatabaseOptions["encoding"]
  }) {
    this.name = name
    this.encoding = encoding
    this.directory = path.join(process.cwd(), `.cache/caches/${name}`)
    this.cache = this
  }

  init(): GatsbyCacheLmdb {
    fs.ensureDirSync(this.directory)
    return this
  }

  private static getStore(): RootDatabase {
    if (!GatsbyCacheLmdb.store) {
      GatsbyCacheLmdb.store = open({
        name: `root`,
        path: path.join(process.cwd(), `.cache/${cacheDbFile}`),
        compression: true,
        maxDbs: 200,
      })
    }
    return GatsbyCacheLmdb.store
  }

  private getDb(): Database {
    if (!this.db) {
      this.db = GatsbyCacheLmdb.getStore().openDB({
        name: this.name,
        encoding: this.encoding,
      })
    }
    return this.db
  }

  async get<T = unknown>(key): Promise<T | undefined> {
    return this.getDb().get(key)
  }

  async set<T>(key: string, value: T): Promise<T | undefined> {
    await this.getDb().put(key, value)
    return value
  }

  async del(key: string): Promise<void> {
    return this.getDb().remove(key) as unknown as Promise<void>
  }
}
