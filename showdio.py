import jinja2
import json
import logging
import os
import rdio
import urllib2
import webapp2

import secret

class Handler(webapp2.RequestHandler):
    path = os.path.join(os.path.dirname(__file__), 'templates')
    loader = jinja2.FileSystemLoader(path)
    jinja = jinja2.Environment(loader=loader)

    def __init__(self, request, response):
        self.initialize(request, response)
        self.rdio = self._get_rdio()
        self.user = self._get_user()

    def _get_rdio(self):
        token = \
            self.request.cookies.get('rt') or \
            self.request.cookies.get('at')
        token_secret = \
            self.request.cookies.get('rts') or \
            self.request.cookies.get('ats')

        if token and token_secret:
            return rdio.Rdio(
                (secret.rdio_api_key, secret.rdio_api_secret),
                (token, token_secret))
        else:
            return rdio.Rdio((secret.rdio_api_key, secret.rdio_api_secret))

    def _get_user(self):
        try:
            return self.rdio.call('currentUser', {
                'extras' : 'location',
            }).get('result')
        except Exception as ex:
            return None

    def clear_cookies(self):
        for cookie in ['at', 'ats', 'rt', 'rts']:
            self.response.delete_cookie(cookie)

    def render(self, template, values={}):
        values['user'] = self.user

        template = Handler.jinja.get_template(template)
        output = template.render(values)
        self.response.out.write(output)

class MainHandler(Handler):
    def get(self):
        if self.user is None:
            self.render('main.html')
            return
            
        rdio_artists = self.rdio.call('getArtistsInCollection', {
            'count' : 100,
        }).get('result')
        rdio_history = self.rdio.call('getPlayHistory', {
            'user' : self.user['key'],
        }).get('result')

        artists = set()
        map(lambda x: artists.add(x.get('name')), rdio_artists)
        map(lambda x: artists.add(x.get('artist')), rdio_history)

        # SF Bay Area, hardcoded
        location = 26330
        songkick_api_url = 'http://api.songkick.com/api/3.0/metro_areas/%d/calendar.json?apikey=%s' % (location, secret.songkick_api_key)

        response = urllib2.urlopen(songkick_api_url)
        all_shows = json.load(response). \
            get('resultsPage'). \
            get('results'). \
            get('event')

        shows = []
        for show in all_shows:
            for item in show['performance']:
                artist = item['artist']['displayName']
                #if artist in artists:
                # XXX: hack, just show everything for now
                if True:
                    show['headliner'] = artist
                    shows.append(show)
                    break

        self.render('main.html', {
            'shows' : shows,
        })

class LoginHandler(Handler):
    def get(self):
        self.clear_cookies()

        return_uri = self.uri_for('login_cb', _full=True)
        redirect_uri = self.rdio.begin_authentication(return_uri)

        self.response.set_cookie('rt', self.rdio.token[0], max_age=60*60*24)
        self.response.set_cookie('rts', self.rdio.token[1], max_age=60*60*24)

        self.redirect(redirect_uri)

class LoginCallbackHandler(Handler):
    def get(self):
        verifier = self.request.GET.get('oauth_verifier')
        if not verifier:
            self.clear_cookies()
        else:
            self.rdio.complete_authentication(verifier)

            self.response.set_cookie('at', self.rdio.token[0],
                max_age=60*60*24*14)
            self.response.set_cookie('ats', self.rdio.token[1],
                max_age=60*60*24*14)
            self.response.delete_cookie('rt')
            self.response.delete_cookie('rts')

        self.redirect('/')

class LogoutHandler(Handler):
    def get(self):
        self.clear_cookies()
        self.redirect('/')

class LocationHandler(Handler):
    def get(self):
        if self.user is None:
            self.redirect('/')
        else:
            self.render('location.html')

app = webapp2.WSGIApplication([
    webapp2.Route('/', handler=MainHandler),

    webapp2.Route('/login', handler=LoginHandler),
    webapp2.Route('/login_cb', handler=LoginCallbackHandler, name='login_cb'),
    webapp2.Route('/logout', handler=LogoutHandler, name='logout'),

    webapp2.Route('/location', handler=LocationHandler),
], debug=True)
