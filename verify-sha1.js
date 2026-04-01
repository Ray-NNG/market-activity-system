// 复制页面里的 _sha1Bytes 实现，直接跑
function strToBytes(s){
    const b=[];
    for(let i=0;i<s.length;i++){
        const c=s.charCodeAt(i);
        if(c<128)b.push(c);
        else if(c<2048)b.push(192|(c>>6),128|(c&63));
        else b.push(224|(c>>12),128|((c>>6)&63),128|(c&63));
    }
    return b;
}

function _sha1Bytes(bytes) {
    function rotl(n,s){return(n<<s)|(n>>>(32-s));}
    function toHex(n){return('0000000'+(n>>>0).toString(16)).slice(-8);}
    const b=[...bytes];
    const bitLen=b.length*8;
    b.push(0x80);
    while(b.length%64!==56)b.push(0);
    b.push(0,0,0,0,(bitLen>>>24)&255,(bitLen>>>16)&255,(bitLen>>>8)&255,bitLen&255);
    let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;
    for(let i=0;i<b.length;i+=64){
        const w=[];
        for(let j=0;j<16;j++)w[j]=(b[i+j*4]<<24)|(b[i+j*4+1]<<16)|(b[i+j*4+2]<<8)|b[i+j*4+3];
        for(let j=16;j<80;j++)w[j]=rotl(w[j-3]^w[j-8]^w[j-14]^w[j-16],1);
        let a=h0,bb=h1,c=h2,d=h3,e=h4;
        for(let j=0;j<80;j++){
            let f,k;
            if(j<20){f=(bb&c)|((~bb)&d);k=0x5A827999;}
            else if(j<40){f=bb^c^d;k=0x6ED9EBA1;}
            else if(j<60){f=(bb&c)|(bb&d)|(c&d);k=0x8F1BBCDC;}
            else{f=bb^c^d;k=0xCA62C1D6;}
            const tmp=(rotl(a,5)+f+e+k+w[j])>>>0;
            e=d;d=c;c=rotl(bb,30);bb=a;a=tmp;
        }
        h0=(h0+a)>>>0;h1=(h1+bb)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;
    }
    return toHex(h0)+toHex(h1)+toHex(h2)+toHex(h3)+toHex(h4);
}

function _hmacSha1(keyBytes, message) {
    const bs=64;
    let kb=[...keyBytes];
    if(kb.length>bs){
        kb=_sha1Bytes(kb).match(/.{2}/g).map(h=>parseInt(h,16));
    }
    while(kb.length<bs)kb.push(0);
    const opad=kb.map(b=>b^0x5c);
    const ipad=kb.map(b=>b^0x36);
    const msgBytes = strToBytes(message);
    const innerBytes = _sha1Bytes([...ipad, ...msgBytes]).match(/.{2}/g).map(h=>parseInt(h,16));
    return _sha1Bytes([...opad, ...innerBytes]);
}

const secretKey = 'd1B7yayABKGxPfiYBZjmaN4Zpxtc7PPE';
const signTime = '1774591139;1774594739';
const httpString = "head\n/data.json\n\nhost=nnqgcvte2026-1414699807.cos.ap-guangzhou.myqcloud.com\n";

console.log('=== Node.js 签名 ===');
const signKey = _hmacSha1(strToBytes(secretKey), signTime);
console.log('signKey:', signKey);
console.log('JS报告的signKey:', 'debb94cdd55f349166087c74d02b1abeecfe50ca');
console.log('signKey匹配:', signKey === 'debb94cdd55f349166087c74d02b1abeecfe50ca');

const httpHash = _sha1Bytes(strToBytes(httpString));
console.log('httpHash:', httpHash);
console.log('JS报告的httpHash:', 'fa8a5b56d46cc9ee8f50c97ddeac5b03d3b44f89');
console.log('httpHash匹配:', httpHash === 'fa8a5b56d46cc9ee8f50c97ddeac5b03d3b44f89');

// Python 的正确结果
console.log('\nPython的signKey:', 'e007ca0dc8fb0021f96fad841958271fdc0ca022');
console.log('Node signKey == Python signKey:', signKey === 'e007ca0dc8fb0021f96fad841958271fdc0ca022');

// 用 Node 内置 crypto 验证 Python 的结果
const crypto = require('crypto');
const correctSignKey = crypto.createHmac('sha1', secretKey).update(signTime).digest('hex');
const correctHttpHash = crypto.createHash('sha1').update(httpString).digest('hex');
const correctStringToSign = `sha1\n${signTime}\n${correctHttpHash}\n`;
const correctSignature = crypto.createHmac('sha1', Buffer.from(correctSignKey, 'hex')).update(correctStringToSign).digest('hex');

console.log('\n=== Node crypto 内置（正确结果）===');
console.log('signKey:', correctSignKey);
console.log('httpHash:', correctHttpHash);
console.log('signature:', correctSignature);
