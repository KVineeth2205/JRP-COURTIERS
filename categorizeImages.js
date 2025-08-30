// Enhanced categorization script with automatic and manual options
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const CategoryHelper = require('./categoryHelper'); // Import the enhanced CategoryHelper

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

class ImageCategorizer {
    constructor() {
        this.categoryHelper = new CategoryHelper();
        this.imagesDir = path.join(__dirname, 'images');
        this.categoriesFile = path.join(__dirname, 'image-categories.json');
        this.backupFile = path.join(__dirname, 'image-categories-backup.json');
        this.statsFile = path.join(__dirname, 'categorization-stats.json');
        
        // Enhanced categories from CategoryHelper
        this.availableCategories = this.categoryHelper.getAllCategories();
    }

    /**
     * Load existing categories from file
     */
    loadExistingCategories() {
        let imageCategories = {};
        if (fs.existsSync(this.categoriesFile)) {
            try {
                imageCategories = JSON.parse(fs.readFileSync(this.categoriesFile, 'utf8'));
                console.log(`📂 Loaded ${Object.keys(imageCategories).length} existing categorizations`);
            } catch (error) {
                console.log('⚠️  Error loading existing categories:', error.message);
            }
        }
        return imageCategories;
    }

    /**
     * Save categories to file with backup
     */
    saveCategories(imageCategories) {
        try {
            // Create backup if file exists
            if (fs.existsSync(this.categoriesFile)) {
                fs.copyFileSync(this.categoriesFile, this.backupFile);
            }
            
            fs.writeFileSync(this.categoriesFile, JSON.stringify(imageCategories, null, 2));
            console.log(`💾 Categories saved to ${this.categoriesFile}`);
            
            // Save statistics
            this.saveStatistics(imageCategories);
        } catch (error) {
            console.log('❌ Error saving categories:', error.message);
        }
    }

