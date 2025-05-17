from database.db import Base, engine
from database.models import Base
import database.models  # ensures all models (SurveyResponse, Feedback, etc.) are registered


print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
