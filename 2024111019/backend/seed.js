/**
 * Comprehensive Seed Script
 * Run: node seed.js
 * Creates admin, 5 organizers, 12 events, 60 participants, ~50 registrations/event
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const QRCode = require('qrcode');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Event = require('./models/Event');
const Ticket = require('./models/Ticket');
const Team = require('./models/Team');

const PASS = 'Pass@123';

const ORGANIZERS = [
  { name: 'E-Cell IIIT-H', email: 'ecell@iiit.ac.in', category: 'Entrepreneurship', description: 'The Entrepreneurship Cell fosters startup culture through workshops, pitch competitions, and networking events.', website: 'https://ecell.iiit.ac.in' },
  { name: 'Ping!', email: 'ping@iiit.ac.in', category: 'Technology', description: 'The Programming & CS Club organizes hackathons, coding contests, and tech talks for passionate developers.', website: 'https://ping.iiit.ac.in' },
  { name: 'Apex Sports Club', email: 'apex@iiit.ac.in', category: 'Sports', description: 'Apex promotes athletic excellence through inter-college tournaments, fitness events, and adventure sports.', website: 'https://apex.iiit.ac.in' },
  { name: 'The Literary Club', email: 'litclub@iiit.ac.in', category: 'Literature', description: 'A haven for wordsmiths — poetry slams, book clubs, creative writing workshops, and debating society.', website: 'https://litclub.iiit.ac.in' },
  { name: 'Dhun Music Society', email: 'dhun@iiit.ac.in', category: 'Music', description: 'From classical ragas to rock anthems, Dhun celebrates music in all its forms through performances and jams.', website: 'https://dhun.iiit.ac.in' }
];

const PARTICIPANTS = [
  'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Singh', 'Vikram Reddy',
  'Neha Kumar', 'Arjun Nair', 'Kavya Iyer', 'Rahul Verma', 'Sneha Joshi',
  'Aditya Kapoor', 'Ishita Mehta', 'Dev Banerjee', 'Meera Rao', 'Karan Malhotra',
  'Tanvi Shah', 'Sahil Agarwal', 'Riya Desai', 'Vivek Menon', 'Pooja Bhat',
  'Ayush Tiwari', 'Diya Pillai', 'Manav Saxena', 'Shruti Naidu', 'Nikhil Sethi',
  'Swati Kulkarni', 'Harsh Mishra', 'Lakshmi Varma', 'Omkar Patil', 'Nisha Roy',
  'Siddharth Yadav', 'Ankita Das', 'Rajat Chandra', 'Priyanka Dutta', 'Kunal Jain',
  'Tanya Ahuja', 'Aryan Srivastava', 'Megha Chowdhury', 'Varun Hegde', 'Simran Kaur',
  'Abhishek Pandey', 'Ritika Bajaj', 'Dhruv Awasthi', 'Kriti Sinha', 'Pranav Gokhale',
  'Nandini Mohan', 'Gaurav Bhatt', 'Sanya Grover', 'Tarun Nath', 'Aditi Rangan',
  'Arham Khan', 'Zara Fernandes', 'Kabir Chopra', 'Mira Sundaram', 'Veer Luthra',
  'Anushka Thakur', 'Reyansh Gill', 'Kiara Khanna', 'Neil Krishnan', 'Trisha Oberoi'
];

const COMMENTS_POOL = [
  'This event looks amazing! Can\'t wait to attend.',
  'Is there a dress code for this?',
  'Will there be certificates provided?',
  'Really excited about this one!',
  'Can we form teams on the spot?',
  'Great initiative by the organizers!',
  'What\'s the venue for this event?',
  'Is lunch included in the registration?',
  'Last year\'s edition was fantastic!',
  'Any prerequisites for attending?',
  'Will the sessions be recorded?',
  'Looking forward to meeting fellow enthusiasts!',
  'Can external students participate?',
  'Is there parking available at the venue?',
  'The speaker lineup looks incredible!',
  'Any discount for group registrations?',
  'This is going to be epic! 🚀',
  'Registered! See you all there.',
  'Will there be networking opportunities?',
  'Perfect timing with the semester schedule.'
];

const d = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};

const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
const pick = (arr, n) => shuffle([...arr]).slice(0, n);

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Check if already seeded
    const existingOrgs = await User.countDocuments({ role: 'organizer' });
    if (existingOrgs >= 5) {
      console.log(`Already seeded (${existingOrgs} organizers found). Use --force to re-seed.`);
      if (!process.argv.includes('--force')) {
        process.exit(0);
      }
      console.log('Force flag detected. Cleaning existing data...');
      await Promise.all([
        User.deleteMany({ role: { $ne: 'admin' } }),
        Event.deleteMany({}),
        Ticket.deleteMany({}),
        Team.deleteMany({})
      ]);
      console.log('Cleaned existing data.');
    }

    const hashedPass = await bcrypt.hash(PASS, 10);

    // ---- Admin ----
    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin', firstName: 'System', lastName: 'Admin',
        email: 'admin@felicity.iiit.ac.in', password: hashedPass,
        role: 'admin', onboardingComplete: true
      });
      console.log('✓ Admin created: admin@felicity.iiit.ac.in');
    } else {
      console.log(`✓ Admin exists: ${admin.email}`);
    }

    // ---- Organizers ----
    console.log('\nCreating organizers...');
    const orgDocs = [];
    for (const org of ORGANIZERS) {
      const o = await User.create({
        ...org, password: hashedPass, role: 'organizer',
        contactEmail: org.email, contactNumber: '+91 ' + Math.floor(7000000000 + Math.random() * 3000000000),
        onboardingComplete: true
      });
      orgDocs.push(o);
      console.log(`  ✓ ${o.name} (${o.email})`);
    }

    // ---- Participants ----
    console.log('\nCreating 60 participants...');
    const partDocs = [];
    for (const name of PARTICIPANTS) {
      const [first, ...rest] = name.split(' ');
      const last = rest.join(' ');
      const email = `${first.toLowerCase()}.${last.toLowerCase().replace(/\s/g, '')}@students.iiit.ac.in`;
      const isIIIT = Math.random() > 0.3;
      const colleges = ['IIIT Hyderabad', 'IIT Delhi', 'BITS Pilani', 'NIT Warangal', 'VIT Vellore', 'IIIT Delhi'];
      const p = await User.create({
        name, firstName: first, lastName: last,
        email, password: hashedPass,
        role: 'participant',
        participantType: isIIIT ? 'IIIT' : 'Non-IIIT',
        collegeName: isIIIT ? 'IIIT Hyderabad' : colleges[Math.floor(Math.random() * colleges.length)],
        contactNumber: '+91 ' + Math.floor(7000000000 + Math.random() * 3000000000),
        interests: pick(['Technology', 'Music', 'Art', 'Sports', 'Gaming', 'Photography', 'Dance', 'Literature', 'Science', 'Business'], 3),
        onboardingComplete: true,
        following: pick(orgDocs.map(o => o._id), Math.floor(Math.random() * 4) + 1)
      });
      partDocs.push(p);
    }
    console.log(`  ✓ ${partDocs.length} participants created`);

    // ---- Events ----
    console.log('\nCreating events...');
    const EVENTS = [
      {
        name: 'Startup Weekend 2026', description: 'A 54-hour event where developers, designers, and business minds come together to pitch ideas, form teams, and launch startups. Mentored by industry leaders and VCs.',
        type: 'Normal', organizer: orgDocs[0]._id, status: 'Published',
        eligibility: 'All', startDate: d(14), endDate: d(16), regDeadline: d(12),
        limit: 80, price: 500, tags: ['startup', 'entrepreneurship', 'pitch', 'networking'],
        formFields: [{ label: 'LinkedIn Profile', fieldType: 'text', required: false, options: [] }, { label: 'Experience Level', fieldType: 'dropdown', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] }]
      },
      {
        name: 'HackIIIT 2026', description: 'The flagship 36-hour hackathon of IIIT Hyderabad. Build innovative solutions across AI, Web3, FinTech, and HealthTech tracks. ₹2L+ in prizes!',
        type: 'Hackathon', organizer: orgDocs[1]._id, status: 'Published',
        eligibility: 'All', startDate: d(21), endDate: d(22), regDeadline: d(18),
        limit: 200, price: 0, tags: ['hackathon', 'coding', 'AI', 'prizes'],
        minTeamSize: 2, maxTeamSize: 4
      },
      {
        name: 'Felicity Merch Store', description: 'Official Felicity 2026 merchandise — hoodies, t-shirts, caps, and stickers. Premium quality, limited stock!',
        type: 'Merchandise', organizer: orgDocs[0]._id, status: 'Published',
        eligibility: 'All', startDate: d(1), endDate: d(30),
        price: 799, stock: 500, purchaseLimitPerUser: 3,
        tags: ['merch', 'felicity', 'hoodie', 'tshirt'],
        variants: [
          { name: 'Hoodie', size: 'M', color: 'Black', stock: 100 },
          { name: 'Hoodie', size: 'L', color: 'Black', stock: 100 },
          { name: 'T-Shirt', size: 'M', color: 'White', stock: 150 },
          { name: 'T-Shirt', size: 'L', color: 'White', stock: 150 }
        ]
      },
      {
        name: 'AI/ML Workshop: From Zero to GPT', description: 'An intensive weekend workshop covering neural networks, transformers, fine-tuning LLMs, and deploying ML models. Hands-on with PyTorch.',
        type: 'Normal', organizer: orgDocs[1]._id, status: 'Published',
        eligibility: 'All', startDate: d(7), endDate: d(8), regDeadline: d(5),
        limit: 60, price: 200, tags: ['AI', 'ML', 'workshop', 'GPT', 'deep-learning'],
        formFields: [{ label: 'Python Proficiency', fieldType: 'dropdown', required: true, options: ['Beginner', 'Intermediate', 'Expert'] }, { label: 'GitHub Username', fieldType: 'text', required: false, options: [] }]
      },
      {
        name: 'Inter-IIIT Sports Meet', description: 'Annual sports extravaganza featuring cricket, football, basketball, badminton, and athletics. Compete against students from IIITs across India.',
        type: 'Normal', organizer: orgDocs[2]._id, status: 'Published',
        eligibility: 'IIIT', startDate: d(28), endDate: d(30), regDeadline: d(25),
        limit: 300, price: 0, tags: ['sports', 'cricket', 'football', 'athletics'],
        formFields: [{ label: 'Sport', fieldType: 'dropdown', required: true, options: ['Cricket', 'Football', 'Basketball', 'Badminton', 'Athletics'] }]
      },
      {
        name: 'Poetry Slam Night', description: 'An evening of spoken word poetry, rap battles, and open mic performances. Express yourself in any language — Hindi, English, Telugu, or beyond!',
        type: 'Normal', organizer: orgDocs[3]._id, status: 'Completed',
        eligibility: 'All', startDate: d(-10), endDate: d(-10), regDeadline: d(-12),
        limit: 50, price: 0, tags: ['poetry', 'spoken-word', 'open-mic', 'literature']
      },
      {
        name: 'Battle of the Bands', description: 'Three stages. Fifteen bands. One champion. The biggest music showdown on campus featuring acoustic, rock, and fusion categories.',
        type: 'Normal', organizer: orgDocs[4]._id, status: 'Published',
        eligibility: 'All', startDate: d(10), endDate: d(10), regDeadline: d(8),
        limit: 100, price: 150, tags: ['music', 'band', 'rock', 'live-performance', 'concert']
      },
      {
        name: 'Full Stack Bootcamp', description: 'A completed 5-day intensive bootcamp covering React, Node.js, PostgreSQL, Docker, and cloud deployment. Taught by alumni from FAANG companies.',
        type: 'Normal', organizer: orgDocs[1]._id, status: 'Completed',
        eligibility: 'All', startDate: d(-20), endDate: d(-15), regDeadline: d(-25),
        limit: 40, price: 300, tags: ['coding', 'fullstack', 'react', 'node', 'bootcamp']
      },
      {
        name: 'Felicity T-Shirts & Stickers', description: 'Limited edition Felicity graphic tees designed by campus artists, plus holographic sticker packs.',
        type: 'Merchandise', organizer: orgDocs[4]._id, status: 'Published',
        eligibility: 'All', startDate: d(1), endDate: d(30),
        price: 449, stock: 300, purchaseLimitPerUser: 5,
        tags: ['merch', 'tshirt', 'stickers', 'limited-edition'],
        variants: [
          { name: 'Graphic Tee', size: 'S', color: 'Navy', stock: 75 },
          { name: 'Graphic Tee', size: 'M', color: 'Navy', stock: 75 },
          { name: 'Graphic Tee', size: 'L', color: 'Navy', stock: 75 },
          { name: 'Sticker Pack', size: 'One Size', color: 'Multi', stock: 75 }
        ]
      },
      {
        name: 'CodeWars: CTF Championship', description: 'Capture The Flag cybersecurity competition. Solve challenges in web exploitation, cryptography, reverse engineering, and forensics.',
        type: 'Hackathon', organizer: orgDocs[1]._id, status: 'Published',
        eligibility: 'All', startDate: d(35), endDate: d(36), regDeadline: d(32),
        limit: 150, price: 0, tags: ['CTF', 'cybersecurity', 'hacking', 'forensics'],
        minTeamSize: 2, maxTeamSize: 3
      },
      {
        name: 'Photography Walk: Old City', description: 'Explore the streets of Hyderabad\'s Old City with your camera. Guided tour covering Charminar, Laad Bazaar, and hidden gems. All skill levels welcome.',
        type: 'Normal', organizer: orgDocs[3]._id, status: 'Published',
        eligibility: 'All', startDate: d(5), endDate: d(5), regDeadline: d(3),
        limit: 30, price: 100, tags: ['photography', 'heritage', 'hyderabad', 'art']
      },
      {
        name: 'E-Summit 2026', description: 'The annual Entrepreneurship Summit featuring keynotes from founders of unicorn startups, investor panels, startup expo, and a pitch competition with ₹5L prize pool.',
        type: 'Normal', organizer: orgDocs[0]._id, status: 'Published',
        eligibility: 'All', startDate: d(45), endDate: d(47), regDeadline: d(40),
        limit: 500, price: 1000, tags: ['summit', 'entrepreneurship', 'investors', 'startup', 'keynote'],
        formFields: [{ label: 'Company/Startup Name', fieldType: 'text', required: false, options: [] }, { label: 'Role', fieldType: 'dropdown', required: true, options: ['Student', 'Founder', 'Investor', 'Professional'] }]
      }
    ];

    const eventDocs = [];
    for (const ev of EVENTS) {
      const event = await Event.create(ev);
      eventDocs.push(event);
      console.log(`  ✓ ${event.name} (${event.type}, ${event.status})`);
    }

    // ---- Registrations (Tickets) ----
    console.log('\nCreating registrations...');
    let totalTickets = 0;

    for (const event of eventDocs) {
      if (event.type === 'Hackathon') continue; // Handle separately
      if (event.type === 'Merchandise') continue; // Handle separately

      const numReg = Math.min(event.limit || 50, 50);
      const selectedParts = pick(partDocs, numReg);

      for (const part of selectedParts) {
        const ticket = await Ticket.create({
          event: event._id,
          user: part._id,
          type: 'Registration',
          formData: {},
          status: 'Confirmed'
        });
        const qrData = JSON.stringify({ ticketId: ticket.ticketId, event: event.name });
        ticket.qrCode = await QRCode.toDataURL(qrData);

        // Mark ~60% as attended for completed events
        if (event.status === 'Completed' && Math.random() < 0.6) {
          ticket.attended = true;
          ticket.attendanceTimestamp = event.startDate;
        }
        await ticket.save();
        totalTickets++;
      }

      event.registrationCount = numReg;
      event.viewCount = Math.floor(Math.random() * 500) + 100;
      if (!event.formLocked) event.formLocked = true;
      await event.save();
    }

    // Hackathon teams
    console.log('\nCreating hackathon teams...');
    for (const event of eventDocs.filter(e => e.type === 'Hackathon')) {
      const teamCount = 15;
      const available = shuffle([...partDocs]);
      let idx = 0;

      for (let t = 0; t < teamCount; t++) {
        const teamSize = Math.floor(Math.random() * (event.maxTeamSize - event.minTeamSize + 1)) + event.minTeamSize;
        if (idx + teamSize > available.length) break;

        const members = available.slice(idx, idx + teamSize);
        idx += teamSize;

        const team = await Team.create({
          name: `Team ${['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi'][t]}`,
          event: event._id,
          leader: members[0]._id,
          members: members.map(m => m._id),
          maxMembers: event.maxTeamSize,
          inviteCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
          status: 'Registered'
        });

        for (const member of members) {
          const ticket = await Ticket.create({
            event: event._id,
            user: member._id,
            type: 'Registration',
            team: team._id,
            status: 'Confirmed'
          });
          const qrData = JSON.stringify({ ticketId: ticket.ticketId, event: event.name, team: team.name });
          ticket.qrCode = await QRCode.toDataURL(qrData);
          await ticket.save();
          totalTickets++;
        }
      }

      event.registrationCount = idx;
      event.viewCount = Math.floor(Math.random() * 800) + 200;
      await event.save();
    }

    // Merch orders
    console.log('Creating merchandise orders...');
    for (const event of eventDocs.filter(e => e.type === 'Merchandise')) {
      const numOrders = 50;
      const selectedParts = pick(partDocs, numOrders);

      for (const part of selectedParts) {
        const variant = event.variants[Math.floor(Math.random() * event.variants.length)];
        const approved = Math.random() < 0.7;
        const ticket = await Ticket.create({
          event: event._id,
          user: part._id,
          type: 'Merchandise',
          formData: { variant: variant.name, size: variant.size, color: variant.color, quantity: 1 },
          status: approved ? 'Confirmed' : 'Pending Approval'
        });
        if (approved) {
          const qrData = JSON.stringify({ ticketId: ticket.ticketId, event: event.name, type: 'Merchandise' });
          ticket.qrCode = await QRCode.toDataURL(qrData);
          await ticket.save();
        }
        totalTickets++;
      }

      event.registrationCount = numOrders;
      event.viewCount = Math.floor(Math.random() * 600) + 150;
      await event.save();
    }

    // ---- Comments ----
    console.log('Adding comments...');
    for (const event of eventDocs) {
      const numComments = Math.floor(Math.random() * 12) + 5;
      const commenters = pick(partDocs, numComments);
      for (let i = 0; i < numComments; i++) {
        event.comments.push({
          user: commenters[i]._id,
          text: COMMENTS_POOL[Math.floor(Math.random() * COMMENTS_POOL.length)],
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        });
      }
      // Pin first comment on some events
      if (event.comments.length > 0 && Math.random() > 0.5) {
        event.pinnedComments = [event.comments[0]._id];
      }
      await event.save();
    }

    // ---- Feedback for completed events ----
    console.log('Adding feedback...');
    for (const event of eventDocs.filter(e => e.status === 'Completed')) {
      const fbGivers = pick(partDocs, 30);
      for (const p of fbGivers) {
        const rating = Math.floor(Math.random() * 3) + 3; // 3-5 stars
        const fbComments = [
          'Excellent event! Learned so much.',
          'Well organized, great speakers.',
          'Good event but could improve time management.',
          'Absolutely loved it! Would attend again.',
          'Decent event, expected more hands-on content.',
          'The best event I\'ve attended this semester!',
          'Great networking opportunities.',
          'Venue was perfect, food was great.',
          'Really inspiring sessions.',
          'Could be longer, felt too short.'
        ];
        event.feedback.push({
          user: p._id,
          rating,
          comment: fbComments[Math.floor(Math.random() * fbComments.length)],
          createdAt: new Date(Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000)
        });
      }
      await event.save();
    }

    console.log(`\n${'═'.repeat(50)}`);
    console.log('  SEED COMPLETE');
    console.log(`${'═'.repeat(50)}`);
    console.log(`  Admin:        admin@felicity.iiit.ac.in`);
    console.log(`  Organizers:   ${orgDocs.length} created`);
    console.log(`  Participants: ${partDocs.length} created`);
    console.log(`  Events:       ${eventDocs.length} created`);
    console.log(`  Tickets:      ${totalTickets} created`);
    console.log(`  Password:     ${PASS} (for all accounts)`);
    console.log(`${'═'.repeat(50)}\n`);

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
})();
