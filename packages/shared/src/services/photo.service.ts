export async function cat() {
  // TODO: 画像の取得先をAPI経由で取得する
  const pictures = [
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20190126_123419782.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20210216_224643803.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20210405_111542600.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20210511_095620547.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220309_165943177.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220626_092402235.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/20220712_092818.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/PXL_20250314_145546639.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/PXL_20250528_004203044.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/PXL_20250704_185106039.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/PXL_20250706_005825685.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/PXL_20241112_010753437.jpg',
    'https://s3-ap-northeast-1.amazonaws.com/rim.public-upload/pic/cat/PXL_20240823_052208976.jpg',
  ];
  return pictures[Math.floor(Math.random() * pictures.length)];
}
