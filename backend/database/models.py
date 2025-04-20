from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from .db import Base

class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    home_language = Column(String)
    happiness = Column(Integer)

    # School experience questions
    school_q1 = Column(Integer)
    school_q2 = Column(Integer)
    school_q3 = Column(Integer)
    school_q4 = Column(Integer)
    school_q5 = Column(Integer)
    school_q6 = Column(Integer)

    # Opinion questions
    opinion_q1 = Column(Integer)
    opinion_q2 = Column(Integer)
    opinion_q3 = Column(Integer)
    opinion_q4 = Column(Integer)
    opinion_q5 = Column(Integer)
    opinion_q6 = Column(Integer)
    opinion_q7 = Column(Integer)
    opinion_q8 = Column(Integer)

    # Network text questions
    friends = Column(Text)
    advice = Column(Text)
    disrespect = Column(Text)
    popular = Column(Text)
    more_time = Column(Text)
    feedback = Column(Text)
    activities = Column(Text)

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
    