    /**
     * Save categorization statistics
     */
    saveStatistics(imageCategories) {
        const stats = {
            totalImages: Object.keys(imageCategories).length,
            categoryCounts: {},
            lastUpdated: new Date().toISOString(),
            confidenceStats: {},
            seasonalDistribution: {},
            colorDistribution: {}
        };

        // Count categories and gather detailed stats
        Object.entries(imageCategories).forEach(([filename, categoryData]) => {
            const category = typeof categoryData === 'string' ? categoryData : categoryData.category;
            
            stats.categoryCounts[category] = (stats.categoryCounts[category] || 0) + 1;
            
            // If we have detailed categorization data
            if (typeof categoryData === 'object') {
                // Confidence statistics
                const confidence = categoryData.confidence || 0;
                if (!stats.confidenceStats[category]) {
                    stats.confidenceStats[category] = { total: 0, count: 0, avg: 0 };
                }
                stats.confidenceStats[category].total += confidence;
                stats.confidenceStats[category].count++;
                stats.confidenceStats[category].avg = 
                    stats.confidenceStats[category].total / stats.confidenceStats[category].count;

                // Seasonal distribution
                if (categoryData.seasonalFit) {
                    categoryData.seasonalFit.forEach(season => {
                        stats.seasonalDistribution[season] = (stats.seasonalDistribution[season] || 0) + 1;
                    });
                }

                // Color distribution
                if (categoryData.colorCategory) {
                    categoryData.colorCategory.forEach(color => {
                        stats.colorDistribution[color] = (stats.colorDistribution[color] || 0) + 1;
                    });
                }
            }
        });

        fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2));
        console.log(`📊 Statistics saved to ${this.statsFile}`);
    }

    /**
     * Get image files from directory
     */
    getImageFiles() {
        if (!fs.existsSync(this.imagesDir)) {
            console.log(`❌ Images directory not found: ${this.imagesDir}`);
            return [];
        }

        const files = fs.readdirSync(this.imagesDir).filter(file =>
            /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
        );

        console.log(`🖼️  Found ${files.length} image files`);
        return files;
    }

    /**
     * Automatically categorize images using CategoryHelper
     */
    async autoCategorizeImages(threshold = 70) {
        console.log('\n🤖 Automatic Image Categorization');
        console.log('==================================');
        
        const files = this.getImageFiles();
        const imageCategories = this.loadExistingCategories();
        let processedCount = 0;
        let skippedCount = 0;
        let lowConfidenceCount = 0;

        for (const file of files) {
            // Skip if already categorized (unless recategorize flag is set)
            if (imageCategories[file] && typeof imageCategories[file] === 'object') {
                console.log(`✅ ${file} already auto-categorized`);
                skippedCount++;
                continue;
            }

            // Extract metadata from filename and existing data
            const metadata = this.extractMetadataFromFilename(file);
            
            // Use CategoryHelper for automatic categorization
            const categorization = this.categoryHelper.categorizeProduct(file, metadata);
            
            if (categorization.confidence >= threshold) {
                imageCategories[file] = {
                    category: categorization.category,
                    displayName: categorization.displayName,
                    confidence: categorization.confidence,
                    tags: categorization.tags,
                    seasonalFit: categorization.seasonalFit,
                    colorCategory: categorization.colorCategory,
                    suggestedKeywords: categorization.suggestedKeywords,
                    autoGenerated: true,
                    timestamp: new Date().toISOString()
                };
                
                console.log(`✅ ${file} → ${categorization.displayName} (${categorization.confidence.toFixed(1)}%)`);
                processedCount++;
            } else {
                console.log(`⚠️  ${file} → Low confidence (${categorization.confidence.toFixed(1)}%) - needs manual review`);
                lowConfidenceCount++;
                
                // Store with flag for manual review
                imageCategories[file] = {
                    ...categorization,
                    needsReview: true,
                    autoGenerated: true,
                    timestamp: new Date().toISOString()
                };
            }
        }

        this.saveCategories(imageCategories);
        
        console.log('\n📈 Auto-categorization Summary:');
        console.log(`✅ Successfully categorized: ${processedCount}`);
        console.log(`⚠️  Low confidence (needs review): ${lowConfidenceCount}`);
        console.log(`⏭️  Already categorized: ${skippedCount}`);
        
        return imageCategories;
    }

    /**
     * Extract metadata from filename patterns
     */
    extractMetadataFromFilename(filename) {
        const metadata = {};
        const name = filename.toLowerCase();
        
        // Extract colors
        const colors = this.categoryHelper.extractColorsFromText(name);
        if (colors.length > 0) metadata.colors = colors;
        
        // Extract price indicators
        const priceMatch = name.match(/(\d+)k?_?(?:price|cost|rs)/);
        if (priceMatch) metadata.estimatedPrice = parseInt(priceMatch[1]) * (name.includes('k') ? 1000 : 1);
        
        // Extract size indicators
        if (name.includes('xl') || name.includes('large')) metadata.size = 'XL';
        else if (name.includes('small') || name.includes('sm')) metadata.size = 'S';
        else if (name.includes('medium') || name.includes('med')) metadata.size = 'M';
        
        // Extract brand indicators
        const brandMatch = name.match(/(designer|premium|luxury|budget|economy)/);
        if (brandMatch) metadata.tier = brandMatch[1];
        
        return metadata;
    }

    /**
     * Manual categorization with enhanced interface
     */
    async manualCategorizeImages(reviewOnly = false) {
        console.log('\n🏷️  Manual Image Categorization');
        console.log('=================================');
        
        const files = this.getImageFiles();
        const imageCategories = this.loadExistingCategories();
        
        // Display available categories
        console.log('Available categories:');
        this.availableCategories.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.displayName} (${cat.key})`);
        });
        console.log('0. Skip this image');
        console.log('r. Auto-suggest and review');
        console.log('s. Show image stats');
        console.log('q. Quit and save\n');

        let processedFiles = reviewOnly ? 
            files.filter(file => imageCategories[file]?.needsReview) : 
            files;

        for (const file of processedFiles) {
            // Skip if already manually categorized (unless reviewOnly mode)
            if (!reviewOnly && imageCategories[file] && !imageCategories[file].needsReview) {
                console.log(`✅ ${file} already categorized`);
                continue;
            }

            console.log(`\n📷 Processing: ${file}`);
            
            // Show existing categorization if available
            if (imageCategories[file]) {
                const existing = imageCategories[file];
                console.log(`   Current: ${existing.displayName || existing.category} (Confidence: ${existing.confidence?.toFixed(1) || 'N/A'}%)`);
                if (existing.tags) console.log(`   Tags: ${existing.tags.join(', ')}`);
            }

            const answer = await this.promptUser('Enter choice: ');
            
            if (answer.toLowerCase() === 'q') break;
            if (answer === '0') {
                console.log('⭐ Skipped');
                continue;
            }
            if (answer.toLowerCase() === 'r') {
                await this.showAutoSuggestion(file, imageCategories);
                continue;
            }
            if (answer.toLowerCase() === 's') {
                this.showImageStats(file, imageCategories);
                continue;
            }

            const categoryIndex = parseInt(answer) - 1;
            if (categoryIndex >= 0 && categoryIndex < this.availableCategories.length) {
                const selectedCategory = this.availableCategories[categoryIndex];
                
                // Get additional details
                const details = await this.getAdditionalDetails(file, selectedCategory);
                
                imageCategories[file] = {
                    category: selectedCategory.key,
                    displayName: selectedCategory.displayName,
                    confidence: 100, // Manual categorization is 100% confident
                    tags: selectedCategory.tags,
                    manuallyReviewed: true,
                    reviewedAt: new Date().toISOString(),
                    ...details
                };

                console.log(`✅ Categorized as: ${selectedCategory.displayName}`);
                
                // Remove review flag if it existed
                delete imageCategories[file].needsReview;
            } else {
                console.log('❌ Invalid choice, skipping');
            }
        }

        this.saveCategories(imageCategories);
        return imageCategories;
    }

    /**
     * Show auto-suggestion for manual review
     */
    async showAutoSuggestion(filename, imageCategories) {
        const metadata = this.extractMetadataFromFilename(filename);
        const suggestion = this.categoryHelper.categorizeProduct(filename, metadata);
        
        console.log(`\n🤖 Auto-suggestion for ${filename}:`);
        console.log(`   Category: ${suggestion.displayName}`);
        console.log(`   Confidence: ${suggestion.confidence.toFixed(1)}%`);
        console.log(`   Tags: ${suggestion.tags.join(', ')}`);
        console.log(`   Seasonal Fit: ${suggestion.seasonalFit.join(', ')}`);
        console.log(`   Color Category: ${suggestion.colorCategory.join(', ')}`);

        const accept = await this.promptUser('Accept this suggestion? (y/n): ');
        if (accept.toLowerCase() === 'y') {
            imageCategories[filename] = {
                ...suggestion,
                manuallyReviewed: true,
                reviewedAt: new Date().toISOString()
            };
            console.log('✅ Auto-suggestion accepted');
        }
    }

    /**
     * Show statistics for an image
     */
    showImageStats(filename, imageCategories) {
        console.log(`\n📊 Stats for ${filename}:`);
        
        const metadata = this.extractMetadataFromFilename(filename);
        console.log(`   Extracted metadata:`, JSON.stringify(metadata, null, 2));
        
        if (imageCategories[filename]) {
            console.log(`   Current categorization:`, JSON.stringify(imageCategories[filename], null, 2));
        }
        
        // Show related categories
        if (imageCategories[filename]?.category) {
            const related = this.categoryHelper.getRelatedCategories(imageCategories[filename].category);
            console.log(`   Related categories: ${related.join(', ')}`);
        }
    }

    /**
     * Get additional details for manual categorization
     */
    async getAdditionalDetails(filename, category) {
        const details = {};
        
        // Ask for price range if not in suggested range
        const priceRange = `${category.priceRange.min}-${category.priceRange.max}`;
        const priceInput = await this.promptUser(`Price range (default: ${priceRange}): `);
        if (priceInput.trim()) {
            const [min, max] = priceInput.split('-').map(p => parseInt(p.trim()));
            if (min && max) details.customPriceRange = { min, max };
        }

        // Ask for special tags
        const tagsInput = await this.promptUser('Additional tags (comma-separated): ');
        if (tagsInput.trim()) {
            details.additionalTags = tagsInput.split(',').map(t => t.trim());
        }

        return details;
    }

    /**
     * Utility function to prompt user
     */
    promptUser(question) {
        return new Promise(resolve => {
            rl.question(question, resolve);
        });
    }

    /**
     * Apply manual categories to database with enhanced features
     */
    async applyCategoriesToDB(connectionString = 'mongodb://localhost:27017/boutiqueDB') {
        const mongoose = require('mongoose');
        
        if (!fs.existsSync(this.categoriesFile)) {
            console.log('❌ No categories file found. Run categorization first.');
            return;
        }

        try {
            const imageCategories = JSON.parse(fs.readFileSync(this.categoriesFile, 'utf8'));
            
            await mongoose.connect(connectionString);
            console.log('🔌 Connected to database');

            const Product = mongoose.model('Product', {
                name: String,
                price: Number,
                image: String,
                description: String,
                category: String,
                categoryData: mongoose.Schema.Types.Mixed,
                inStock: Boolean,
                featured: Boolean,
                tags: [String],
                seasonalFit: [String],
                colorCategory: [String],
                confidence: Number,
                createdAt: Date,
                updatedAt: Date
            });

            console.log('📄 Updating product categories in database...');
            let updatedCount = 0;
            let notFoundCount = 0;

            for (const [filename, categoryData] of Object.entries(imageCategories)) {
                const category = typeof categoryData === 'string' ? categoryData : categoryData.category;
                
                const updateData = {
                    category: category,
                    updatedAt: new Date()
                };

                // Add enhanced data if available
                if (typeof categoryData === 'object') {
                    updateData.categoryData = categoryData;
                    updateData.tags = [...(categoryData.tags || []), ...(categoryData.additionalTags || [])];
                    updateData.seasonalFit = categoryData.seasonalFit;
                    updateData.colorCategory = categoryData.colorCategory;
                    updateData.confidence = categoryData.confidence;
                }

                const result = await Product.updateOne(
                    { image: filename },
                    { $set: updateData }
                );

                if (result.modifiedCount > 0) {
                    console.log(`✅ Updated ${filename} → ${category}`);
                    updatedCount++;
                } else {
                    console.log(`⚠️  No product found with image: ${filename}`);
                    notFoundCount++;
                }
            }

            console.log(`\n📈 Database Update Summary:`);
            console.log(`✅ Updated: ${updatedCount}`);
            console.log(`⚠️  Not found: ${notFoundCount}`);
            
            mongoose.disconnect();
            console.log('🔌 Database connection closed');

        } catch (error) {
            console.log('❌ Database error:', error.message);
            mongoose.disconnect();
        }
    }

    /**
     * Generate categorization report
     */
    generateReport() {
        if (!fs.existsSync(this.categoriesFile)) {
            console.log('❌ No categories file found');
            return;
        }

        const imageCategories = JSON.parse(fs.readFileSync(this.categoriesFile, 'utf8'));
        const report = {
            summary: {
                totalImages: Object.keys(imageCategories).length,
                autoGenerated: 0,
                manuallyReviewed: 0,
                needsReview: 0
            },
            categories: {},
            confidenceDistribution: { low: 0, medium: 0, high: 0 },
            generatedAt: new Date().toISOString()
        };

        Object.entries(imageCategories).forEach(([filename, data]) => {
            const categoryKey = typeof data === 'string' ? data : data.category;
            
            // Update category counts
            if (!report.categories[categoryKey]) {
                report.categories[categoryKey] = { count: 0, avgConfidence: 0, totalConfidence: 0 };
            }
            report.categories[categoryKey].count++;

            if (typeof data === 'object') {
                if (data.autoGenerated) report.summary.autoGenerated++;
                if (data.manuallyReviewed) report.summary.manuallyReviewed++;
                if (data.needsReview) report.summary.needsReview++;

                const confidence = data.confidence || 0;
                report.categories[categoryKey].totalConfidence += confidence;
                
                if (confidence < 50) report.confidenceDistribution.low++;
                else if (confidence < 80) report.confidenceDistribution.medium++;
                else report.confidenceDistribution.high++;
            }
        });

        // Calculate averages
        Object.keys(report.categories).forEach(category => {
            const cat = report.categories[category];
            cat.avgConfidence = cat.totalConfidence / cat.count;
            delete cat.totalConfidence;
        });

        const reportFile = path.join(__dirname, 'categorization-report.json');
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log('\n📊 Categorization Report Generated');
        console.log('===================================');
        console.log(`📁 Total Images: ${report.summary.totalImages}`);
        console.log(`🤖 Auto-generated: ${report.summary.autoGenerated}`);
        console.log(`👤 Manually reviewed: ${report.summary.manuallyReviewed}`);
        console.log(`⚠️  Needs review: ${report.summary.needsReview}`);
        console.log(`📄 Report saved to: ${reportFile}`);
    }

    /**
     * Interactive menu system
     */
    async showMenu() {
        console.log('\n🏪 JRP Boutique - Image Categorization System');
        console.log('==============================================');
        console.log('1. Auto-categorize all images');
        console.log('2. Manual categorization');
        console.log('3. Review low-confidence items');
        console.log('4. Apply categories to database');
        console.log('5. Generate report');
        console.log('6. Show statistics');
        console.log('0. Exit');

        const choice = await this.promptUser('\nSelect option: ');
        
        switch (choice) {
            case '1':
                const threshold = await this.promptUser('Confidence threshold (default 70): ');
                await this.autoCategorizeImages(parseInt(threshold) || 70);
                break;
            case '2':
                await this.manualCategorizeImages(false);
                break;
            case '3':
                await this.manualCategorizeImages(true);
                break;
            case '4':
                const dbUrl = await this.promptUser('Database URL (press enter for default): ');
                await this.applyCategoriesToDB(dbUrl || undefined);
                break;
            case '5':
                this.generateReport();
                break;
            case '6':
                this.showCurrentStats();
                break;
            case '0':
                console.log('👋 Goodbye!');
                rl.close();
                return;
            default:
                console.log('❌ Invalid option');
        }

        // Show menu again
        await this.showMenu();
    }

    /**
     * Show current statistics
     */
    showCurrentStats() {
        if (fs.existsSync(this.statsFile)) {
            const stats = JSON.parse(fs.readFileSync(this.statsFile, 'utf8'));
            console.log('\n📊 Current Statistics:');
            console.log(JSON.stringify(stats, null, 2));
        } else {
            console.log('📊 No statistics available yet');
        }
    }
}

// Export the class and utility functions
module.exports = ImageCategorizer;

// Run if executed directly
if (require.main === module) {
    const categorizer = new ImageCategorizer();
    categorizer.showMenu().catch(console.error);
}