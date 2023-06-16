import axios from 'axios';
import { getAsync } from '../../common/webWrapper.js';

export async function get() {
    // TODO: 画像の取得先をAPI経由で取得する
    const pictures = [
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20190126_123419782.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20210216_224643803.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20210405_111542600.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20210511_095620547.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220309_165943177.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220626_092402235.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220712_092818.jpg',
        'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220519_040002524.heic'
    ];
    return pictures[Math.floor(Math.random() * pictures.length)];
}
