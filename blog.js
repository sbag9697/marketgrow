// 블로그 관리 시스템
class BlogManager {
    constructor() {
        this.posts = {
            'instagram-algorithm-guide': {
                title: '인스타그램 알고리즘 완전 정복 가이드',
                category: 'Instagram 전략',
                date: '2024.01.15',
                author: '마케팅 전문가 김민수',
                views: 1234,
                likes: 89,
                comments: 23,
                content: `
                    <h1>인스타그램 알고리즘 완전 정복 가이드</h1>
                    <div class="post-meta-full">
                        <span><i class="fas fa-user"></i> 마케팅 전문가 김민수</span>
                        <span><i class="fas fa-calendar"></i> 2024.01.15</span>
                        <span><i class="fas fa-eye"></i> 1,234 조회</span>
                    </div>
                    
                    <p>인스타그램의 알고리즘은 지속적으로 변화하고 있으며, 2024년에도 몇 가지 중요한 업데이트가 있었습니다. 이 가이드에서는 최신 알고리즘의 핵심 요소들과 이를 활용한 효과적인 마케팅 전략을 상세히 알아보겠습니다.</p>
                    
                    <h2>1. 인스타그램 알고리즘의 핵심 요소</h2>
                    
                    <h3>관계성 (Relationship)</h3>
                    <p>인스타그램은 사용자가 자주 상호작용하는 계정의 콘텐츠를 우선적으로 보여줍니다. 이는 다음과 같은 요소들로 측정됩니다:</p>
                    <ul>
                        <li>댓글과 좋아요 교환 빈도</li>
                        <li>DM 대화 빈도</li>
                        <li>프로필 방문 횟수</li>
                        <li>스토리 상호작용</li>
                    </ul>
                    
                    <h3>관심사 (Interest)</h3>
                    <p>사용자의 과거 행동을 바탕으로 관심사를 파악하고 관련 콘텐츠를 추천합니다:</p>
                    <ul>
                        <li>좋아요를 누른 게시물 유형</li>
                        <li>저장한 콘텐츠 종류</li>
                        <li>시청 시간이 긴 영상 장르</li>
                        <li>팔로우하는 계정들의 특성</li>
                    </ul>
                    
                    <h3>시의성 (Timeliness)</h3>
                    <p>최신 콘텐츠일수록 높은 우선순위를 가집니다. 특히 다음 요소들이 중요합니다:</p>
                    <ul>
                        <li>게시 시간</li>
                        <li>초기 반응 속도</li>
                        <li>트렌딩 해시태그 활용</li>
                    </ul>
                    
                    <h2>2. 알고리즘 최적화 전략</h2>
                    
                    <h3>콘텐츠 품질 향상</h3>
                    <blockquote>
                        "양보다는 질! 하나의 뛰어난 콘텐츠가 열 개의 평범한 콘텐츠보다 낫습니다."
                    </blockquote>
                    
                    <p>다음 기준에 맞춰 콘텐츠를 제작하세요:</p>
                    <ul>
                        <li>고해상도 이미지/영상 사용</li>
                        <li>브랜드 일관성 유지</li>
                        <li>스토리텔링 요소 포함</li>
                        <li>실용적 정보 제공</li>
                    </ul>
                    
                    <h3>최적 포스팅 시간 찾기</h3>
                    <p>인사이트를 활용해 팔로워들의 활동 시간대를 파악하고, 해당 시간에 게시하세요. 일반적으로 다음 시간대가 효과적입니다:</p>
                    <ul>
                        <li>평일: 오전 11시, 오후 2시, 오후 5시</li>
                        <li>주말: 오전 10시, 오후 1시, 오후 4시</li>
                    </ul>
                    
                    <h3>해시태그 전략</h3>
                    <p>효과적인 해시태그 사용법:</p>
                    <ol>
                        <li>브랜드 관련 해시태그 (30%)</li>
                        <li>틈새 커뮤니티 해시태그 (40%)</li>
                        <li>트렌딩 해시태그 (20%)</li>
                        <li>위치 기반 해시태그 (10%)</li>
                    </ol>
                    
                    <h2>3. 참여도 높이는 방법</h2>
                    
                    <p>알고리즘이 선호하는 높은 참여도를 얻기 위한 실전 팁들:</p>
                    
                    <h3>질문과 투표 활용</h3>
                    <ul>
                        <li>캡션에 질문 포함하기</li>
                        <li>스토리 투표 기능 사용</li>
                        <li>댓글로 의견 묻기</li>
                        <li>사용자 생성 콘텐츠 유도</li>
                    </ul>
                    
                    <h3>일관된 브랜딩</h3>
                    <ul>
                        <li>통일된 색상 팔레트</li>
                        <li>일관된 톤앤매너</li>
                        <li>정기적인 포스팅 스케줄</li>
                        <li>브랜드 스토리 연결</li>
                    </ul>
                    
                    <h2>4. 측정과 개선</h2>
                    
                    <p>성과를 측정하고 지속적으로 개선하기 위한 지표들:</p>
                    
                    <h3>핵심 지표</h3>
                    <ul>
                        <li>도달률 (Reach)</li>
                        <li>노출수 (Impressions)</li>
                        <li>참여율 (Engagement Rate)</li>
                        <li>저장률 (Save Rate)</li>
                        <li>공유율 (Share Rate)</li>
                    </ul>
                    
                    <h3>분석 도구 활용</h3>
                    <p>인스타그램 인사이트와 서드파티 도구를 활용해 다음을 분석하세요:</p>
                    <ul>
                        <li>최고 성과 콘텐츠 유형</li>
                        <li>팔로워 활동 패턴</li>
                        <li>해시태그 성과</li>
                        <li>경쟁사 분석</li>
                    </ul>
                    
                    <blockquote>
                        "성공은 하루아침에 오지 않습니다. 꾸준한 분석과 개선을 통해 점진적으로 성과를 높여나가세요."
                    </blockquote>
                    
                    <h2>결론</h2>
                    <p>인스타그램 알고리즘을 이해하고 활용하는 것은 성공적인 SNS 마케팅의 핵심입니다. 이 가이드의 전략들을 실제로 적용해보고, 지속적으로 측정하며 개선해나가시기 바랍니다.</p>
                `
            },
            'youtube-shorts-strategy': {
                title: '유튜브 쇼츠로 구독자 10배 늘리는 방법',
                category: 'YouTube 전략',
                date: '2024.01.12',
                author: '유튜브 크리에이터 박영희',
                views: 2567,
                likes: 156,
                comments: 45,
                content: `
                    <h1>유튜브 쇼츠로 구독자 10배 늘리는 방법</h1>
                    <div class="post-meta-full">
                        <span><i class="fas fa-user"></i> 유튜브 크리에이터 박영희</span>
                        <span><i class="fas fa-calendar"></i> 2024.01.12</span>
                        <span><i class="fas fa-eye"></i> 2,567 조회</span>
                    </div>
                    
                    <p>유튜브 쇼츠는 60초 이하의 세로형 짧은 영상으로, 2020년 출시 이후 폭발적인 성장을 보이고 있습니다. 이 가이드에서는 쇼츠를 활용해 구독자를 빠르게 늘리는 검증된 전략들을 공유하겠습니다.</p>
                    
                    <h2>1. 유튜브 쇼츠의 장점</h2>
                    
                    <h3>높은 노출 기회</h3>
                    <ul>
                        <li>별도의 쇼츠 피드 존재</li>
                        <li>알고리즘의 우선 노출</li>
                        <li>모바일 최적화</li>
                        <li>빠른 바이럴 가능성</li>
                    </ul>
                    
                    <h3>낮은 진입 장벽</h3>
                    <ul>
                        <li>간단한 제작 도구</li>
                        <li>짧은 제작 시간</li>
                        <li>적은 비용</li>
                        <li>창의적 자유도</li>
                    </ul>
                    
                    <h2>2. 성공하는 쇼츠 콘텐츠 유형</h2>
                    
                    <h3>튜토리얼 & 팁</h3>
                    <blockquote>
                        "60초 안에 유용한 정보를 전달하는 콘텐츠는 항상 인기가 높습니다."
                    </blockquote>
                    <ul>
                        <li>요리 레시피</li>
                        <li>메이크업 팁</li>
                        <li>생활 꿀팁</li>
                        <li>기술 사용법</li>
                    </ul>
                    
                    <h3>엔터테인먼트</h3>
                    <ul>
                        <li>챌린지 참여</li>
                        <li>유머 콘텐츠</li>
                        <li>댄스 영상</li>
                        <li>패러디</li>
                    </ul>
                    
                    <h3>비하인드 스토리</h3>
                    <ul>
                        <li>제작 과정</li>
                        <li>일상 공유</li>
                        <li>실패담</li>
                        <li>성공 스토리</li>
                    </ul>
                    
                    <h2>3. 쇼츠 최적화 전략</h2>
                    
                    <h3>첫 3초가 승부</h3>
                    <p>쇼츠의 성공은 첫 3초에 달려있습니다:</p>
                    <ul>
                        <li>강력한 훅 사용</li>
                        <li>궁금증 유발</li>
                        <li>임팩트 있는 시작</li>
                        <li>명확한 메시지</li>
                    </ul>
                    
                    <h3>세로형 비율 활용</h3>
                    <ul>
                        <li>9:16 비율 준수</li>
                        <li>전체 화면 활용</li>
                        <li>텍스트 오버레이</li>
                        <li>브랜딩 요소 포함</li>
                    </ul>
                    
                    <h3>효과적인 제목과 썸네일</h3>
                    <ol>
                        <li>호기심 유발하는 제목</li>
                        <li>키워드 포함</li>
                        <li>명확한 썸네일</li>
                        <li>일관된 브랜딩</li>
                    </ol>
                    
                    <h2>4. 업로드 최적화</h2>
                    
                    <h3>최적 업로드 시간</h3>
                    <p>쇼츠의 최적 업로드 시간대:</p>
                    <ul>
                        <li>평일: 오후 6-8시</li>
                        <li>주말: 오후 2-4시</li>
                        <li>타겟 오디언스 활동 시간 고려</li>
                        <li>지속적인 테스트 필요</li>
                    </ul>
                    
                    <h3>해시태그 전략</h3>
                    <ul>
                        <li>#Shorts 필수 포함</li>
                        <li>관련 키워드 3-5개</li>
                        <li>트렌딩 태그 활용</li>
                        <li>브랜드 태그 포함</li>
                    </ul>
                    
                    <h2>5. 성과 측정과 개선</h2>
                    
                    <h3>핵심 지표</h3>
                    <ul>
                        <li>조회수</li>
                        <li>평균 시청 시간</li>
                        <li>좋아요/싫어요 비율</li>
                        <li>댓글 참여도</li>
                        <li>구독자 전환율</li>
                    </ul>
                    
                    <h3>A/B 테스트</h3>
                    <p>지속적인 개선을 위해 다음 요소들을 테스트하세요:</p>
                    <ul>
                        <li>다양한 콘텐츠 유형</li>
                        <li>업로드 시간대</li>
                        <li>제목과 썸네일</li>
                        <li>영상 길이</li>
                    </ul>
                    
                    <blockquote>
                        "성공하는 쇼츠의 비밀은 지속적인 실험과 개선에 있습니다."
                    </blockquote>
                    
                    <h2>결론</h2>
                    <p>유튜브 쇼츠는 채널 성장을 위한 강력한 도구입니다. 이 전략들을 차근차근 적용하고 꾸준히 실행한다면, 분명 구독자 증가를 경험하게 될 것입니다.</p>
                `
            },
            'tiktok-viral-content': {
                title: '틱톡 바이럴 콘텐츠의 5가지 황금 법칙',
                category: 'TikTok 트렌드',
                date: '2024.01.10',
                author: '틱톡 인플루언서 이지원',
                views: 3421,
                likes: 234,
                comments: 67,
                content: `
                    <h1>틱톡 바이럴 콘텐츠의 5가지 황금 법칙</h1>
                    <div class="post-meta-full">
                        <span><i class="fas fa-user"></i> 틱톡 인플루언서 이지원</span>
                        <span><i class="fas fa-calendar"></i> 2024.01.10</span>
                        <span><i class="fas fa-eye"></i> 3,421 조회</span>
                    </div>
                    
                    <p>틱톡에서 바이럴을 만들어내는 것은 예술이자 과학입니다. 수많은 성공 사례를 분석한 결과, 바이럴 콘텐츠에는 공통적인 패턴이 있음을 발견했습니다. 이 5가지 황금 법칙을 마스터하면 여러분도 바이럴 콘텐츠를 만들 수 있습니다.</p>
                    
                    <h2>법칙 1: 첫 3초에 모든 것을 걸어라</h2>
                    
                    <p>틱톡 사용자들의 평균 집중 시간은 3초입니다. 이 짧은 시간 안에 시청자의 관심을 사로잡지 못하면 스크롤이 넘어갑니다.</p>
                    
                    <h3>효과적인 훅 만들기</h3>
                    <ul>
                        <li><strong>질문으로 시작하기:</strong> "이거 아세요?"</li>
                        <li><strong>충격적인 팩트:</strong> "믿을 수 없지만 사실입니다"</li>
                        <li><strong>반전 예고:</strong> "끝까지 보세요"</li>
                        <li><strong>시각적 임팩트:</strong> 화려한 색상, 움직임</li>
                    </ul>
                    
                    <blockquote>
                        "바이럴 콘텐츠의 90%는 첫 3초에서 결정됩니다."
                    </blockquote>
                    
                    <h2>법칙 2: 트렌드를 빠르게 캐치하고 나만의 스타일로 변형하라</h2>
                    
                    <h3>트렌드 파악 방법</h3>
                    <ul>
                        <li>For You 페이지 모니터링</li>
                        <li>해시태그 트렌드 확인</li>
                        <li>사운드 트렌드 분석</li>
                        <li>챌린지 참여</li>
                    </ul>
                    
                    <h3>나만의 스타일 더하기</h3>
                    <p>단순히 따라하지 말고 자신만의 창의적 요소를 추가하세요:</p>
                    <ul>
                        <li>업계별 특색 반영</li>
                        <li>개인적 경험 추가</li>
                        <li>유머 요소 가미</li>
                        <li>예상치 못한 결말</li>
                    </ul>
                    
                    <h2>법칙 3: 감정을 자극하라</h2>
                    
                    <p>바이럴 콘텐츠는 강한 감정 반응을 유발합니다. 다음 감정들이 특히 효과적입니다:</p>
                    
                    <h3>긍정적 감정</h3>
                    <ul>
                        <li><strong>웃음:</strong> 유머, 실수, 귀여움</li>
                        <li><strong>감동:</strong> 스토리, 성취, 변화</li>
                        <li><strong>놀라움:</strong> 반전, 신기함, 재능</li>
                        <li><strong>동경:</strong> 라이프스타일, 성공, 꿈</li>
                    </ul>
                    
                    <h3>부정적 감정 (주의깊게 활용)</h3>
                    <ul>
                        <li><strong>분노:</strong> 사회 이슈, 불공정</li>
                        <li><strong>걱정:</strong> 문제 제기, 경고</li>
                        <li><strong>슬픔:</strong> 공감, 위로</li>
                    </ul>
                    
                    <h2>법칙 4: 참여를 유도하라</h2>
                    
                    <h3>댓글 유도 기법</h3>
                    <ul>
                        <li>열린 질문하기</li>
                        <li>의견 나누기</li>
                        <li>경험 공유 요청</li>
                        <li>논쟁적 주제 (적절히)</li>
                    </ul>
                    
                    <h3>쉐어링 유도</h3>
                    <ul>
                        <li>유용한 정보 제공</li>
                        <li>공감대 형성</li>
                        <li>친구 태그 유도</li>
                        <li>도전 과제 제시</li>
                    </ul>
                    
                    <h3>듀엣/스티치 유도</h3>
                    <ul>
                        <li>반응 영상 가능한 콘텐츠</li>
                        <li>튜토리얼 형태</li>
                        <li>논쟁적 의견</li>
                        <li>미완성 콘텐츠</li>
                    </ul>
                    
                    <h2>법칙 5: 타이밍이 생명이다</h2>
                    
                    <h3>최적 업로드 시간</h3>
                    <p>타겟 오디언스의 활동 패턴을 파악하고 맞춰서 업로드하세요:</p>
                    
                    <h4>일반적인 최적 시간대</h4>
                    <ul>
                        <li><strong>평일:</strong> 오후 6-10시</li>
                        <li><strong>화요일-목요일:</strong> 가장 활발</li>
                        <li><strong>주말:</strong> 오후 9-11시</li>
                        <li><strong>특별한 날:</strong> 이벤트, 기념일 활용</li>
                    </ul>
                    
                    <h3>트렌드 타이밍</h3>
                    <ul>
                        <li>트렌드 초기 진입</li>
                        <li>이슈 실시간 대응</li>
                        <li>시즌별 콘텐츠</li>
                        <li>계획적 콘텐츠 스케줄링</li>
                    </ul>
                    
                    <h2>보너스 팁: 바이럴 이후 대응 전략</h2>
                    
                    <p>바이럴이 되었다고 끝이 아닙니다. 이 기회를 최대한 활용하세요:</p>
                    
                    <h3>팔로워 유지 전략</h3>
                    <ul>
                        <li>연관 콘텐츠 빠른 업로드</li>
                        <li>댓글 적극 응답</li>
                        <li>라이브 스트리밍</li>
                        <li>크로스 플랫폼 확장</li>
                    </ul>
                    
                    <h3>수익화 방안</h3>
                    <ul>
                        <li>브랜드 협업 기회</li>
                        <li>제품/서비스 홍보</li>
                        <li>다른 플랫폼 유입</li>
                        <li>커뮤니티 구축</li>
                    </ul>
                    
                    <blockquote>
                        "바이럴은 시작일 뿐입니다. 진짜 성공은 지속가능한 성장에 있습니다."
                    </blockquote>
                    
                    <h2>실전 체크리스트</h2>
                    
                    <p>바이럴 콘텐츠 제작 전 다음 항목들을 확인하세요:</p>
                    
                    <ol>
                        <li>첫 3초 훅이 강력한가?</li>
                        <li>현재 트렌드와 연결되어 있는가?</li>
                        <li>감정적 반응을 유발하는가?</li>
                        <li>참여를 유도하는 요소가 있는가?</li>
                        <li>적절한 시간에 업로드하는가?</li>
                        <li>음질과 화질이 좋은가?</li>
                        <li>자막이나 캡션이 명확한가?</li>
                        <li>해시태그가 적절한가?</li>
                    </ol>
                    
                    <h2>결론</h2>
                    <p>바이럴 콘텐츠 제작은 운이 아닌 전략입니다. 이 5가지 황금 법칙을 꾸준히 적용하고 개선해나간다면, 여러분도 틱톡에서 성공할 수 있습니다. 기억하세요: 실패는 학습의 기회이고, 지속적인 시도가 성공의 열쇠입니다.</p>
                `
            }
        };

        this.init();
    }

