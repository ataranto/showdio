from google.appengine.ext import db

class User(db.Model):
    rdio_user = None
    creation_date = db.DateTimeProperty(required=True, auto_now_add=True)
