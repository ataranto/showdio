var songkick_artists_map = {};

$(document).ready(function() {
    $.getJSON("http://api.songkick.com/api/3.0/events.json?location=clientip&apikey=G2KCF6q91g23Q6Zh&jsoncallback=?", function(response) {
        var template =
            '{{#event}}' +
              '<tr>' +
                '<td>{{ start.date }}</td>' +
                '<td>{{ performance.0.artist.displayName }}</td>' +
                '<td>{{ venue.displayName }}</td>' +
                '<td> Buy Tickets </td>' +
              '</tr>' +
            '{{/event}}';
        var rows = $.mustache(template, response.resultsPage.results);
        $('#tbody').append(rows);

        var events = response.resultsPage.results.event;
        for (var x = 0; x < events.length; x++) {
            for (var y = 0; y < events[x].performance.length; y++) {
                var artist = events[x].performance[y].artist.displayName;
                songkick_artists_map[artist] = true;
            }
        }
    });
});

R.ready(function() {
    R.authenticate(function() {
        R.request({
            method: "getArtistsInCollection",
            content: {
                count: 100,
            },
            success: function(response) {
                for (var x = 0; x < response.result.length; x++) {
                    var artist = response.result[x].name;
                    //alert(artist);
                    if (artist in songkick_artists_map) {
                        alert(artist);
                    }
                }
            },
            error: function(response) {
                alert("error");
            },
        });
    });
});
