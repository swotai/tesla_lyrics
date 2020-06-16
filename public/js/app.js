// Interface logic
window.addEventListener("load", () => {
  const el = $("#app");
  const player = $("#player");

  // Compile Handlebar Templates
  const errorTemplate = Handlebars.compile($("#error-template").html());
  const errorMsgTemplate = Handlebars.compile(
    $("#error-message-template").html()
  );
  const lyricsFormTemplate = Handlebars.compile(
    $("#lyrics-form-template").html()
  );
  const lyricsTemplate = Handlebars.compile($("#lyrics-template").html());
  const loginTemplate = Handlebars.compile($("#login-template").html());

  // Router Declaration
  const router = new Router({
    mode: "history",
    page404: (path) => {
      const html = errorTemplate({
        color: "yellow",
        title: "Error 404 - Page NOT Found!",
        message: `The path '/${path}' does not exist on this site`,
      });
      el.html(html);
    },
  });

  // Instantiate api handler
  const api = axios.create({
    baseURL: `${window.location.protocol}//${window.location.host}`,
    timeout: 12000,
  });

  // menu bar status

  // Display Error Banner
  const showError = (error) => {
    if (error.response == undefined && error.message) {
      const title = "Code error";
      const message = error.message;
      const html = errorMsgTemplate({ title, message });
      player.html(html);
      $(".message .close").on("click", function () {
        $(this).closest(".message").transition("fade");
      });
    } else {
      const { title, message } = error.response.data;
      const html = errorTemplate({ color: "red", title, message });
      player.html(html);
    }
    console.log(error);
  };

  // read song and artist from form (for now) and ask api for lyrics,
  // then update the handlebar template
  const getLyricsResults = async () => {
    // get params from web form
    const song = $("#song").val();
    const artist = $("#artist").val();
    // send post data for lyrics
    try {
      const response = await api.post("/lyrics_svc/lyrics", { song, artist });
      const { name, author, album, lrc } = response.data;
      let html = lyricsTemplate({ name, author, album, lrc });
      player.html(html);
    } catch (error) {
      showError(error);
    } finally {
      $(".loading").removeClass("loading");
      $("#lyrics-1").addClass("rabbit-lyrics");
      document.dispatchEvent(new Event("DOMContentLoaded"));
    }
  };

  // Handle Convert Button Click Event
  const getLyricsHandler = () => {
    console.log("get lyrics clicked");

    if ($(".ui.form").form("is valid")) {
      // hide error message
      $(".ui.error.message").hide();
      // Post to Express server
      $("#lyrics-form").addClass("loading");
      $("#lyrics-header").addClass("loading");
      $("#lyrics-1").addClass("loading");
      getLyricsResults();
      // Prevent page from submitting to server
      return false;
    }
    return true;
  };

  const testAuthStatus = async () => {
    try {
      const response = await api.get("/spotify/auth/status");
      console.log(response);
      console.log(response.status);
      console.log(response.data.isLoggedIn);
    } catch (error) {
      showError(error);
      console.log(error.response.data.title);
    }
  };
  $("#testBtn").click(testAuthStatus);

  router.add("/", () => {
    let html = lyricsFormTemplate();
    el.html(html);
    try {
      // Validate Form Inputs
      $(".ui.form").form({
        fields: {
          song: "empty",
        },
      });
      // Specify Submit Handler
      $("#findLyricsFromForm").click(getLyricsHandler);
    } catch (error) {
      showError(error);
    }
  });

  // spotify login
  const spotifyLogout = async () => {
    try {
      await api.get("/spotify/logout");
    } catch (error) {
      showError(error);
    } finally {
      router.navigateTo("/login");
    }
  };

  router.add("/login", async () => {
    let isSpotifyAuth = false;
    let userName = "";
    let html = loginTemplate({ isSpotifyAuth });
    el.html(html);
    try {
      const response = await api.get("/spotify/auth/status");
      ({isSpotifyAuth, userName} = response.data);
    } catch (error) {
      isSpotifyAuth = false;
    } finally {
      let html = loginTemplate({ isSpotifyAuth, userName });
      el.html(html);
      $("#spotifyLoginBtn").click(() => {
        window.location.href = "/spotify/auth";
      });
      $("#spotifyLogoutBtn").click(spotifyLogout);
      $(".loading").removeClass("loading");
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
