import {
  Collection,
  Db,
  MongoClient,
  SearchIndexDescription,
  Document,
} from "mongodb";
import "dotenv/config";

const queryArguments: string[] = process.argv.slice(2);

const query: string = queryArguments.join(" ").toString() || "";
console.info("🎥 - query:", query);

const leave = (special?: boolean) => {
  let message: string;
  message = !special
    ? "Please make to set up a local Atlas instance first:\nhttps://www.mongodb.com/docs/atlas/cli/stable/atlas-cli-deploy-local/#use-atlas-search-with-a-local-atlas-deployment"
    : "Usage: bun run index.ts <movie title>\nExample: bun run index.ts The Matrix";
  console.log(message);
  process.exit(1);
};

!queryArguments[0] ? leave(true) : null;

const uri: string = process.env.URI || "mongodb://localhost:50197";

uri.includes("localhost") && uri.includes("27017") ? leave() : null;

const client: MongoClient = new MongoClient(uri);

const run = async (): Promise<void> => {
  try {
    await client.connect();

    const database: Db = client.db("sample_mflix");
    const coll: Collection = database.collection("movies");

    // // drop the index
    // TODO: Uncomment to delete the Atlas Search index
    // await coll.dropSearchIndex('title_index')

    const index: SearchIndexDescription = {
      name: "title_index",
      definition: {
        /* search index definition fields */
        mappings: {
          dynamic: false,
          fields: {
            title: {
              type: "autocomplete",
              tokenization: "edgeGram",
              foldDiacritics: true,
              minGrams: 2,
              maxGrams: 15,
            },
            plot: {
              type: "autocomplete",
              tokenization: "edgeGram",
              foldDiacritics: true,
              minGrams: 2,
              maxGrams: 15,
            },
          },
        },
      },
    };

    console.log("creating atlas search index\n");
    console.log(await coll.createSearchIndex(index));

    // define pipeline
    const pipeline: Array<{}> = [
      {
        $search: {
          index: "title_index",
          autocomplete: { query, path: "title" },
        },
      },
      { $limit: 20 },
      { $project: { _id: 0, title: 1 } },
    ];

    // run pipeline
    const results: Document[] = (await coll.aggregate(pipeline).toArray())
    console.table(results)
  } finally {
    await client.close();
  }
};

try {
  run();
} catch (err) {
  console.error(err);
  throw new Error();
}
