import { Pinecone } from "@pinecone-database/pinecone";

// Lazy initialization of Pinecone client
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error(
        "PINECONE_API_KEY is not set. Please configure it in your environment variables."
      );
    }
    pineconeClient = new Pinecone({
      apiKey,
    });
  }
  return pineconeClient;
}

// Get the index for career/course embeddings
export const getIndex = () => {
  const indexName = process.env.PINECONE_INDEX;
  if (!indexName) {
    throw new Error(
      "PINECONE_INDEX is not set. Please configure it in your environment variables."
    );
  }
  return getPineconeClient().index(indexName);
};

// Metadata type value (compatible with Pinecone RecordMetadataValue)
type MetadataValue = string | number | boolean | string[];

// Metadata interface for career/course vectors
export interface VectorMetadata {
  [key: string]: MetadataValue | undefined;
  type?: string;
  userType?: string;
  field?: string;
  title?: string;
  description?: string;
  category?: string;
  skills?: string[];
  educationPath?: string[];
  demandScore?: number;
  averageSalary?: string;
  growthOutlook?: string;
  hiringRoles?: string[];
  level?: string;
  duration?: string;
  careerPaths?: string[];
  company?: string;
  location?: string;
}

// Types for vector operations
export interface CareerVector {
  id: string;
  values: number[];
  metadata: VectorMetadata;
}

export interface QueryResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

/**
 * Upsert vectors into Pinecone index
 */
export async function upsertVectors(vectors: CareerVector[], namespace?: string): Promise<void> {
  const index = getIndex();

  // Filter out undefined values from metadata for Pinecone compatibility
  const cleanedVectors = vectors.map((v) => {
    const cleanMetadata: Record<string, string | number | boolean | string[]> = {};
    for (const [key, value] of Object.entries(v.metadata)) {
      if (value !== undefined) {
        cleanMetadata[key] = value;
      }
    }
    return {
      id: v.id,
      values: v.values,
      metadata: cleanMetadata,
    };
  });

  await index.namespace(namespace ?? "default").upsert(cleanedVectors);
}

/**
 * Query similar vectors from Pinecone
 */
export async function querySimilar(
  queryVector: number[],
  topK: number = 10,
  namespace?: string,
  filter?: Record<string, unknown>
): Promise<QueryResult[]> {
  const index = getIndex();

  const results = await index.namespace(namespace ?? "default").query({
    vector: queryVector,
    topK,
    includeMetadata: true,
    filter,
  });

  return (results.matches ?? []).map((match) => ({
    id: match.id,
    score: match.score ?? 0,
    metadata: (match.metadata ?? {}) as VectorMetadata,
  }));
}

/**
 * Delete vectors by IDs
 */
export async function deleteVectors(ids: string[], namespace?: string): Promise<void> {
  const index = getIndex();
  await index.namespace(namespace ?? "default").deleteMany(ids);
}

/**
 * Get vector by ID
 */
export async function getVector(id: string, namespace?: string): Promise<CareerVector | null> {
  const index = getIndex();

  const result = await index.namespace(namespace ?? "default").fetch([id]);

  const record = result.records?.[id];
  if (!record) return null;

  return {
    id: record.id,
    values: record.values as number[],
    metadata: (record.metadata ?? {}) as VectorMetadata,
  };
}

export default getPineconeClient;
