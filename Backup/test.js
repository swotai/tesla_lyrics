/**
 * Updates table based on inList
 * @param {object} inList
 */
const updateSongTable = (inList) => {
  let tbl = $("#songTable > tbody");
  // clear table
  tbl.html("");
  if (songList == undefined) {
    console.log("There's no songList, try to update");
    return null;
  } else {
    songList.forEach((element) => {
      tbl.append(
        `<tr><td class="selectable"><a onclick="selectLyrics(songList, '${element.songid}')">${element.name}-${element.author}</a></td></tr>`
      );
    });
  }
};

/**
 * Return selected lrc based on songid
 * @param {object} inList
 * @param {string} songid
 */
const filterLyrics = (inList, songid) => {
  try {
    let selected = inList.filter((item) => {
      return item.songid == songid.toString();
    });
    return selected[0];
  } catch (error) {
    return null;
  }
};

/**
 * update player section
 * @param {string} lrc
 */
const updatePlayer = (lrc) => {
  // update the lyrics display with right lyrics
  $("#lyrics-1").html(lrc);
  // trigger rabbit lyrics
  if ($("#lyrics-1").hasClass("rabbit-lyrics--enabled")) {
    rabbit.parseLyrics();
    rabbit.synchronize();
  } else {
    rabbit = new RabbitLyrics.default({
      element: $("#lyrics-1")[0],
      mediaElement: $("#audio-1")[0],
      viewMode: "mini",
      alignment: "center"
    });
  }
};

/**
 * Wrapper for the two steps
 * @param {object} inList
 * @param {string} songid
 */
const selectLyrics = (inList, songid) => {
  let song = filterLyrics(inList, songid);
  updatePlayer(song.lrc);
};

// TESTING CODES
const getSongFromJson = () => {
  var json = null;
  $.ajax({
    async: false,
    global: false,
    url: "./sample.json",
    dataType: "json",
    success: (data) => {
      json = data;
    },
  });
  return json;
};

const updateSongList = () => {
  songList = getSongFromJson().data;
};

const test = () => {
  updateSongList();
  var a = filterLyrics(songList, "27591608");
  updatePlayer(a.lrc);
  updateSongTable(songList);
};

window.addEventListener("load", () => {
  test();
});
