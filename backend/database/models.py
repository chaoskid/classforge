from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from sqlalchemy.sql import func
from .db import Base

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    student_id = Column(Integer, primary_key=True)
    home_lang_ans = Column(String)

    # School experience questions
    comfortability_ans = Column(Integer)
    isolated_ans = Column(Integer)
    criticise_school_ans = Column(Integer)
    opinion_school_ans = Column(Integer)
    bullying_ans = Column(Integer)
    future_ans = Column(Integer)
    covid_ans = Column(Integer)    

    # wellbeing questions
    how_happy_ans = Column(Integer)
    nervous_ans = Column(Integer)
    hopeless_ans = Column(Integer)
    restless_ans = Column(Integer)
    depressed_ans = Column(Integer)
    effort_ans = Column(Integer)
    worthless_ans = Column(Integer)
    
    # growth mindset questions
    intelligence1_ans = Column(Integer)
    intelligence2_ans = Column(Integer)

    # gender norms questions
    man_chores_opinion = Column(Integer)
    man_violence_opinion = Column(Integer)
    man_sexual_opinion = Column(Integer)
    man_fears_opinion = Column(Integer)
    gay_man_opinion = Column(Integer)
    
    # social attitude questions
    soft_sport_boys_ans = Column(Integer)
    gender_diff_ans = Column(Integer)
    nerds_ans = Column(Integer)
    men_better_stem_ans = Column(Integer)

    submitted_at = Column(DateTime(timezone=True), server_default=func.now())


class CalculatedScores(Base):
    __tablename__ = "calculated_scores"

    id = Column(Integer, primary_key=True, index=True)
    academic_engagement_score = Column(String)
    academic_wellbeing_score = Column(String)
    mental_health_score = Column(String)
    growth_mindset_score = Column(String)
    gender_norm_score = Column(String)
    social_attitude_score = Column(String)
    school_environment_score = Column(String)

class Users(Base):
    __tablename__ = "users"

    user_email = Column(String, primary_key=True)
    password = Column(String)
    user_type = Column(String)  

class Teachers(Base):
    __tablename__ = "teachers"

    emp_id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    manage_unit = Column(String)

class Students(Base):
    __tablename__ = "students"

    student_id = Column(Integer, primary_key=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    house = Column(String)
    years = Column(Integer)
    academic_score = Column(Float, nullable=True)

class Relationships(Base):
    __tablename__ = "relationships"

    source = Column(Integer, primary_key = True)
    target = Column(Integer)
    link_type = Column(String)

class Allocations(Base):
    __tablename__ = "allocations"

    unit_id = Column(Integer, primary_key = True)
    student_id = Column(Integer, primary_key = True)
    class_id = Column(Integer)

class Unit(Base):
    __tablename__ = "unit"

    unit_id = Column(Integer, primary_key = True)
    unit_name = Column(String)

class Affiliations(Base):
    __tablename__ = "affiliations"

    student_id = Column(Integer, primary_key = True)
    club_id = Column(Integer, primary_key = True)

class Clubs(Base):
    __tablename__ = "clubs"

    club_id = Column(Integer, primary_key = True)
    club_name = Column(String)

