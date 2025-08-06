const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, '서비스명을 입력해주세요'],
        trim: true,
        maxLength: [100, '서비스명은 100자 이하로 입력해주세요']
    },
    description: {
        type: String,
        required: [true, '서비스 설명을 입력해주세요'],
        trim: true,
        maxLength: [1000, '설명은 1000자 이하로 입력해주세요']
    },
    shortDescription: {
        type: String,
        trim: true,
        maxLength: [200, '간단 설명은 200자 이하로 입력해주세요']
    },
    category: {
        type: String,
        required: [true, '카테고리를 선택해주세요'],
        enum: [
            'followers', 'likes', 'views', 'comments', 'shares',
            'subscribers', 'engagement', 'promotion', 'analytics'
        ]
    },
    platform: {
        type: String,
        required: [true, '플랫폼을 선택해주세요'],
        enum: [
            'instagram', 'youtube', 'tiktok', 'facebook', 
            'twitter', 'linkedin', 'twitch', 'all'
        ]
    },
    type: {
        type: String,
        required: [true, '서비스 타입을 선택해주세요'],
        enum: ['instant', 'gradual', 'premium', 'custom']
    },
    price: {
        type: Number,
        required: [true, '가격을 입력해주세요'],
        min: [0, '가격은 0 이상이어야 합니다']
    },
    originalPrice: {
        type: Number,
        min: [0, '원래 가격은 0 이상이어야 합니다']
    },
    currency: {
        type: String,
        default: 'KRW',
        enum: ['KRW', 'USD', 'EUR', 'JPY']
    },
    unit: {
        type: String,
        required: [true, '단위를 입력해주세요'],
        default: '개'
    },
    minQuantity: {
        type: Number,
        required: [true, '최소 수량을 입력해주세요'],
        min: [1, '최소 수량은 1 이상이어야 합니다'],
        default: 1
    },
    maxQuantity: {
        type: Number,
        required: [true, '최대 수량을 입력해주세요'],
        min: [1, '최대 수량은 1 이상이어야 합니다'],
        default: 100000
    },
    deliveryTime: {
        min: {
            type: Number,
            required: [true, '최소 처리 시간을 입력해주세요'],
            min: [0, '처리 시간은 0 이상이어야 합니다']
        },
        max: {
            type: Number,
            required: [true, '최대 처리 시간을 입력해주세요'],
            min: [0, '처리 시간은 0 이상이어야 합니다']
        },
        unit: {
            type: String,
            enum: ['minutes', 'hours', 'days'],
            default: 'hours'
        }
    },
    features: [{
        type: String,
        trim: true,
        maxLength: [200, '특징은 200자 이하로 입력해주세요']
    }],
    requirements: [{
        type: String,
        trim: true,
        maxLength: [200, '요구사항은 200자 이하로 입력해주세요']
    }],
    restrictions: [{
        type: String,
        trim: true,
        maxLength: [200, '제한사항은 200자 이하로 입력해주세요']
    }],
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
        maxLength: [50, '태그는 50자 이하로 입력해주세요']
    }],
    images: [{
        url: {
            type: String,
            required: true
        },
        alt: {
            type: String,
            trim: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    rating: {
        average: {
            type: Number,
            default: 0,
            min: [0, '평점은 0 이상이어야 합니다'],
            max: [5, '평점은 5 이하여야 합니다']
        },
        count: {
            type: Number,
            default: 0,
            min: [0, '평점 수는 0 이상이어야 합니다']
        }
    },
    orderCount: {
        type: Number,
        default: 0,
        min: [0, '주문 수는 0 이상이어야 합니다']
    },
    successRate: {
        type: Number,
        default: 100,
        min: [0, '성공률은 0 이상이어야 합니다'],
        max: [100, '성공률은 100 이하여야 합니다']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    isPopular: {
        type: Boolean,
        default: false
    },
    isNew: {
        type: Boolean,
        default: false
    },
    discountPercentage: {
        type: Number,
        min: [0, '할인율은 0 이상이어야 합니다'],
        max: [100, '할인율은 100 이하여야 합니다'],
        default: 0
    },
    discountValidUntil: {
        type: Date
    },
    apiSettings: {
        provider: {
            type: String,
            enum: ['internal', 'external', 'manual']
        },
        endpoint: String,
        apiKey: String,
        rateLimits: {
            perMinute: Number,
            perHour: Number,
            perDay: Number
        }
    },
    qualitySettings: {
        dropProtection: {
            type: Boolean,
            default: false
        },
        refillGuarantee: {
            days: {
                type: Number,
                min: [0, '보장 기간은 0 이상이어야 합니다'],
                default: 0
            },
            enabled: {
                type: Boolean,
                default: false
            }
        },
        qualityScore: {
            type: Number,
            min: [1, '품질 점수는 1 이상이어야 합니다'],
            max: [10, '품질 점수는 10 이하여야 합니다'],
            default: 5
        }
    },
    seoSettings: {
        metaTitle: String,
        metaDescription: String,
        keywords: [String],
        slug: {
            type: String,
            unique: true,
            sparse: true
        }
    },
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        clicks: {
            type: Number,
            default: 0
        },
        conversions: {
            type: Number,
            default: 0
        },
        revenue: {
            type: Number,
            default: 0
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lastModifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual fields
serviceSchema.virtual('discountedPrice').get(function() {
    if (this.discountPercentage > 0) {
        return Math.round(this.price * (100 - this.discountPercentage) / 100);
    }
    return this.price;
});

serviceSchema.virtual('isOnSale').get(function() {
    return this.discountPercentage > 0 && 
           (!this.discountValidUntil || this.discountValidUntil > new Date());
});

serviceSchema.virtual('deliveryTimeText').get(function() {
    const { min, max, unit } = this.deliveryTime;
    const unitText = {
        minutes: '분',
        hours: '시간',
        days: '일'
    };
    
    if (min === max) {
        return `${min}${unitText[unit]}`;
    }
    return `${min}-${max}${unitText[unit]}`;
});

serviceSchema.virtual('conversionRate').get(function() {
    if (this.analytics.clicks === 0) return 0;
    return ((this.analytics.conversions / this.analytics.clicks) * 100).toFixed(2);
});

// Indexes
serviceSchema.index({ platform: 1, category: 1 });
serviceSchema.index({ isActive: 1, isFeatured: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ rating: -1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ orderCount: -1 });
serviceSchema.index({ 'seoSettings.slug': 1 }, { unique: true, sparse: true });
serviceSchema.index({ tags: 1 });

// Pre-save middleware
serviceSchema.pre('save', function(next) {
    // SEO 슬러그 자동 생성
    if (this.isModified('name') && !this.seoSettings.slug) {
        this.seoSettings.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9가-힣]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    // 메타 정보 자동 생성
    if (!this.seoSettings.metaTitle) {
        this.seoSettings.metaTitle = this.name;
    }
    
    if (!this.seoSettings.metaDescription) {
        this.seoSettings.metaDescription = this.shortDescription || this.description.substring(0, 160);
    }
    
    // 수량 유효성 검사
    if (this.minQuantity > this.maxQuantity) {
        next(new Error('최소 수량은 최대 수량보다 클 수 없습니다'));
        return;
    }
    
    // 처리 시간 유효성 검사
    if (this.deliveryTime.min > this.deliveryTime.max) {
        next(new Error('최소 처리 시간은 최대 처리 시간보다 클 수 없습니다'));
        return;
    }
    
    next();
});

// Instance methods
serviceSchema.methods.updateRating = async function(newRating) {
    const currentTotal = this.rating.average * this.rating.count;
    this.rating.count += 1;
    this.rating.average = (currentTotal + newRating) / this.rating.count;
    return this.save();
};

serviceSchema.methods.incrementOrderCount = function() {
    this.orderCount += 1;
    return this.save();
};

serviceSchema.methods.updateAnalytics = function(type, value = 1) {
    if (this.analytics[type] !== undefined) {
        this.analytics[type] += value;
    }
    return this.save();
};

serviceSchema.methods.calculateEstimatedCost = function(quantity) {
    const finalPrice = this.isOnSale ? this.discountedPrice : this.price;
    return finalPrice * quantity;
};

serviceSchema.methods.isQuantityValid = function(quantity) {
    return quantity >= this.minQuantity && quantity <= this.maxQuantity;
};

serviceSchema.methods.getEstimatedDelivery = function() {
    const now = new Date();
    const minTime = this.deliveryTime.min;
    const maxTime = this.deliveryTime.max;
    const unit = this.deliveryTime.unit;
    
    let minDate = new Date(now);
    let maxDate = new Date(now);
    
    switch (unit) {
        case 'minutes':
            minDate.setMinutes(minDate.getMinutes() + minTime);
            maxDate.setMinutes(maxDate.getMinutes() + maxTime);
            break;
        case 'hours':
            minDate.setHours(minDate.getHours() + minTime);
            maxDate.setHours(maxDate.getHours() + maxTime);
            break;
        case 'days':
            minDate.setDate(minDate.getDate() + minTime);
            maxDate.setDate(maxDate.getDate() + maxTime);
            break;
    }
    
    return { minDate, maxDate };
};

// Static methods
serviceSchema.statics.findByPlatform = function(platform) {
    return this.find({ platform, isActive: true });
};

serviceSchema.statics.findByCategory = function(category) {
    return this.find({ category, isActive: true });
};

serviceSchema.statics.getFeatured = function(limit = 10) {
    return this.find({ isFeatured: true, isActive: true })
               .sort({ orderCount: -1 })
               .limit(limit);
};

serviceSchema.statics.getPopular = function(limit = 10) {
    return this.find({ isActive: true })
               .sort({ orderCount: -1, rating: -1 })
               .limit(limit);
};

serviceSchema.statics.searchServices = function(query, filters = {}) {
    const searchQuery = { isActive: true };
    
    // 텍스트 검색
    if (query) {
        searchQuery.$or = [
            { name: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
        ];
    }
    
    // 필터 적용
    if (filters.platform) {
        searchQuery.platform = filters.platform;
    }
    
    if (filters.category) {
        searchQuery.category = filters.category;
    }
    
    if (filters.priceMin || filters.priceMax) {
        searchQuery.price = {};
        if (filters.priceMin) searchQuery.price.$gte = filters.priceMin;
        if (filters.priceMax) searchQuery.price.$lte = filters.priceMax;
    }
    
    if (filters.minRating) {
        searchQuery['rating.average'] = { $gte: filters.minRating };
    }
    
    return this.find(searchQuery);
};

serviceSchema.statics.getServiceStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalServices: { $sum: 1 },
                activeServices: {
                    $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
                },
                totalOrders: { $sum: '$orderCount' },
                totalRevenue: { $sum: '$analytics.revenue' },
                averagePrice: { $avg: '$price' },
                averageRating: { $avg: '$rating.average' }
            }
        }
    ]);
    
    return stats[0] || {};
};

module.exports = mongoose.model('Service', serviceSchema);