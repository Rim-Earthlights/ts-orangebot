export interface Word {
    morning: string[];
    noon: string[];
    evening: string[];
    night: string[];
    midnight: string[];
}

// おはよう
export const morning = {
    morning: ['おはよ～！今日も元気に頑張ってこ～！'],
    noon: ['おはよ？ねぼすけさんだ！'],
    evening: ['もう夕方だよ！？ねすぎ～！！'],
    night: ['おは……よ……？もう夜だよ……？'],
    midnight: ['すや……すや……って、今起きた……の…？']
};

// こんにちは
export const noon = {
    morning: ['おはよ？まだこんにちはには早そう！'],
    noon: ['こんにちは～！'],
    evening: ['こんにちは！もう夕方だね～！'],
    night: ['こんにちは…？もう夜だよ～！'],
    midnight: ['……もしかして今起きた？']
};

// こんばんは
export const evening = {
    morning: ['こんばんは…？まだ寝てないの！？'],
    noon: ['もしかして寝てない……？身体に良くないよ～！！'],
    evening: ['こんばんは～！もう夕方だね！'],
    night: ['こんばんは！今日も良い一日だった～？'],
    midnight: ['こんばんは……ねむねむ…']
};

// おやすみ
export const sleep = {
    morning: ['え、私起きたところなんだけど…！？'],
    noon: ['お昼寝するの！あんまり寝すぎないようにね～！'],
    evening: ['疲れちゃった？ちゃんと目覚まし合わせた～？'],
    night: ['おやすみなさーい！明日もいっぱい遊ぼうね！'],
    midnight: ['すや……すや……おやすみなさい……']
};
