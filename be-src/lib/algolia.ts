// for the default version
import algoliasearch from "algoliasearch";

// // for the search only version
// import algoliasearch from 'algoliasearch/lite';

const client = algoliasearch(
  process.env.ALGOLIA_API_KEY,
  process.env.ALGOLIA_SECOND_API_KEY
);
export const index = client.initIndex(process.env.ALGOLIA_INDEX);
