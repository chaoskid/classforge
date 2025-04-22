from flask import Flask
from flask_cors import CORS
from database.db import Base, engine
from routes import survey_routes

app = Flask(__name__)

app.secret_key = 'classforge-2024-secret-key'  # Required for session cookies

CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": "*"}})



# Create tables
Base.metadata.create_all(bind=engine)

# Register routes
app.register_blueprint(survey_routes)

if __name__ == '__main__':
    app.run(port=5002,debug=True)