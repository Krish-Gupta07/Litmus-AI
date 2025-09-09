export type TransformedQuery = {
  searchTopics: {
    entities: string[];
    concepts: string[];
    claims: string[];
  };
  ragQuestion: string;
  userQuery: string;
  category: string;
};
