/**
 * Seed Scholarships Script for TrustScholar
 * Run once: node seed-scholarships.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Scholarship = require('./models/Scholarship');
const User = require('./models/User');

const scholarships = [
    {
        title: 'National Merit Scholarship',
        description: 'Awarded to students with exceptional academic performance and leadership qualities. This scholarship recognizes outstanding achievement in academics.',
        amount: 50000,
        deadline: new Date('2026-06-30'),
        eligibility: 'Minimum GPA of 3.5, enrolled in undergraduate program',
        requirements: 'Academic transcripts, Letter of recommendation, Personal statement',
        status: 'active'
    },
    {
        title: 'STEM Excellence Award',
        description: 'Supporting students pursuing degrees in Science, Technology, Engineering, and Mathematics fields with demonstrated passion and innovation.',
        amount: 75000,
        deadline: new Date('2026-05-15'),
        eligibility: 'STEM major, minimum GPA 3.0, research experience preferred',
        requirements: 'Research proposal, Faculty recommendation, Academic records',
        status: 'active'
    },
    {
        title: 'Community Leadership Grant',
        description: 'Recognizing students who have made significant contributions to their communities through volunteer work and social initiatives.',
        amount: 30000,
        deadline: new Date('2026-07-31'),
        eligibility: 'Minimum 100 hours community service, good academic standing',
        requirements: 'Community service documentation, Impact statement, References',
        status: 'active'
    },
    {
        title: 'First Generation Scholar Award',
        description: 'Supporting first-generation college students in achieving their educational goals and breaking barriers.',
        amount: 40000,
        deadline: new Date('2026-08-15'),
        eligibility: 'First in family to attend college, demonstrated financial need',
        requirements: 'Family background statement, Financial documents, Essay',
        status: 'active'
    },
    {
        title: 'Women in Technology Scholarship',
        description: 'Empowering women pursuing careers in technology and computer science fields.',
        amount: 60000,
        deadline: new Date('2026-04-30'),
        eligibility: 'Female students in CS/IT programs, minimum GPA 3.2',
        requirements: 'Project portfolio, Career goals essay, Academic transcripts',
        status: 'active'
    },
    {
        title: 'Arts & Humanities Excellence',
        description: 'Supporting creative minds in literature, fine arts, music, and humanities disciplines.',
        amount: 35000,
        deadline: new Date('2026-09-01'),
        eligibility: 'Arts/Humanities major, portfolio submission required',
        requirements: 'Creative portfolio, Artist statement, Faculty recommendation',
        status: 'active'
    },
    {
        title: 'Rural Development Scholarship',
        description: 'Encouraging students from rural areas to pursue higher education and contribute to rural development.',
        amount: 45000,
        deadline: new Date('2026-06-15'),
        eligibility: 'From rural background, commitment to rural development',
        requirements: 'Background verification, Development plan essay, Income certificate',
        status: 'active'
    },
    {
        title: 'Innovation & Entrepreneurship Grant',
        description: 'For students with innovative business ideas and entrepreneurial spirit.',
        amount: 80000,
        deadline: new Date('2026-05-31'),
        eligibility: 'Business/startup idea, any academic background',
        requirements: 'Business plan, Pitch presentation, Mentor recommendation',
        status: 'active'
    }
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        // Find or create admin user
        let admin = await User.findOne({ role: 'admin' });
        
        if (!admin) {
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash('Admin@123', 10);
            admin = await User.create({
                email: 'admin@trustscholar.com',
                password: hashedPassword,
                fullName: 'System Admin',
                role: 'admin',
                isVerified: true
            });
            console.log('✅ Admin user created: admin@trustscholar.com / Admin@123');
        }

        // Clear existing scholarships
        await Scholarship.deleteMany({});
        console.log('🗑️  Cleared existing scholarships');

        // Add createdBy to each scholarship
        const scholarshipsWithAdmin = scholarships.map(s => ({
            ...s,
            createdBy: admin._id
        }));

        // Insert scholarships
        await Scholarship.insertMany(scholarshipsWithAdmin);
        console.log(`✅ Seeded ${scholarships.length} scholarships`);

        console.log('\n========================================');
        console.log('🎉 Database seeded successfully!');
        console.log('========================================');
        console.log('Admin Login: admin@trustscholar.com');
        console.log('Password: Admin@123');
        console.log('========================================\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
};

seedDatabase();
