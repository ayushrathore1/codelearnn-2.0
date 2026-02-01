/**
 * Script to set up early access users and send them invitation emails
 * 
 * Usage: node scripts/setupEarlyAccessUsers.js
 * 
 * This script will:
 * 1. Create user accounts for the specified emails (if they don't exist)
 * 2. Send early access invitation emails with login links
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });
// Also try loading from production env if exists
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });

const User = require('../models/User');
const { sendEarlyAccessEmail } = require('../services/emailService');

// Early access users to add
const EARLY_ACCESS_USERS = [
  {
    email: 'adityagour0841@gmail.com',
    name: 'Aditya Gour'
  }
];

async function connectDB() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not found in environment variables');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
}

async function setupUser(userData) {
  const { email, name } = userData;
  console.log(`\n📧 Processing: ${email}`);
  
  try {
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      console.log(`   ℹ️  User already exists: ${user.name || 'No name'}`);
    } else {
      // Create new user with a random password (they'll use OTP login)
      // Generate a secure random password since the model requires it
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      
      user = await User.create({
        name: name,
        email: email.toLowerCase(),
        password: randomPassword, // Random password - user will use OTP login
        subscribedNewsletter: true
      });
      console.log(`   ✅ Created new user: ${name}`);
    }
    
    // Send early access email
    console.log(`   📤 Sending early access email...`);
    const emailSent = await sendEarlyAccessEmail(email, name);
    
    if (emailSent) {
      console.log(`   ✅ Early access email sent successfully!`);
    } else {
      console.log(`   ⚠️  Failed to send email (check SMTP configuration)`);
    }
    
    return { success: true, user, emailSent };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║       CodeLearnn Early Access User Setup Script              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  await connectDB();
  
  console.log(`Setting up ${EARLY_ACCESS_USERS.length} early access users...`);
  
  const results = [];
  for (const userData of EARLY_ACCESS_USERS) {
    const result = await setupUser(userData);
    results.push({ ...userData, ...result });
  }
  
  // Summary
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                           SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const emailsSent = results.filter(r => r.emailSent);
  
  console.log(`\n✅ Users set up: ${successful.length}/${results.length}`);
  console.log(`📧 Emails sent: ${emailsSent.length}/${results.length}`);
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed users:`);
    failed.forEach(f => console.log(`   - ${f.email}: ${f.error}`));
  }
  
  console.log('\n✨ Early access users can now login at https://codelearnn.com/login');
  console.log('   using OTP (one-time password) sent to their email.\n');
  
  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB');
}

main().catch(console.error);
