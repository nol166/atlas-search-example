import { Collection, Db, MongoClient, SearchIndexDescription } from "mongodb"; // bun install mongodb
import "dotenv/config"; // bun install dotenv

// connect to your Atlas cluster
const uri: string = process.env.URI || "mongodb://localhost:50197";

const client: MongoClient = new MongoClient(uri);

const run = async (): Promise<void> => {
  try {
    await client.connect();

    // set namespace
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

    // run the helper method
    console.log("creating atlas search index\n");
    console.log(await coll.createSearchIndex(index));

    // define pipeline
    const query: string = "mat" // the matrix autocomplete
    const agg: Array<{}> = [
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

    console.log(
      (await coll.aggregate(agg).toArray()).forEach((thing) =>
        console.log(thing)
      )
    );
  } finally {
    await client.close();
  }
}

try {
  run()
} catch(err) {
  console.error(err)
  throw new Error
}
