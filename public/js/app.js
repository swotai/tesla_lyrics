window.addEventListener("load", () => {
  const el = $("#app");

  // Compile Handlebar Templates
  const errorTemplate = Handlebars.compile($("#error-template").html());
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
    baseURL: `${window.location.protocol}//${window.location.host}/api`,
    timeout: 5000,
  });

  // Display Error Banner
  const showError = (error) => {
    const { title, message } = error.response.data;
    const html = errorTemplate({ color: 'red', title, message });
    el.html(html);
  };

  // lyrics page and aux functions
  const getLyricsResults = async () => {
    // get params from web form
    const song = $('#song').val();
    const artist = $('#artist').val();
    // send post data for lyrics
    try {
      const response = await api.post('/lyrics', { song, artist });
      const { name, author, album, lrc } = response.data;
      let html = lyricsTemplate({ name, author, album, lrc });
      el.html(html);
    } catch (error) {
      showError(error)
    } finally {
      $('.loading').removeClass('loading');
    }
  }

  // Handle Convert Button Click Event
  const getLyricsHandler = () => {
    if ($('.ui.form').form('is valid')) {
      // hide error message
      $('.ui.error.message').hide();
      // Post to Express server
      $('#lyrics-page').addClass('loading');
      getLyricsResults();
      // Prevent page from submitting to server
      return false;
    }
    return true;
  };

  router.add("/", () => {
    let html = lyricsTemplate();
    el.html(html);
    try {
      // Validate Form Inputs
      $('.ui.form').form({
        fields: {
          song: 'empty',
        },
      });
      // Specify Submit Handler
      $('.submit').click(getLyricsHandler);
    } catch (error) {
      showError(error)
    }
  });


  // spotify login page

  router.add("/login", () => {
    let html = loginTemplate();
    el.html(html);
  });

//   router.add("/historical", () => {
//     let html = historicalTemplate();
//     el.html(html);
//   });

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
