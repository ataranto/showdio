import jinja2
import os
import webapp2
import rdio

import secret

class Handler(webapp2.RequestHandler):
    path = os.path.join(os.path.dirname(__file__), 'templates')
    loader = jinja2.FileSystemLoader(path)
    jinja = jinja2.Environment(loader=loader)

    def __init__(self, request, response):
        self.initialize(request, response)
        self.rdio = self._get_rdio()

    # memoize/property
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

    # memoize/property
    def _get_user(self):
        try:
            return self.rdio.call('currentUser').get('result')
        except Exception as ex:
            return None

    def clear_cookies(self):
        for cookie in ['at', 'ats', 'rt', 'rts']:
            self.response.delete_cookie(cookie)

    def render(self, template, values={}):
        values['rdio_token'] = self.rdio.token
        values['user'] = self._get_user()

        template = Handler.jinja.get_template(template)
        output = template.render(values)
        self.response.out.write(output)

class MainHandler(Handler):
    def get(self):
        self.render('main.html')

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

app = webapp2.WSGIApplication([
    webapp2.Route('/', handler=MainHandler),

    webapp2.Route('/login', handler=LoginHandler),
    webapp2.Route('/login_cb', handler=LoginCallbackHandler, name='login_cb'),
    webapp2.Route('/logout', handler=LogoutHandler, name='logout'),
], debug=True)
