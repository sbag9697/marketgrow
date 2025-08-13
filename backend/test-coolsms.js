const msgModule = require('coolsms-node-sdk').default

// 인증을 위해 발급받은 본인의 API Key를 사용합니다.
const apiKey = 'NCSN4FS4EFQSCSA1'
const apiSecret = '9R9CC9Y0LQEMFMCJHYOFVQAKMUQP4NLP'
const messageService = new msgModule(apiKey, apiSecret);

const params = {
  text: '[MarketGrow] 인증번호는 123456입니다. 3분 이내에 입력해주세요.', // 문자 내용
  to: '01057728658', // 수신번호 (받는이)
  from: '01057728658' // 발신번호 (보내는이) - Railway 환경변수의 COOLSMS_SENDER와 동일해야 함
}

console.log('SMS 발송 시도...');
messageService.sendMany([params])
  .then(result => {
    console.log('✅ SMS 발송 성공!');
    console.log(result);
  })
  .catch(error => {
    console.error('❌ SMS 발송 실패:');
    console.error(error);
  });