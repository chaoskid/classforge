from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

#DATABASE_URL = "postgresql://postgres:12345678@localhost/classforge"
DATABASE_URL = "postgresql://classforge_user:vnkWDpmrOm5FiFeRvGsaH1hOaCXW05YK@dpg-d0ecimqdbo4c73e6vco0-a.oregon-postgres.render.com/classforge"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()