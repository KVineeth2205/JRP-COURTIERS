class CategoryHelper {
    constructor() {
        this.categoryMap = {
            'lehenga': {
                displayName: 'Designer Lehenga',
                description: 'Traditional Indian lehenga with modern styling',
                keywords: [
                    'lehenga', 'lehnga', 'chaniya', 'choli', 'lengha',
                    'bridal_lehenga', 'wedding_lehenga', 'party_lehenga',
                    'designer_lehenga', 'traditional_lehenga'
                ],
                tags: ['ethnic', 'traditional', 'wedding', 'party'],
                priceRange: { min: 15000, max: 50000 },
                seasonalFit: ['all-season'],
                colorCategory: ['bridal', 'party', 'versatile']
            },
            'kurti': {
                displayName: 'Stylish Kurti',
                description: 'Contemporary kurti perfect for daily wear',
                keywords: [
                    'kurti', 'kurta', 'kurtis', 'kurtas', 'tunic',
                    'straight_kurti', 'a_line_kurti', 'cotton_kurti',
                    'designer_kurti', 'casual_kurti'
                ],
                tags: ['casual', 'ethnic', 'daily-wear', 'comfortable'],
                priceRange: { min: 2000, max: 8000 },
                seasonalFit: ['all-season'],
                colorCategory: ['versatile', 'casual']
            },
            'saree': {
                displayName: 'Elegant Saree',
                description: 'Beautiful traditional saree with modern appeal',
                keywords: [
                    'saree', 'sari', 'sarees', 'saris', 'silk_saree',
                    'cotton_saree', 'designer_saree', 'traditional_saree',
                    'party_saree', 'wedding_saree'
                ],
                tags: ['traditional', 'elegant', 'formal', 'cultural'],
                priceRange: { min: 8000, max: 25000 },
                seasonalFit: ['all-season'],
                colorCategory: ['bridal', 'party', 'versatile']
            },
            'long-frock': {
                displayName: 'Long Dress',
                description: 'Elegant long dress perfect for special occasions',
                keywords: [
                    'long dress', 'long_dress', 'frock', 'anarkali', 'maxi', 
                    'long_frock', 'floor_length', 'anarkali_suit', 'party_frock',
                    'designer_frock', 'evening_dress'
                ],
                tags: ['party', 'formal', 'elegant', 'contemporary'],
                priceRange: { min: 5000, max: 15000 },
                seasonalFit: ['all-season'],
                colorCategory: ['party', 'versatile']
            },
            'gown': {
                displayName: 'Evening Gown',
                description: 'Sophisticated gown for formal events',
                keywords: [
                    'gown', 'evening', 'ball_gown', 'cocktail', 'formal_gown',
                    'party_gown', 'designer_gown', 'western_gown',
                    'wedding_gown', 'reception_gown'
                ],
                tags: ['formal', 'elegant', 'party', 'western'],
                priceRange: { min: 10000, max: 30000 },
                seasonalFit: ['all-season'],
                colorCategory: ['party', 'bridal']
            },
            'dupatta': {
                displayName: 'Designer Dupatta',
                description: 'Beautiful dupatta to complete your ethnic look',
                keywords: [
                    'dupatta', 'scarf', 'stole', 'chunni', 'odhni',
                    'net_dupatta', 'silk_dupatta', 'embroidered_dupatta',
                    'designer_dupatta', 'traditional_dupatta'
                ],
                tags: ['accessories', 'ethnic', 'traditional', 'complement'],
                priceRange: { min: 1500, max: 5000 },
                seasonalFit: ['all-season'],
                colorCategory: ['versatile']
            },
            'jewelry': {
                displayName: 'Fashion Jewelry',
                description: 'Beautiful jewelry to complement your outfit',
                keywords: [
                    'earring', 'necklace', 'bracelet', 'ring', 'jewelry',
                    'jewellery', 'pendant', 'chain', 'bangles', 'anklet',
                    'nose_ring', 'maang_tikka', 'choker', 'fashion_jewelry'
                ],
                tags: ['accessories', 'fashion', 'ethnic', 'modern'],
                priceRange: { min: 1500, max: 8000 },
                seasonalFit: ['all-season'],
                colorCategory: ['versatile']
            },
            'footwear': {
                displayName: 'Ethnic Footwear',
                description: 'Comfortable and stylish ethnic footwear',
                keywords: [
                    'shoe', 'sandal', 'heel', 'footwear', 'juti', 'jutti',
                    'mojari', 'kolhapuri', 'wedges', 'flats', 'boots',
                    'ethnic_shoes', 'traditional_footwear'
                ],
                tags: ['footwear', 'ethnic', 'comfortable', 'traditional'],
                priceRange: { min: 2500, max: 8000 },
                seasonalFit: ['all-season'],
                colorCategory: ['versatile']
            },
            'accessories': {
                displayName: 'Fashion Accessories',
                description: 'Essential accessories for your wardrobe',
                keywords: [
                    'bag', 'clutch', 'purse', 'accessories', 'handbag',
                    'potli', 'sling_bag', 'wallet', 'belt', 'hair_accessories',
                    'fashion_accessories', 'ethnic_accessories'
                ],
                tags: ['accessories', 'fashion', 'utility', 'style'],
                priceRange: { min: 1000, max: 5000 },
                seasonalFit: ['all-season'],
                colorCategory: ['versatile']
            },
            'dress': {
                displayName: 'Designer Dress',
                description: 'Contemporary dress for modern women',
                keywords: [
                    'dress', 'western_dress', 'party_dress', 'casual_dress',
                    'formal_dress', 'designer_dress', 'contemporary_dress'
                ],
                tags: ['western', 'contemporary', 'casual', 'modern'],
                priceRange: { min: 3000, max: 12000 },
                seasonalFit: ['all-season'],
                colorCategory: ['versatile', 'party']
            }
        };
    }

    /**
     * Get all available categories
     */
    getAllCategories() {
        return Object.entries(this.categoryMap).map(([key, data]) => ({
            key,
            displayName: data.displayName,
            description: data.description,
            tags: data.tags,
            priceRange: data.priceRange
        }));
    }

    /**
     * Categorize a product based on filename and metadata
     */
    categorizeProduct(filename, metadata = {}) {
        const searchText = `${filename} ${metadata.name || ''}`.toLowerCase();

        let bestMatch = null;
        let bestScore = 0;

        for (const [category, data] of Object.entries(this.categoryMap)) {
            let matched = 0;
            let strongMatches = 0;

            for (const kw of data.keywords) {
                if (searchText.includes(kw.toLowerCase())) {
                    matched++;
                    if (kw === category || kw.includes(category)) {
                        strongMatches++; // boost for core words
                    }
                }
            }

            if (matched > 0) {
                // Calculate confidence score
                let confidence = Math.min(100, ((matched / data.keywords.length) * 100) + (strongMatches * 20));

                if (confidence > bestScore) {
                    bestScore = confidence;
                    bestMatch = {
                        category,
                        displayName: data.displayName,
                        description: data.description,
                        suggestedPriceRange: data.priceRange,
                        tags: data.tags,
                        confidence,
                        seasonalFit: data.seasonalFit,
                        colorCategory: data.colorCategory,
                        suggestedKeywords: data.keywords
                    };
                }
            }
        }

        if (!bestMatch) {
            return {
                category: 'dress', // default fallback
                displayName: 'Designer Dress',
                description: 'Contemporary fashion piece',
                confidence: 10,
                tags: ['fashion', 'contemporary'],
                seasonalFit: ['all-season'],
                colorCategory: ['versatile'],
                suggestedKeywords: ['dress', 'fashion'],
                needsReview: true
            };
        }

        // If confidence is very high, mark as high confidence
        if (bestMatch.confidence > 80) {
            bestMatch.confidence = Math.min(100, bestMatch.confidence + 10);
        }

        return bestMatch;
    }

    /**
     * Extract colors from text
     */
    extractColorsFromText(text) {
        const colorKeywords = [
            'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange',
            'black', 'white', 'grey', 'gray', 'brown', 'maroon', 'navy',
            'golden', 'silver', 'gold', 'beige', 'cream', 'ivory',
            'magenta', 'cyan', 'lime', 'olive', 'coral', 'salmon'
        ];

        return colorKeywords.filter(color => 
            text.toLowerCase().includes(color.toLowerCase())
        );
    }

    /**
     * Get related categories for a given category
     */
    getRelatedCategories(category) {
        const relations = {
            'lehenga': ['kurti', 'saree', 'dupatta', 'jewelry'],
            'kurti': ['lehenga', 'dupatta', 'jewelry', 'accessories'],
            'saree': ['lehenga', 'jewelry', 'accessories'],
            'long-frock': ['gown', 'dress', 'jewelry'],
            'gown': ['long-frock', 'dress', 'jewelry'],
            'jewelry': ['lehenga', 'kurti', 'saree', 'gown'],
            'footwear': ['lehenga', 'kurti', 'saree', 'gown'],
            'accessories': ['lehenga', 'kurti', 'saree', 'jewelry'],
            'dress': ['gown', 'long-frock', 'jewelry']
        };

        return relations[category] || [];
    }

    /**
     * Generate product suggestions based on category
     */
    generateProductSuggestions(category, count = 5) {
        const categoryData = this.categoryMap[category];
        if (!categoryData) return [];

        const suggestions = [];
        const templates = [
            'Premium {category}',
            'Designer {category}',
            'Elegant {category}',
            'Traditional {category}',
            'Contemporary {category}'
        ];

        for (let i = 0; i < Math.min(count, templates.length); i++) {
            suggestions.push({
                name: templates[i].replace('{category}', categoryData.displayName),
                category: category,
                estimatedPrice: this.generateRandomPrice(categoryData.priceRange),
                tags: categoryData.tags
            });
        }

        return suggestions;
    }

    /**
     * Generate a random price within a range
     */
    generateRandomPrice(priceRange) {
        const { min, max } = priceRange;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

module.exports = CategoryHelper;