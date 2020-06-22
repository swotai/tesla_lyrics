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
        `<tr><td class="selectable"><a onclick="selectLyrics(songList, '${element.songid}')">${element.name} - ${element.author}</a></td></tr>`
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
  // brutally remove then rebuild?
  $("#lyrics-1").remove();
  $("#lyrics-container").append("<div id='lyrics-1'></div>");
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
      viewMode: "default",
      alignment: "center",
      height: 380,
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

// Interface logic
window.addEventListener("load", () => {
  const app = $("#app");
  const debug = $("#debug");
  const err = $("#errorMsg");

  // Compile Handlebar Templates
  const errorTemplate = Handlebars.compile($("#error-tmp").html());
  const errorMsgTemplate = Handlebars.compile($("#error-message-tmp").html());
  const lyricsFormTemplate = Handlebars.compile($("#lyrics-form-tmp").html());
  const lyricsTemplate = Handlebars.compile($("#lyrics-tmp").html());
  const loginTemplate = Handlebars.compile($("#login-tmp").html());

  // Router Declaration
  const router = new Router({
    mode: "history",
    page404: (path) => {
      const html = errorTemplate({
        color: "yellow",
        title: "Error 404 - Page NOT Found!",
        message: `The path '/${path}' does not exist on this site`,
      });
      app.html(html);
    },
  });

  // Instantiate api handler
  const api = axios.create({
    baseURL: `${window.location.protocol}//${window.location.host}`,
    timeout: 12000,
  });

  router.add("/login", async () => {
    let isSpotifyAuth = false;
    let userName = "";
    let html = loginTemplate({ isSpotifyAuth });
    app.html(html);
    err.html("");
    try {
      const response = await api.get("/spotify/auth/status");
      ({ isSpotifyAuth, userName } = response.data);
    } catch (error) {
      isSpotifyAuth = false;
    } finally {
      let html = loginTemplate({
        isSpotifyAuth,
        userName,
      });
      app.html(html);
      $("#spotifyLoginBtn").click(() => {
        window.location.href = "/spotify/auth";
      });
      $("#spotifyLogoutBtn").click(() => {
        window.location.href = "/spotify/logout";
      });
      $(".loading").removeClass("loading");
    }
  });

  // main lyrics page

  /**
   * Handler for the Sync Spotify button
   * 1) update audio player with Spotify time
   * 2) get lyrics and update list
   * 3) If there's a match (seem rare) then auto select
   */
  const refreshLyricsFromSpotify = async () => {
    $("#syncSpotifyBtn").addClass("loading");
    try {
      const spotifyPlayer = await api.get("/spotify/player");
      player = spotifyPlayer.data;
      if (player.is_playing) {
        // update audio player and start playing
        let audioPlayer = $("#audio-1")[0];
        audioPlayer.currentTime = player.progress_ms / 1000;
        audioPlayer.play();
        $("#spotifyInfo").html(`${player.name} - ${player.artist}`);
        // get lyrics
        const lyricsResults = await api.get("/lyrics_svc/lyrics", {
          params: { song: player.name, artist: player.artist },
        });
        songList = lyricsResults.data.data;
        var match = lyricsResults.data.match;
        console.log(match);
        // update table
        updateSongTable(songList);
        // if there's match, update lyrics
        if (match) {
          selectLyrics(songList, match);
        }
      } else {
        return false;
      }
    } catch (error) {
      showError(error);
    } finally {
      $(".loading").removeClass("loading");
    }
  };

  router.add("/", async () => {
    let html = lyricsTemplate();
    app.html(html);
    err.html("");
    $("#syncSpotifyBtn").click(refreshLyricsFromSpotify);
  });

  // Auto reload: wait for the player time pass the duration, then trigger refresh
  // a = document.getElementById("audio-1");
  // const b = () => {
  //   let time = document.getElementById("audio-1").currentTime;
  //   console.log(time);
  // };
  // a.addEventListener("timeupdate", b);

  // DEBUGGING
  // read song and artist from form (for now) and ask api for lyrics,
  // then update the handlebar template
  const getLyricsResultsDebug = async () => {
    // get params from web form
    const song = $("#song").val();
    const artist = $("#artist").val();
    err.html("");
    // send post data for lyrics
    try {
      const response = await api.post("/lyrics_svc/lyrics", { song, artist });
      const { name, author, album, lrc } = response.data[0];
      let html = lyricsTemplate({
        name,
        author,
        album,
        lrc,
      });
      app.html(html);
    } catch (error) {
      showError(error);
    } finally {
      $(".loading").removeClass("loading");
      $("#lyrics-1").addClass("rabbit-lyrics");
      document.dispatchEvent(new Event("DOMContentLoaded"));
    }
  };

  // Handle Convert Button Click Event
  const getLyricsHandlerDebug = () => {
    console.log("get lyrics clicked");

    if ($(".ui.form").form("is valid")) {
      // hide error message
      $(".ui.error.message").hide();
      // Post to Express server
      $("#lyrics-form").addClass("loading");
      $("#lyrics-header").addClass("loading");
      $("#lyrics-1").addClass("loading");
      getLyricsResultsDebug();
      // Prevent page from submitting to server
      return false;
    }
    return true;
  };

  router.add("/debug", () => {
    let html = lyricsFormTemplate();
    err.html(html);
    try {
      // Validate Form Inputs
      $(".ui.form").form({
        fields: {
          song: "empty",
        },
      });
      // Specify Submit Handler
      $("#findLyricsFromForm").click(getLyricsHandlerDebug);
    } catch (error) {
      showError(error);
    }
  });

  // Navigate app to current url
  router.navigateTo(window.location.pathname);

  // Highlight Active Menu on Refresh/Page Reload
  const link = $(`a[href$='${window.location.pathname}']`);
  link.addClass("active");

  $("a").on("click", (event) => {
    // Block browser page load
    event.preventDefault();

    // Highlight Active Menu on Click
    const target = $(event.target);
    $(".item").removeClass("active");
    target.addClass("active");

    // Navigate to clicked url
    const href = target.attr("href");
    const path = href.substr(href.lastIndexOf("/"));
    router.navigateTo(path);
  });
});

/**
 * Sync time
b = $('#audio-1');
b[0].currentTime = 5;
b[0].play();
 */

/**
        err = {
        response: { data: { title: "test Title", message: "test message" } },
      };
      showError(err);
  */
