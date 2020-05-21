
/**
 * Obtains parameters from the hash of the URL
 * @return Object
 */
function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while (e = r.exec(q)) {
        hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    history.pushState(null, null, ' ');
    return hashParams;
}




$(function () {
    var stateKey = 'spotify_auth_state';
    // callback to the same page, so extract token fragment
    params = getHashParams();
    if (Object.keys(params).length > 0) {
        document.getElementById('authState').innerHTML = "You are logged in"
        $('#btn-loginSpotify').prop('disabled', true);
    }

    $("#btn-loginSpotify").click(function () {
        console.log("login clicked");
        login();
    });

    $("#btn-test").click(function () {
        console.log(params);
        var testResponse = getUserData(params.access_token);
        console.log(testResponse);
    });
});