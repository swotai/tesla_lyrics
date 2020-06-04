
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
        spotifySvc.login();
    });

    $("#btn-test").click(function () {
        console.log(params);
        // var testResponse = getUserData(params.access_token);
        // console.log(testResponse);
    });
});