const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '서비스명은 필수입니다'],
        trim: true
    },
    nameEn: {
        type: String,
        required: true,
        trim: true
    },
    platform: {
        type: String,
        required: [true, '플랫폼은 필수입니다'],
        enum: ['instagram', 'youtube', 'facebook', 'tiktok', 'twitter', 'telegram', 'threads', 'website', 'twitch', 'discord', 'spotify', 'whatsapp', 'pinterest', 'reddit', 'snapchat', 'kakaotalk', 'naver'],
        lowercase: true
    },
    category: {
        type: String,
        required: [true, '카테고리는 필수입니다'],
        enum: ['followers', 'likes', 'views', 'comments', 'shares', 'saves', 'subscribers', 'watchtime', 'live', 'keyword', 'auto', 'other']
    },
    description: {
        type: String,
        required: [true, '서비스 설명은 필수입니다']
    },
    features: [{
        type: String
    }],
    pricing: [{
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        discountRate: {
            type: Number,
            default: 0
        }
    }],
    minQuantity: {
        type: Number,
        required: true,
        default: 100
    },
    maxQuantity: {
        type: Number,
        required: true,
        default: 1000000
    },
    deliveryTime: {
        min: {
            type: Number,
            required: true,
            default: 1
        },
        max: {
            type: Number,
            required: true,
            default: 24
        },
        unit: {
            type: String,
            enum: ['minutes', 'hours', 'days'],
            default: 'hours'
        }
    },
    guaranteePeriod: {
        type: Number,
        default: 30 // days
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    requirements: [{
        type: String
    }],
    tags: [{
        type: String,
        lowercase: true
    }],
    totalOrders: {
        type: Number,
        default: 0
    },
    totalRevenue: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    provider: {
        type: String,
        enum: ['internal', 'smmturk', 'custom'],
        default: 'internal'
    },
    providerServiceId: String,
    providerDetails: {
        type: mongoose.Schema.Types.Mixed
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, {
    timestamps: true
});

// Indexes
serviceSchema.index({ platform: 1, category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ tags: 1 });
serviceSchema.index({ name: 'text', description: 'text' });

// Calculate price for quantity
serviceSchema.methods.calculatePrice = function(quantity, userLevel = 'bronze') {
    // Find the appropriate pricing tier
    const sortedPricing = this.pricing.sort((a, b) => a.quantity - b.quantity);
    let applicablePricing = sortedPricing[0];
    
    for (const pricing of sortedPricing) {
        if (quantity >= pricing.quantity) {
            applicablePricing = pricing;
        } else {
            break;
        }
    }
    
    // Calculate base price
    const pricePerUnit = applicablePricing.price / applicablePricing.quantity;
    let totalPrice = pricePerUnit * quantity;
    
    // Apply quantity discount
    if (applicablePricing.discountRate > 0) {
        totalPrice = totalPrice * (1 - applicablePricing.discountRate);
    }
    
    // Apply user level discount
    const userDiscounts = {
        bronze: 0,
        silver: 0.05,
        gold: 0.10,
        platinum: 0.15,
        diamond: 0.20
    };
    
    const userDiscount = userDiscounts[userLevel] || 0;
    totalPrice = totalPrice * (1 - userDiscount);
    
    return Math.round(totalPrice);
};

// Update statistics
serviceSchema.methods.updateStats = async function(order) {
    this.totalOrders += 1;
    this.totalRevenue += order.totalAmount;
    await this.save();
};

module.exports = mongoose.model('Service', serviceSchema);