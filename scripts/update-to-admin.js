#!/usr/bin/env node

/**
 * 기존 사용자를 관리자로 업그레이드하는 스크립트
 * 사용법: node scripts/update-to-admin.js <email>
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

async function updateToAdmin(email) {
    if (!email) {
        console.error('사용법: node scripts/update-to-admin.js <email>');
        process.exit(1);
    }
    
    let client;
    
    try {
        // MongoDB 연결
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다.');
        }
        
        console.log('MongoDB 연결 중...');
        client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db(process.env.MONGODB_DB || 'marketgrow');
        const usersCollection = db.collection('users');
        
        // 사용자 찾기
        const user = await usersCollection.findOne({ 
            email: email.toLowerCase() 
        });
        
        if (!user) {
            console.error(`❌ 사용자를 찾을 수 없습니다: ${email}`);
            return;
        }
        
        // 이미 관리자인지 확인
        if (user.role === 'admin') {
            console.log(`ℹ️  이미 관리자입니다: ${email}`);
            return;
        }
        
        // 관리자로 업데이트
        const result = await usersCollection.updateOne(
            { _id: user._id },
            { 
                $set: { 
                    role: 'admin',
                    isAdmin: true,
                    membershipLevel: 'vip',
                    updatedAt: new Date()
                }
            }
        );
        
        if (result.modifiedCount > 0) {
            console.log(`✅ 관리자 권한이 부여되었습니다!`);
            console.log(`📧 이메일: ${email}`);
            console.log(`👤 아이디: ${user.username}`);
            console.log(`🔑 권한: admin`);
        } else {
            console.error('❌ 업데이트에 실패했습니다.');
        }
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// 명령줄 인자에서 이메일 가져오기
const email = process.argv[2];
updateToAdmin(email).catch(console.error);