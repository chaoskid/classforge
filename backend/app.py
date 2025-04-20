from flask import Flask
from flask_cors import CORS
from database.db import Base, engine
from routes import survey_routes

app = Flask(__name__)
CORS(app)

# Create tables
Base.metadata.create_all(bind=engine)

# Register routes
app.register_blueprint(survey_routes)

if __name__ == '__main__':
    app.run(debug=True)