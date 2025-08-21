const mongoose = require('mongoose');

const tokenStoreSchema = new mongoose.Schema({
    service: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true
    },
    metadata: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// 복합 인덱스
tokenStoreSchema.index({ service: 1, type: 1 }, { unique: true });

// TTL 인덱스 (만료된 토큰 자동 삭제)
tokenStoreSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenStore', tokenStoreSchema);