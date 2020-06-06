/**
 * Lyrics scroller
 * Based on MKOnlinePlayer v2.32
 * from mengkun(http://mkblog.cn)
 */
// core storage
var rem=[];

// refresh lyrics to timestamp
const refreshLyrics = (time) {}


const scrollLyrics = (time) {}


/**
 * Parse lrc w/ timestamp into obj for calling
 * @param {string} lrc 
 */
const parseLyrics = (lrc) {
    if (lrc === '') return '';
    var lyrics = lrc.split("\n");
    var lrcObj = {};
    for (var i = 0; i < lyrics.length; i++) {
        var lyric = decodeURIComponent(lyrics[i]);
        var timeReg = /\[\d*:\d*((\.|\:)\d*)*\]/g;
        var timeRegExpArr = lyric.match(timeReg);
        if (!timeRegExpArr) continue;
        var clause = lyric.replace(timeReg, '');
        for (var k = 0, h = timeRegExpArr.length; k < h; k++) {
            var t = timeRegExpArr[k];
            var min = Number(String(t.match(/\[\d*/i)).slice(1)),
                sec = Number(String(t.match(/\:\d*/i)).slice(1));
            var time = min * 60 + sec;
            lrcObj[time] = clause;
        }
    }
    return lrcObj;
}

