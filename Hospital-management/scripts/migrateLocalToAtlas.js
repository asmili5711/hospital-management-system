const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const DEFAULT_SOURCE_URI = 'mongodb://127.0.0.1:27017/hospital';

const sourceUri = process.env.SOURCE_MONGODB_URI || process.env.MONGODB_URI || DEFAULT_SOURCE_URI;
const targetUri = process.env.TARGET_MONGODB_URI || process.env.ATLAS_MONGODB_URI;

const shouldSkipCollection = (name = '') =>
  !name || name.startsWith('system.');

const createConnection = async (uri, role) => {
  if (!uri || String(uri).trim() === '') {
    throw new Error(`${role} MongoDB URI is missing`);
  }

  const connection = mongoose.createConnection(uri, {
    serverSelectionTimeoutMS: 30000
  });

  await connection.asPromise();
  return connection;
};

const clearTargetCollection = async (collection) => {
  await collection.deleteMany({});
};

const syncIndexes = async (sourceCollection, targetCollection) => {
  const sourceIndexes = await sourceCollection.indexes();
  const targetIndexes = await targetCollection.indexes();

  for (const index of targetIndexes) {
    if (index.name === '_id_') continue;
    try {
      await targetCollection.dropIndex(index.name);
    } catch (error) {
      if (error && error.codeName !== 'IndexNotFound') {
        throw error;
      }
    }
  }

  for (const index of sourceIndexes) {
    if (index.name === '_id_') continue;

    const { key, name, v, ns, background, ...options } = index;
    await targetCollection.createIndex(key, options);
  }
};

const copyCollectionData = async (sourceCollection, targetCollection) => {
  await clearTargetCollection(targetCollection);

  const cursor = sourceCollection.find({});
  const batch = [];
  let inserted = 0;
  const BATCH_SIZE = 500;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    batch.push(doc);

    if (batch.length >= BATCH_SIZE) {
      await targetCollection.insertMany(batch, { ordered: false });
      inserted += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length > 0) {
    await targetCollection.insertMany(batch, { ordered: false });
    inserted += batch.length;
  }

  return inserted;
};

const run = async () => {
  if (!targetUri) {
    throw new Error(
      'Missing target URI. Set TARGET_MONGODB_URI (or ATLAS_MONGODB_URI) to your Atlas connection string.'
    );
  }

  let sourceConnection;
  let targetConnection;

  try {
    sourceConnection = await createConnection(sourceUri, 'Source');
    targetConnection = await createConnection(targetUri, 'Target');

    const sourceDb = sourceConnection.db;
    const targetDb = targetConnection.db;

    const sourceDbName = sourceDb.databaseName;
    const targetDbName = targetDb.databaseName;
    console.log(`Connected. Source DB: ${sourceDbName} | Target DB: ${targetDbName}`);

    const collections = await sourceDb.listCollections().toArray();
    const collectionNames = collections
      .map((entry) => entry.name)
      .filter((name) => !shouldSkipCollection(name));

    if (collectionNames.length === 0) {
      console.log('No collections found in source database. Nothing to migrate.');
      return;
    }

    for (const name of collectionNames) {
      const sourceCollection = sourceDb.collection(name);
      const targetCollection = targetDb.collection(name);

      const sourceCount = await sourceCollection.countDocuments();
      const inserted = await copyCollectionData(sourceCollection, targetCollection);
      await syncIndexes(sourceCollection, targetCollection);
      const targetCount = await targetCollection.countDocuments();

      const status = sourceCount === targetCount ? 'OK' : 'MISMATCH';
      console.log(
        `[${status}] ${name}: source=${sourceCount}, inserted=${inserted}, target=${targetCount}`
      );
    }

    console.log('Migration completed.');
  } finally {
    if (sourceConnection) await sourceConnection.close();
    if (targetConnection) await targetConnection.close();
  }
};

run().catch((error) => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
});
