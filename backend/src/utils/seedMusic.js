require('dotenv').config();
const mongoose = require('mongoose');
const Music = require('../models/Music');

const calmingMusic = [
  {
    title: 'Piano Sonata No. 14 in C# Minor "Moonlight" Op. 27 No. 2 - I. Adagio sostenuto',
    artist: 'Ludwig van Beethoven',
    category: 'calming',
    cloudinaryPublicId: 'Piano_Sonata_no._14_in_C_m_Moonlight_Op._27_no._2_-_I._Adagio_sostenuto_vzfshd',
    cloudinaryUrl: 'https://res.cloudinary.com/aurorab/video/upload/v1763271154/Piano_Sonata_no._14_in_C_m_Moonlight_Op._27_no._2_-_I._Adagio_sostenuto_vzfshd.mp3',
    duration: 342 // 5:42 in seconds
  },
  {
    title: 'Clair de Lune',
    artist: 'Claude Debussy',
    category: 'calming',
    cloudinaryPublicId: 'clair_de_lune_sample',
    cloudinaryUrl: 'https://res.cloudinary.com/aurorab/video/upload/v1763271154/clair_de_lune_sample.mp3',
    duration: 300
  },
  {
    title: 'Gymnopédie No. 1',
    artist: 'Erik Satie',
    category: 'calming',
    cloudinaryPublicId: 'gymnopedie_no_1_sample',
    cloudinaryUrl: 'https://res.cloudinary.com/aurorab/video/upload/v1763271154/gymnopedie_no_1_sample.mp3',
    duration: 180
  }
];

const focusMusic = [
  {
    title: 'Deep Focus',
    artist: 'Ambient Collective',
    category: 'focus',
    cloudinaryPublicId: 'deep_focus_sample',
    cloudinaryUrl: 'https://res.cloudinary.com/aurorab/video/upload/v1763271154/deep_focus_sample.mp3',
    duration: 240
  }
];

const sleepMusic = [
  {
    title: 'Peaceful Dreams',
    artist: 'Sleep Sounds',
    category: 'sleep',
    cloudinaryPublicId: 'peaceful_dreams_sample',
    cloudinaryUrl: 'https://res.cloudinary.com/aurorab/video/upload/v1763271154/peaceful_dreams_sample.mp3',
    duration: 600
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing music (optional - remove if you want to keep existing data)
    await Music.deleteMany({});
    console.log('Cleared existing music data');

    // Insert music
    const allMusic = [...calmingMusic, ...focusMusic, ...sleepMusic];
    await Music.insertMany(allMusic);
    console.log(`Successfully inserted ${allMusic.length} music tracks`);

    // Display summary
    const categories = await Music.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    console.log('\nMusic by category:');
    categories.forEach(cat => {
      console.log(`- ${cat._id}: ${cat.count} tracks`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();