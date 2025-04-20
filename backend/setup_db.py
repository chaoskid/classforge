from database.db import Base, engine
from database.models import SurveyResponse

print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
