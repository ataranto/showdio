var songkick_artists_map = {};

var event_template =
  '{{#event}}' +
    '<tr id="{{ id }}"> ' +
      '<td>{{ start.date }}</td>' +
      '<td>' + 
        '{{#performance}}' +
          '<p>{{ artist.displayName }}</p>' +
        '{{/performance}}' +
      '</td>' + 
      '<td>{{ venue.displayName }}</td>' +
      '<td> Buy Tickets </td>' +
    '<tr>' +
  '{{/event}}';
  ;

function get_events(page) {
    if (page > 5) {
        return;
    }

    var url =
        'http://api.songkick.com/api/3.0/events.json' +
        '?location=clientip' +
        '&apikey=G2KCF6q91g23Q6Zh' +
        '&page=' + page +
        '&jsoncallback=?';
    $.getJSON(url, function(response) {
        if (response.resultsPage.status != 'ok') {
            return;
        }

        var rows = $.mustache(event_template, response.resultsPage.results);
        $('#tbody').append(rows);

        var event = response.resultsPage.results.event;
        for (var x = 0; x < event.length; x++) {
            for (var y = 0; y < event[x].performance.length; y++) {
                var artist = event[x].performance[y].artist.displayName;

                if (songkick_artists_map[artist] === undefined) {
                    songkick_artists_map[artist] = [];
                }
                songkick_artists_map[artist].push(event[x].id);
            }
        }

        get_events(response.resultsPage.page + 1);
    });
}

$(document).ready(function() {
    get_events(1);
});

R.ready(function() {
    R.authenticate(function() {
        R.request({
            method: "currentUser",
            success: function(response) {
                var template = '<img src="{{ result.icon }}" />';
                var icon = $.mustache(template, response);
                $('#header').append(icon);

                var template = '<p>Hey, {{ result.firstName }}!</p>';
                var greeting = $.mustache(template, response);
                $('#header').append(greeting);
            },
            error: function(response) {
                alert("error");
            },
        });

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