    init() {
        // 필터링 이벤트
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterPosts(e.target.dataset.category);

                // 활성 탭 업데이트
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // 뉴스레터 폼 이벤트
        const newsletterForm = document.querySelector('.newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.subscribeNewsletter(e.target.querySelector('input[type="email"]').value);
            });
        }

        // 태그 클릭 이벤트
        document.querySelectorAll('.tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const tagText = e.target.textContent;
                this.searchByTag(tagText);
            });
        });

        // 인기 포스트 클릭 이벤트
        document.querySelectorAll('.popular-post').forEach(post => {
            post.addEventListener('click', (e) => {
                const postTitle = e.currentTarget.querySelector('h4').textContent;
                this.searchByTitle(postTitle);
            });
        });
    }

    // 포스트 필터링
    filterPosts(category) {
        const postCards = document.querySelectorAll('.post-card');

        postCards.forEach(card => {
            const cardCategories = card.dataset.category.split(' ');

            if (category === 'all' || cardCategories.includes(category)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });

        // 애니메이션 효과
        this.animateVisiblePosts();
    }

    // 포스트 애니메이션
    animateVisiblePosts() {
        setTimeout(() => {
            const visibleCards = document.querySelectorAll('.post-card:not(.hidden)');
            visibleCards.forEach((card, index) => {
                card.style.animation = `fadeInUp 0.6s ease ${index * 0.1}s`;
            });
        }, 100);
    }

    // 포스트 열기
    openPost(postId) {
        const post = this.posts[postId];
        if (!post) {
            alert('포스트를 찾을 수 없습니다.');
            return;
        }

        const modal = document.getElementById('postModal');
        const content = document.getElementById('postContent');

        content.innerHTML = `
            <div class="post-full-content">
                ${post.content}
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <h3>이 글이 도움이 되었나요?</h3>
                    <div style="display: flex; gap: 10px; margin-top: 15px;">
                        <button onclick="blogManager.likePost('${postId}')" style="background: #48bb78; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-thumbs-up"></i> 도움됨
                        </button>
                        <button onclick="blogManager.sharePost('${postId}')" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-share"></i> 공유하기
                        </button>
                    </div>
                </div>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                    <h4>관련 글</h4>
                    <div style="display: grid; gap: 10px; margin-top: 15px;">
                        ${this.getRelatedPosts(postId)}
                    </div>
                </div>
            </div>
        `;

        modal.style.display = 'block';

        // 조회수 증가
        this.increaseViews(postId);
    }

    // 포스트 닫기
    closePost() {
        document.getElementById('postModal').style.display = 'none';
    }

    // 조회수 증가
    increaseViews(postId) {
        if (this.posts[postId]) {
            this.posts[postId].views++;

            // UI 업데이트 (실제 서비스에서는 서버 통신)
            const viewElements = document.querySelectorAll(`[data-post-id="${postId}"] .post-stats span:first-child`);
            viewElements.forEach(el => {
                el.innerHTML = `<i class="fas fa-eye"></i> ${this.posts[postId].views.toLocaleString()}`;
            });
        }
    }

    // 포스트 좋아요
    likePost(postId) {
        if (this.posts[postId]) {
            this.posts[postId].likes++;
            alert('좋아요를 눌렀습니다!');

            // UI 업데이트
            const likeElements = document.querySelectorAll(`[data-post-id="${postId}"] .post-stats span:nth-child(2)`);
            likeElements.forEach(el => {
                el.innerHTML = `<i class="fas fa-heart"></i> ${this.posts[postId].likes.toLocaleString()}`;
            });
        }
    }

    // 포스트 공유
    sharePost(postId) {
        const post = this.posts[postId];
        if (!post) return;

        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.title,
                url: `${window.location.href}#${postId}`
            });
        } else {
            // 클립보드 복사
            const url = `${window.location.href}#${postId}`;
            navigator.clipboard.writeText(url).then(() => {
                alert('링크가 클립보드에 복사되었습니다!');
            });
        }
    }

    // 관련 포스트 가져오기
    getRelatedPosts(currentPostId) {
        const currentPost = this.posts[currentPostId];
        const related = Object.entries(this.posts)
            .filter(([id, post]) => id !== currentPostId)
            .slice(0, 3)
            .map(([id, post]) => `
                <a href="#" onclick="blogManager.openPost('${id}')" style="text-decoration: none; color: #667eea; padding: 8px; border-radius: 5px; border: 1px solid #e2e8f0; display: block;">
                    ${post.title}
                </a>
            `);

        return related.join('');
    }

    // 뉴스레터 구독
    subscribeNewsletter(email) {
        if (!email) {
            alert('이메일을 입력해주세요.');
            return;
        }

        // 이메일 유효성 검사
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('올바른 이메일 주소를 입력해주세요.');
            return;
        }

        // 구독 처리 (실제 서비스에서는 서버 통신)
        const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');

        if (subscribers.includes(email)) {
            alert('이미 구독중인 이메일입니다.');
            return;
        }

        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));

        alert('뉴스레터 구독이 완료되었습니다!');
        document.querySelector('.newsletter-form input').value = '';
    }

    // 태그로 검색
    searchByTag(tag) {
        // 간단한 검색 구현
        const posts = document.querySelectorAll('.post-card');
        let found = false;

        posts.forEach(post => {
            const content = post.textContent.toLowerCase();
            if (content.includes(tag.toLowerCase())) {
                post.style.border = '2px solid #667eea';
                found = true;
            } else {
                post.style.border = '1px solid #e2e8f0';
            }
        });

        if (found) {
            document.querySelector('.posts-grid').scrollIntoView({ behavior: 'smooth' });
        }

        // 3초 후 하이라이트 제거
        setTimeout(() => {
            posts.forEach(post => {
                post.style.border = '1px solid #e2e8f0';
            });
        }, 3000);
    }

    // 제목으로 검색
    searchByTitle(title) {
        const posts = document.querySelectorAll('.post-card');

        posts.forEach(post => {
            const postTitle = post.querySelector('h2').textContent;
            if (postTitle.includes(title)) {
                post.scrollIntoView({ behavior: 'smooth', block: 'center' });
                post.style.transform = 'scale(1.02)';
                post.style.boxShadow = '0 20px 50px rgba(102, 126, 234, 0.3)';

                setTimeout(() => {
                    post.style.transform = 'scale(1)';
                    post.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                }, 2000);
            }
        });
    }
}

// 전역 함수들
function openPost(postId) {
    blogManager.openPost(postId);
}

function closePost() {
    blogManager.closePost();
}

// 블로그 매니저 인스턴스 생성
const blogManager = new BlogManager();

// 페이지 로드시 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 모달 외부 클릭시 닫기
    window.onclick = function (event) {
        const modal = document.getElementById('postModal');
        if (event.target === modal) {
            closePost();
        }
    };

    // URL 해시로 특정 포스트 열기
    if (window.location.hash) {
        const postId = window.location.hash.substring(1);
        if (blogManager.posts[postId]) {
            blogManager.openPost(postId);
        }
    }
});
