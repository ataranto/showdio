(function() {
    var artists = {};
    var animationTimeout;

    var eventTemplate =
      '<div id="{{ id }}" class="event">' +
          '{{#performance}}' +
            '{{#artist.match}}' +
              '<a class="artist_image" href="{{ artist.uri }}"></a>' +
              '<div class="metadata">' +
                '<a class="artist trucated_line" href="{{ artist.uri }}">{{ artist.displayName }}</a>' +
            '{{/artist.match}}' +
          '{{/performance}}' +
            '<a class="venue truncated_line" href="{{ venue.uri }}">{{ venue.displayName }}</a>' +
            '<span class="date">{{ start.formattedDate }}</span>' +
          '</div>' +
      '</div>';

    function getArtists(start) {
        if (typeof(start) === 'undefined') start = 0;
        var batchCount = 100;

        R.request({
            method: 'getArtistsInCollection',
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
        } else if (page > 30) {
            return eventsLoaded();
        }

        var isFirst = $('#events .event').length == 0;

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

                    event[x].start.formattedDate = formatDate(event[x].start.date);

                    if (artists[name]) {
                        artist.match = true;
                        artist.rdioKey = artists[name].artistKey;
                        var row = $.mustache(eventTemplate, event[x]);
                        $('#events .event_grid').append(row);

                        if (isFirst) {
                            showLoading('lower_left', 'Loading more shows');
                            isFirst = false;
                        }

                        getArtistArt(artist, event[x]);

                        break;
                    }
                }
            }

            getEvents(response.resultsPage.page + 1);
        });
    }

    function setAuthenticated(authenticated) {
        if (authenticated) {
            $('#unauthenticated').hide();
            $('#events').show();

            showLoading();
            getArtists();
        } else {
            $('#unauthenticated').show();
            $('#events').hide();
        }
    }

    function formatDate(dateStr) {
        var parts = dateStr.split('-');
        var month = parseInt(parts[1], 10);
        var day = parseInt(parts[2], 10);
        var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return months[month-1] + ' ' + day;
    }

    function showLoading(extraClass, message) {
        var $loading = $('#loading');
        var $dot = $loading.find('.dot');
        if (extraClass) {
            $loading.addClass(extraClass);
        }
        if (message) {
            $loading.find('.message').html(message);
        }
        if (!animationTimeout) {
            animationTimeout = setInterval(function() {
                console.log('checking');
                if ($dot.hasClass('fade')) {
                    $dot.removeClass('fade');
                } else {
                    $dot.addClass('fade');
                }
            }, 2000);
        }
        $loading.show();
    }

    function hideLoading() {
        $('#loading').hide();
        clearInterval(animationTimeout);
    }

    function getArtistArt(artist, event) {

        R.request({
            method: 'getAlbumsForArtist',
            content: {
                artist: artist.rdioKey,
                start: 0,
                count: 1,
                sort: 'playCount'
            },
            success: function(response) {
                var img_template =
                    '<img class="loaded_image" src="{{ result.0.icon }}">';
                var img = $.mustache(img_template, response);
                $('#' + event.id).find('.artist_image').append(img);
            }
        });
    }

    function eventsLoaded() {
        hideLoading();
        var $events = $('#events');
        if ($events.find('.event').length == 0) {
            $events.append('<div class="no_results">No events found!</div>');
        }
    }

    $('#authenticate_button').click(function() {
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
