window.addEventListener("load", () => {});

/**
 * Updates sidebar based on inList
 * @param {object} inList 
 */
const updateChooser = (inList) => {
    return null;
};

/**
 * Return selected lrc based on songid
 * @param {object} inList
 * @param {string} songid
 */
const selectLyrics = (inList, songid) => {
  try {
    let selected = inList.filter((item) => {
      return item.songid == songid;
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
  new RabbitLyrics.default({
    element: $("#lyrics-1")[0],
    mediaElement: $("#audio-1")[0],
  });
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
  var a = selectLyrics(songList,299981);
  updatePlayer(a.lrc);
};
