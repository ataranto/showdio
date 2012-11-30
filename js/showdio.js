(function() {
    var songkickArtistsMap = {};

    var eventTemplate =
      '{{#event}}' +
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
        '<tr>' +
      '{{/event}}';

    function getEvents(page) {
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
                // XXX: log?
                return;
            }

            var rows = $.mustache(eventTemplate, response.resultsPage.results);
            $('#tbody').append(rows);

            var event = response.resultsPage.results.event;
            for (var x = 0; x < event.length; x++) {
                for (var y = 0; y < event[x].performance.length; y++) {
                    var artist = event[x].performance[y].artist.displayName;

                    if (songkickArtistsMap[artist] === undefined) {
                        songkickArtistsMap[artist] = [];
                    }
                    songkickArtistsMap[artist].push(event[x].id);
                }
            }

            getEvents(response.resultsPage.page + 1);
        });
    }

    function getArtists(start) {
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
                    return;
                }

                for (var x = 0; x < response.result.length; x++) {
                    var artist = response.result[x].name;
                    if (artist in songkickArtistsMap) {
                        var events = songkickArtistsMap[artist];
                        for (var y = 0; y < events.length; y++) {
                            $('#' + events[y]).
                                css('background-color', 'yellow');
                        }
                    }
                }

                if (response.result.length == batchCount) {
                    getArtists(start + response.result.length);
                }
            },
            error: function(response) {
                // XXX: handle
            }
        });
    }

    function rdioAuthenticated() {
        $('#unauthenticated').hide();

        var template = '<img src="{{ icon }}" />';
        var icon = $.mustache(template, R.currentUser);
        $('#header').append(icon);

        var template = '<p>Hey, {{ firstName }}!</p>';
        var greeting = $.mustache(template, R.currentUser);
        $('#header').append(greeting);

        getArtists(0);
    }

    $("#authenticate_button").click(function() {
        R.authenticate(function(authenticated) {
            if (authenticated) {
                rdioAuthenticated();
            }
        });
    });

    $(document).ready(function() {
        if ('R' in window) {
            R.ready(function() {
                if (R.authenticated()) {
                    rdioAuthenticated();           
                } else {
                    $('#unauthenticated').show();
                    // XXX: show some unauthenticated ui
                }
            });
        } else {
            // XXX: handle no rdio error case
        }

        getEvents(1);
    });
 })();
