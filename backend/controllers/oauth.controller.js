const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');

// Google OAuth 클라이언트 초기화
const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID || '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com'
    // Client Secret은 ID Token 검증에는 필요없음
);

// JWT 토큰 생성
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'your-secret-key-here',
        { expiresIn: '7d' }
    );
};

// Google 토큰 검증 함수
async function verifyGoogleToken(token) {
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID || '1020058007586-fn33tmrqb2aa3sbe0rc3lt30pnhfa0dn.apps.googleusercontent.com'
        });
        return ticket.getPayload();
    } catch (error) {
        console.error('Google token verification failed:', error);
        return null;
    }
}

// Google OAuth 로그인
exports.googleAuth = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Google 토큰이 필요합니다.'
            });
        }

        // Google ID 토큰 검증 (JWT 디코드)
        const ticket = await verifyGoogleToken(token);
        if (!ticket) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 Google 토큰입니다.'
            });
        }

        const { sub: id, email, name, picture } = ticket;

        // 기존 사용자 확인 또는 새 사용자 생성
        let user = await User.findOne({
            $or: [
                { socialId: id, socialProvider: 'google' },
                { email: email }
            ]
        });

        if (!user) {
            // 새 사용자 생성
            const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + '_' + Date.now().toString(36);
            
            user = await User.create({
                username: username.substring(0, 16), // 최대 16자
                email,
                name: name || email.split('@')[0],
                socialProvider: 'google',
                socialId: id,
                profileImage: picture,
                isEmailVerified: true,
                phone: '0000000000', // 임시 전화번호
                businessType: 'personal', // 기본 비즈니스 타입
                termsAcceptedAt: new Date(),
                marketingConsent: false // 기본값
            });
        } else if (!user.socialProvider) {
            // 이메일로 가입한 사용자가 소셜 로그인 시도
            user.socialProvider = 'google';
            user.socialId = id;
            user.profileImage = picture;
            await user.save();
        }

        // 로그인 정보 업데이트
        user.lastLoginAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // JWT 토큰 생성
        const authToken = generateToken(user._id);

        res.json({
            success: true,
            message: '구글 로그인 성공',
            data: {
                token: authToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profileImage,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Google OAuth Error:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        
        // 더 구체적인 에러 메시지 제공
        let errorMessage = '구글 로그인 중 오류가 발생했습니다.';
        
        if (error.message && error.message.includes('duplicate key')) {
            errorMessage = '이미 가입된 이메일입니다.';
        } else if (error.message && error.message.includes('validation')) {
            errorMessage = '입력 정보가 올바르지 않습니다.';
        } else if (error.message && error.message.includes('network')) {
            errorMessage = '네트워크 오류가 발생했습니다.';
        }
        
        res.status(500).json({
            success: false,
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Kakao OAuth 로그인
exports.kakaoAuth = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Kakao 토큰이 필요합니다.'
            });
        }

        // Kakao 토큰으로 사용자 정보 가져오기
        const kakaoResponse = await axios.get(
            'https://kapi.kakao.com/v2/user/me',
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const { id, kakao_account, properties } = kakaoResponse.data;
        const email = kakao_account?.email || `kakao_${id}@marketgrow.com`;
        const name = properties?.nickname || kakao_account?.profile?.nickname || 'Kakao User';
        const profileImage = properties?.profile_image || kakao_account?.profile?.profile_image_url;

        // 기존 사용자 확인 또는 새 사용자 생성
        let user = await User.findOne({
            $or: [
                { socialId: id.toString(), socialProvider: 'kakao' },
                { email: email }
            ]
        });

        if (!user) {
            // 새 사용자 생성
            const username = 'kakao_' + id.toString();
            
            user = await User.create({
                username: username.substring(0, 16), // 최대 16자
                email,
                name: name || 'Kakao User',
                socialProvider: 'kakao',
                socialId: id.toString(),
                profileImage,
                isEmailVerified: true,
                phone: '0000000000', // 임시 전화번호
                businessType: 'personal', // 기본 비즈니스 타입
                termsAcceptedAt: new Date(),
                marketingConsent: false // 기본값
            });
        } else if (!user.socialProvider) {
            // 이메일로 가입한 사용자가 소셜 로그인 시도
            user.socialProvider = 'kakao';
            user.socialId = id.toString();
            user.profileImage = profileImage;
            await user.save();
        }

        // 로그인 정보 업데이트
        user.lastLoginAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // JWT 토큰 생성
        const authToken = generateToken(user._id);

        res.json({
            success: true,
            message: '카카오 로그인 성공',
            data: {
                token: authToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profileImage,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Kakao OAuth Error:', error);
        res.status(500).json({
            success: false,
            message: '카카오 로그인 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};

// Naver OAuth 로그인
exports.naverAuth = async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Naver 토큰이 필요합니다.'
            });
        }

        // Naver 토큰으로 사용자 정보 가져오기
        const naverResponse = await axios.get(
            'https://openapi.naver.com/v1/nid/me',
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const { response: naverUser } = naverResponse.data;
        const { id, email, name, profile_image } = naverUser;

        // 기존 사용자 확인 또는 새 사용자 생성
        let user = await User.findOne({
            $or: [
                { socialId: id, socialProvider: 'naver' },
                { email: email }
            ]
        });

        if (!user) {
            // 새 사용자 생성
            const username = 'naver_' + id.substring(0, 10);
            
            user = await User.create({
                username: username.substring(0, 16), // 최대 16자
                email: email || `naver_${id}@marketgrow.com`,
                name: name || 'Naver User',
                socialProvider: 'naver',
                socialId: id,
                profileImage: profile_image,
                isEmailVerified: true,
                phone: '0000000000', // 임시 전화번호
                businessType: 'personal', // 기본 비즈니스 타입
                termsAcceptedAt: new Date(),
                marketingConsent: false // 기본값
            });
        } else if (!user.socialProvider) {
            // 이메일로 가입한 사용자가 소셜 로그인 시도
            user.socialProvider = 'naver';
            user.socialId = id;
            user.profileImage = profile_image;
            await user.save();
        }

        // 로그인 정보 업데이트
        user.lastLoginAt = new Date();
        user.loginCount = (user.loginCount || 0) + 1;
        await user.save();

        // JWT 토큰 생성
        const authToken = generateToken(user._id);

        res.json({
            success: true,
            message: '네이버 로그인 성공',
            data: {
                token: authToken,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    name: user.name,
                    profileImage: user.profileImage,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('Naver OAuth Error:', error);
        res.status(500).json({
            success: false,
            message: '네이버 로그인 중 오류가 발생했습니다.',
            error: error.message
        });
    }
};