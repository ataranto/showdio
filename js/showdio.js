$(document).ready(function() {
    $.getJSON("http://api.songkick.com/api/3.0/events.json?location=clientip&apikey=G2KCF6q91g23Q6Zh&jsoncallback=?", function(data) {
        var template =
            '{{#event}}' +
              '<tr>' +
                '<td>{{ start.date }}</td>' +
                '<td>{{ performance.0.artist.displayName }}</td>' +
                '<td>{{ venue.displayName }}</td>' +
                '<td> Buy Tickets </td>' +
              '</tr>' +
            '{{/event}}';
        var rows = $.mustache(template, data.resultsPage.results);
        $('#body').append(rows);

        var events = data.resultsPage.results.event;
        var artists_map = {};
        for (var x = 0; x < events.length; x++) {
            for (var y = 0; y < events[x].performance.length; y++) {
                var artist = events[x].performance[y].artist.displayName;
                artists_map[artist] = true;
            }
        }

        var artists_list = new Array();
        for (artist in artists_map) {
            artists_list.push(artist);
        }

        alert(JSON.stringify(artists_list))
    });
});
