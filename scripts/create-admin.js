#!/usr/bin/env node

/**
 * 관리자 계정 생성 스크립트
 * 사용법: node scripts/create-admin.js
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createAdmin() {
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
        
        console.log('\n=== 관리자 계정 생성 ===\n');
        
        // 사용자 입력 받기
        const email = await question('관리자 이메일: ');
        const username = await question('관리자 아이디: ');
        const password = await question('비밀번호: ');
        const name = await question('이름: ');
        
        // 기존 사용자 확인
        const existingUser = await usersCollection.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });
        
        if (existingUser) {
            const updateRole = await question('\n이미 존재하는 사용자입니다. 관리자 권한으로 업데이트하시겠습니까? (y/n): ');
            
            if (updateRole.toLowerCase() === 'y') {
                // 기존 사용자를 관리자로 업데이트
                await usersCollection.updateOne(
                    { _id: existingUser._id },
                    { 
                        $set: { 
                            role: 'admin',
                            isAdmin: true,
                            updatedAt: new Date()
                        }
                    }
                );
                console.log('✅ 관리자 권한이 부여되었습니다.');
            } else {
                console.log('❌ 작업이 취소되었습니다.');
            }
        } else {
            // 새 관리자 계정 생성
            const hashedPassword = await bcrypt.hash(password, 10);
            const now = new Date();
            
            const adminUser = {
                email: email.toLowerCase(),
                username: username.toLowerCase(),
                password: hashedPassword,
                name: name || username,
                role: 'admin',
                isAdmin: true,
                membershipLevel: 'vip',
                points: 0,
                depositBalance: 0,
                isActive: true,
                isEmailVerified: true,
                isPhoneVerified: false,
                createdAt: now,
                updatedAt: now
            };
            
            const result = await usersCollection.insertOne(adminUser);
            
            console.log('\n✅ 관리자 계정이 생성되었습니다!');
            console.log('📧 이메일:', email);
            console.log('👤 아이디:', username);
            console.log('🔑 권한: admin');
            console.log('🆔 ID:', result.insertedId);
        }
        
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
    } finally {
        if (client) {
            await client.close();
        }
        rl.close();
    }
}

// 스크립트 실행
createAdmin().catch(console.error);