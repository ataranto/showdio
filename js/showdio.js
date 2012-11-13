$(document).ready(function() {
    $.getJSON("http://api.songkick.com/api/3.0/events.json?location=clientip&apikey=G2KCF6q91g23Q6Zh&jsoncallback=?", function(data) {
        events = data.resultsPage.results.event;

        for (var x = 0; x < events.length; x++) {
            var tr =
                '<tr>' +
                    '<td>' + events[x].start.date + '</td>' +
                    '<td>' + events[x].performance[0].artist.displayName + '</td>' +
                    '<td>' + events[x].venue.displayName + '</td>' +
                    '<td>' + 'Buy Tickets' + '</td>' +
                '</tr>';
            $('#body').append(tr);
        }
    });
});
