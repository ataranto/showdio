(function() {
    var artists = {};

    var eventTemplate =
      '<tr id="{{ id }}"> ' +
        '<td>{{ start.date }}</td>' +
        '<td>' + 
          '{{#performance}}' +
            '<p>' +
              '<a href="{{ artist.uri }}">{{ artist.displayName }}</a>' +
            '</p>' +
          '{{/performance}}' +
        '</td>' + 
        '<td>' +
          '<a href="{{ venue.uri }}">{{ venue.displayName }}</a>' +
         '</td>' +
        '<td> Buy Tickets </td>' +
      '<tr>';

    function getArtists(start) {
        if (typeof(start) === 'undefined') start = 0;
        var batchCount = 100;

        R.request({
            method: "getArtistsInCollection",
            content: {
                start: start,
                count: batchCount
            },
            success: function(response) {
                if (response.status != 'ok' || response.result.length == 0) {
                    // XXX: log?
                    // XXX: maybe call getEvents() from here?
                    return;
                }

                for (var x = 0; x < response.result.length; x++) {
                    var artist = response.result[x].name;
                    artists[artist] = true;
                }

                if (response.result.length == batchCount) {
                    getArtists(start + response.result.length);
                } else {
                    // XXX: should use jquery deferred object
                    // http://api.jquery.com/category/deferred-object/
                    getEvents();
                }
            },
            error: function(response) {
                // XXX: handle
            }
        });
    }

    function getEvents(page) {
        if (typeof(page) === 'undefined') {
            page = 1;
        } else if (page > 5) {
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
                // XXX: log?
                return;
            }

            var event = response.resultsPage.results.event;
            for (var x = 0; x < event.length; x++) {
                for (var y = 0; y < event[x].performance.length; y++) {
                    var artist = event[x].performance[y].artist.displayName;

                    if (artist in artists) {
                        var row = $.mustache(eventTemplate, event[x]);
                        $('#tbody').append(row);

                        continue;
                    };
                }
            }

            getEvents(response.resultsPage.page + 1);
        });
    }

    function setAuthenticated(authenticated) {
        if (authenticated) {
            $('#unauthenticated').hide();
            $('#authenticated').show();
        } else {
            $('#unauthenticated').show();
            $('#authenticated').hide();
        }

        if (authenticated) {
            getArtists();
        }
    }

    $("#authenticate_button").click(function() {
        R.authenticate(function(authenticated) {
            setAuthenticated(authenticated);
        });
    });

    $(document).ready(function() {
        if ('R' in window) {
            R.ready(function() {
                setAuthenticated(R.authenticated());
            });
        } else {
            // XXX: handle no rdio error case
        }
    });
})();
