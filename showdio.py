import jinja2
import os
import webapp2

class Handler(webapp2.RequestHandler):
    path = os.path.join(os.path.dirname(__file__), 'templates')
    loader = jinja2.FileSystemLoader(path)
    jinja = jinja2.Environment(loader=loader)

    def __init__(self, request, response):
        self.initialize(request, response)

    def render(self, template, values={}):
        template = Handler.jinja.get_template(template)
        output = template.render(values)
        self.response.out.write(output)

class MainHandler(Handler):
    def get(self):
        self.render('main.html')

app = webapp2.WSGIApplication([
    webapp2.Route('/', handler=MainHandler),
], debug=True)
