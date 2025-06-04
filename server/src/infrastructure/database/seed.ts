import sql from './connection';

// Default categories to seed
const defaultCategories = [
  // Income categories
  { name: 'Salary', type: 'income', color: '#4CAF50' },
  { name: 'Freelance', type: 'income', color: '#8BC34A' },
  { name: 'Investment', type: 'income', color: '#CDDC39' },
  { name: 'Gift', type: 'income', color: '#FFEB3B' },
  { name: 'Other Income', type: 'income', color: '#FFC107' },
  
  // Expense categories
  { name: 'Groceries', type: 'expense', color: '#FF9800' },
  { name: 'Rent', type: 'expense', color: '#FF5722' },
  { name: 'Utilities', type: 'expense', color: '#795548' },
  { name: 'Transportation', type: 'expense', color: '#607D8B' },
  { name: 'Entertainment', type: 'expense', color: '#9C27B0' },
  { name: 'Healthcare', type: 'expense', color: '#E91E63' },
  { name: 'Shopping', type: 'expense', color: '#F44336' },
  { name: 'Restaurant', type: 'expense', color: '#FF5722' },
  { name: 'Education', type: 'expense', color: '#3F51B5' },
  { name: 'Insurance', type: 'expense', color: '#2196F3' },
  { name: 'Subscription', type: 'expense', color: '#03A9F4' },
  { name: 'Other Expense', type: 'expense', color: '#00BCD4' },
];

// Default payment methods to seed
const defaultPaymentMethods = [
  { name: 'Cash', type: 'cash' },
  { name: 'Bank Transfer', type: 'bank' },
  { name: 'Debit Card', type: 'bank' },
  { name: 'Credit Card', type: 'credit_card' },
  { name: 'PIX', type: 'bank' },
  { name: 'Check', type: 'bank' },
];

// Check if categories exist
const checkCategoriesExist = async (): Promise<boolean> => {
  const result = await sql`SELECT COUNT(*) as count FROM categories`;
  return result[0].count > 0;
};

// Check if payment methods exist
const checkPaymentMethodsExist = async (): Promise<boolean> => {
  const result = await sql`SELECT COUNT(*) as count FROM payment_methods`;
  return result[0].count > 0;
};

