const { MongoClient } = require('mongodb');

async function upgradeAll() {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://amansjeje432_db_user:CDKvRZc9AWQAn3Uw@nexusai.vbmcp4b.mongodb.net/nexusai?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB.');
    const db = client.db();

    const targets = ['user1', 'user2'];
    
    for (const username of targets) {
      console.log(`\nProcessing target: ${username}`);
      const usernameLower = username.toLowerCase();
      
      const users = await db.collection('users').find({
        $or: [
          { username: username },
          { usernameLower: usernameLower }
        ]
      }).toArray();
      
      console.log(`Found ${users.length} document(s) matching "${username}":`);
      for (const u of users) {
        console.log(`  - ID: ${u.id}, _id: ${u._id}, Plan: ${u.plan || 'none'}`);
      }
      
      const result = await db.collection('users').updateMany(
        {
          $or: [
            { username: username },
            { usernameLower: usernameLower }
          ]
        },
        {
          $set: {
            plan: 'max',
            planUpdatedAt: Date.now()
          }
        }
      );
      
      console.log(`✅ Updated ${result.modifiedCount} document(s) for "${username}" to 'max' plan!`);
    }

    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database operations failed:', error.message);
    process.exit(1);
  }
}

upgradeAll();
