(function() {
    var artists = {};

    var eventTemplate =
      '<div id="{{ id }}" class="event">' +
          '{{#performance}}' +
            '{{#artist.match}}' +
              '<a class="artist_image" href="{{ artist.uri }}">' +
                '<img class="placeholder" src="/img/artist_bg.png">' +
              '</a>' +
              '<a class="artist trucated_line" href="{{ artist.uri }}">{{ artist.displayName }}</a>' +
            '{{/artist.match}}' +
          '{{/performance}}' +
          '<a class="venue truncated_line" href="{{ venue.uri }}">{{ venue.displayName }}</a>' +
          '<span class="date">{{ start.date }}</span>' +
      '</div>';

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
                    artists[artist] = response.result[x];
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
        } else if (page > 15) {
            return eventsLoaded();
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
            if (!event) {
                return eventsLoaded();
            }
            for (var x = 0; x < event.length; x++) {
                for (var y = 0; y < event[x].performance.length; y++) {
                    var artist = event[x].performance[y].artist;
                    var name = artist.displayName;

                    if (artists[name]) {
                        event[x].performance[y].artist.match = true;
                        var row = $.mustache(eventTemplate, event[x]);
                        $('#events .event_grid').append(row);

                        continue;
                    }
                }
            }

            getEvents(response.resultsPage.page + 1);
        });
    }

    function eventsLoaded() {
        var $events = $('#events');
        if ($events.find('.event').length == 0) {
            $events.append('<div class="no_results">No events found!</div>');
        }
    }

    function rdioAuthenticated() {
        $('#unauthenticated').hide();

        getArtists();
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
    });
 })();
