export type TransformedQuery = {
  searchTopics: {
    entities: string[];
    concepts: string[];
    claims: string[];
  };
  ragQuestion: "string";
  userQuery: "string";
  category: "string";
};

export type RecordType = {
  id: `${string}-${string}-${string}-${string}-${string}`;
  values: number[];
  metadata: {
    text: string;
    category: string;
  };
};