// Seed categories
const seedCategories = async (): Promise<void> => {
  console.log('🌱 Seeding categories...');
  
  for (const category of defaultCategories) {
    try {
      await sql`
        INSERT INTO categories (name, type, color) 
        VALUES (${category.name}, ${category.type}, ${category.color})
        ON CONFLICT (LOWER(name)) WHERE is_active = true DO NOTHING
      `;
      console.log(`  ✅ Category: ${category.name} (${category.type})`);
    } catch (error) {
      console.error(`  ❌ Failed to seed category ${category.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${defaultCategories.length} categories\n`);
};

// Seed payment methods
const seedPaymentMethods = async (): Promise<void> => {
  console.log('🌱 Seeding payment methods...');
  
  for (const method of defaultPaymentMethods) {
    try {
      await sql`
        INSERT INTO payment_methods (name, type) 
        VALUES (${method.name}, ${method.type})
        ON CONFLICT (LOWER(name)) WHERE is_active = true DO NOTHING
      `;
      console.log(`  ✅ Payment Method: ${method.name} (${method.type})`);
    } catch (error) {
      console.error(`  ❌ Failed to seed payment method ${method.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${defaultPaymentMethods.length} payment methods\n`);
};

// Create sample savings buckets (optional)
const seedSampleBuckets = async (): Promise<void> => {
  console.log('🌱 Seeding sample savings buckets...');
  
  const sampleBuckets = [
    { name: 'Emergency Fund', target_amount: 10000.00, description: 'Emergency savings for unexpected expenses' },
    { name: 'Vacation Fund', target_amount: 5000.00, description: 'Saving for next vacation' },
    { name: 'Car Fund', target_amount: 25000.00, description: 'Saving for a new car' },
  ];
  
  for (const bucket of sampleBuckets) {
    try {
      await sql`
        INSERT INTO savings_buckets (name, target_amount, description) 
        VALUES (${bucket.name}, ${bucket.target_amount}, ${bucket.description})
        ON CONFLICT (LOWER(name)) WHERE is_active = true DO NOTHING
      `;
      console.log(`  ✅ Bucket: ${bucket.name} (Target: $${bucket.target_amount})`);
    } catch (error) {
      console.error(`  ❌ Failed to seed bucket ${bucket.name}:`, error);
    }
  }
  
  console.log(`✅ Seeded ${sampleBuckets.length} sample buckets\n`);
};

// Main seeding function
const seedDatabase = async (): Promise<void> => {
  console.log('🚀 Starting database seeding...\n');
  
  try {
    // Check if data already exists
    const categoriesExist = await checkCategoriesExist();
    const paymentMethodsExist = await checkPaymentMethodsExist();
    
    if (categoriesExist && paymentMethodsExist) {
      console.log('⚠️  Database already contains seed data');
      console.log('To force re-seeding, add --force flag or clear the tables manually\n');
    }
    
    // Seed categories if needed
    if (!categoriesExist || process.argv.includes('--force')) {
      await seedCategories();
    } else {
      console.log('⏭️  Skipping categories (already exist)\n');
    }
    
    // Seed payment methods if needed
    if (!paymentMethodsExist || process.argv.includes('--force')) {
      await seedPaymentMethods();
    } else {
      console.log('⏭️  Skipping payment methods (already exist)\n');
    }
    
    // Seed sample buckets if requested
    if (process.argv.includes('--buckets') || process.argv.includes('--all')) {
      await seedSampleBuckets();
    }
    
    console.log('✨ Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Show seeding status
const showSeedStatus = async (): Promise<void> => {
  try {
    const categoriesCount = await sql`SELECT COUNT(*) as count FROM categories WHERE is_active = true`;
    const paymentMethodsCount = await sql`SELECT COUNT(*) as count FROM payment_methods WHERE is_active = true`;
    const bucketsCount = await sql`SELECT COUNT(*) as count FROM savings_buckets WHERE is_active = true`;
    
    console.log('📊 Database Seed Status:\n');
    console.log(`Categories: ${categoriesCount[0].count}`);
    console.log(`Payment Methods: ${paymentMethodsCount[0].count}`);
    console.log(`Savings Buckets: ${bucketsCount[0].count}`);
    
    if (categoriesCount[0].count > 0) {
      console.log('\n📂 Categories:');
      const categories = await sql`
        SELECT name, type FROM categories 
        WHERE is_active = true 
        ORDER BY type, name
      `;
      categories.forEach(cat => {
        console.log(`  ${cat.type === 'income' ? '💰' : '💸'} ${cat.name} (${cat.type})`);
      });
    }
    
    if (paymentMethodsCount[0].count > 0) {
      console.log('\n💳 Payment Methods:');
      const methods = await sql`
        SELECT name, type FROM payment_methods 
        WHERE is_active = true 
        ORDER BY type, name
      `;
      methods.forEach(method => {
        const icon = method.type === 'cash' ? '💵' : method.type === 'bank' ? '🏦' : '💳';
        console.log(`  ${icon} ${method.name} (${method.type})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking seed status:', error);
    process.exit(1);
  }
};

// CLI interface
const main = async (): Promise<void> => {
  const command = process.argv[2];
  
  switch (command) {
    case 'run':
    case undefined:
      await seedDatabase();
      break;
    case 'status':
      await showSeedStatus();
      break;
    case 'force':
      process.argv.push('--force');
      await seedDatabase();
      break;
    default:
      console.log('Usage: bun run seed [run|status|force]');
      console.log('Options:');
      console.log('  --force     Re-seed even if data exists');
      console.log('  --buckets   Include sample savings buckets');
      console.log('  --all       Include all optional seed data');
      process.exit(1);
  }
  
  process.exit(0);
};

// Run if called directly
if (import.meta.main) {
  main();
}

export { seedDatabase, showSeedStatus }; 