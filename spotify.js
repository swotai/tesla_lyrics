
// // pop up
// popup = window.open(
//     url,
//     'Login with Spotify',
//     'width=800,height=600'
// )

// // take token, close popup, get profile
// window.spotifyCallback = (payload) => {
//     popup.close()
//     fetch('https://api.spotify.com/v1/me', {
//         headers: {
//             'Authorization': `Bearer ${payload}`
//         }
//     }).then(response => {
//         return response.json()
//     }).then(data => {
//         // do something with data
//     })
// }

// callback to the same page, so extract token fragment
// token = window.location.hash.substr(1).split('&')[0].split("=")[1]
// if (token) {
//     window.opener.spotifyCallback(token)
// }


function login(callback) {
    var CLIENT_ID = 'f741d638a2f14df2bc756e018c4a469f';
    var REDIRECT_URI = 'http://localhost:8000/';
    function getLoginURL(scopes) {
        return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
            '&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
            '&scope=' + encodeURIComponent(scopes.join(' ')) +
            '&response_type=token';
    }

    var url = getLoginURL([
        'user-read-playback-state',
        'user-read-currently-playing'
    ]);

    var width = 450,
        height = 730,
        left = (screen.width / 2) - (width / 2),
        top = (screen.height / 2) - (height / 2);

    window.addEventListener("message", function (event) {
        var hash = JSON.parse(event.data);
        if (hash.type == 'access_token') {
            callback(hash.access_token);
        }
    }, false);

    var w = window.open(url,
        'Spotify',
        'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
    );
}

function getUserData(accessToken) {
    return $.ajax({
        url: 'https://api.spotify.com/v1/me',
        headers: {
            'Authorization': 'Bearer ' + accessToken
        }
    });
}

$(function () {
    // callback to the same page, so extract token fragment
    token = window.location.hash.substr(1).split('&')[0].split("=")[1];

    $("#btn-test").click(function(){
        console.log("Ok clicked button");
        console.log(token);
    });

});